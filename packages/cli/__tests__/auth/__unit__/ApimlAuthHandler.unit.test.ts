/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import ApimlAuthHandler from "../../../src/auth/ApimlAuthHandler";
import { AuthOrder, BaseAuthHandler, IHandlerParameters, ImperativeConfig, SessConstants } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { Login, Logout } from "@zowe/core-for-zowe-sdk";

describe("ApimlAuthHandler", () => {
    it("should not have changed", () => {
        const mockCreateZosmfSession = jest.fn();
        const mockApimlLogin = jest.fn();
        const mockApimlLogout = jest.fn();

        ZosmfSession.createSessCfgFromArgs = mockCreateZosmfSession;
        Login.apimlLogin = mockApimlLogin;
        Logout.apimlLogout = mockApimlLogout;

        const handler: any = new ApimlAuthHandler();
        expect(handler.mProfileType).toBe("base");
        expect(handler.mDefaultTokenType).toBe(SessConstants.TOKEN_TYPE_APIML);

        handler.createSessCfgFromArgs();
        expect(mockCreateZosmfSession).toHaveBeenCalledTimes(1);

        handler.doLogin();
        expect(mockApimlLogin).toHaveBeenCalledTimes(1);

        handler.doLogout();
        expect(mockApimlLogout).toHaveBeenCalledTimes(1);
    });

    describe("processLogin", () => {
        // mock our super class processLogin function
        const baseProcessLoginSpy = jest.spyOn((BaseAuthHandler as any).prototype, "processLogin").mockImplementation(jest.fn());

        let logMessage = "";
        const loginParams: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn((logArgs) => {
                        logMessage += "\n" + logArgs;
                    }),
                    prompt: jest.fn()
                },
                data: {
                    setObj: jest.fn()
                }
            },
            arguments: {
                user: "fakeUser",
                password: "fakePass"
            },
            positionals: ["auth", "login", "creds"],
            definition: {}
        } as any;

        beforeEach(() => {
            logMessage = "";
        });

        it("should handle no default zosmf profile", async () => {
            // Pretend that we have a team config.
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: true,
                        properties: {
                            defaults: {
                                base: "PretendWeHaveBaseProfile" // but no default zosmf profile
                            }
                        }
                    };
                })
            });
            const handler: any = new ApimlAuthHandler();

            await handler.processLogin(loginParams);
            expect(baseProcessLoginSpy).toHaveBeenCalled();
            expect(logMessage).toContain("You have no default zosmf profile. " +
                "Add the following authOrder property to a zosmf profile that contains a basePath property"
            );
            expect(logMessage).toContain('"authOrder": "token, bearer"');
        });

        it("should handle non-existent zosmf profile", async () => {
            // Pretend that we have a team config.
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: true,
                        properties: {
                            defaults: {
                                base: "PretendWeHaveBaseProfile",
                                zosmf: "ThisZosmfProfileDoesNotExist"
                            }
                        },
                        api: {
                            profiles: {
                                exists: jest.fn().mockImplementation(() => {
                                    return false;
                                })
                            } as any
                        }
                    };
                })
            });
            const handler: any = new ApimlAuthHandler();

            await handler.processLogin(loginParams);
            expect(logMessage).toContain("Your default zosmf profile (ThisZosmfProfileDoesNotExist) does not exist");
            expect(logMessage).toContain("Add the following authOrder property to a zosmf profile that contains a basePath property");
            expect(logMessage).toContain('"authOrder": "token, bearer"');
        });

        it("should handle zosmf profile with no basePath", async () => {
            // Pretend that we have a team config.
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: true,
                        properties: {
                            defaults: {
                                base: "PretendWeHaveBaseProfile",
                                zosmf: "ThisZosmfProfileDoesNotExist"
                            }
                        },
                        api: {
                            profiles: {
                                exists: jest.fn().mockImplementation(() => {
                                    return true;
                                }),
                                get: jest.fn(() => {
                                    return {
                                        exists: true
                                    };
                                })
                            } as any
                        }
                    };
                })
            });

            const handler: any = new ApimlAuthHandler();

            await handler.processLogin(loginParams);
            expect(logMessage).toContain("Your default zosmf profile (ThisZosmfProfileDoesNotExist) has no basePath");
            expect(logMessage).toContain("thus it cannot be used with APIML");
            expect(logMessage).toContain("Add the following authOrder property to a zosmf profile that contains a basePath property");
            expect(logMessage).toContain('"authOrder": "token, bearer"');
        });

        it("should call AuthOrder.putNewAuthsFirstOnDisk to do the work", async () => {
            const putNewAuthsFirstOnDiskSpy = jest.spyOn(AuthOrder as any, "putNewAuthsFirstOnDisk").mockReturnValue("fakeAuthCfgVal");

            // Config object properties and functions used by processLogin
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        properties: {
                            defaults: {
                                base: "PretendWeHaveBaseProfile",
                                zosmf: "ExistingZosmfProfile"
                            }
                        },
                        api: {
                            profiles: {
                                exists: jest.fn().mockImplementation(() => {
                                    return true;
                                }),
                                get: jest.fn(() => {
                                    return {
                                        exists: true,
                                        basePath: "PretendThisBasePathWorks",
                                        authOrder: "token, bearer, basic"
                                    };
                                })
                            } as any
                        }
                    };
                })
            });

            const handler: any = new ApimlAuthHandler();
            await handler.processLogin(loginParams);
            expect(putNewAuthsFirstOnDiskSpy).toHaveBeenCalled();
        });
    });
});
