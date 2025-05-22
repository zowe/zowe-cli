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
import { BaseAuthHandler, Config, IHandlerParameters, ImperativeConfig, SessConstants } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { Login, Logout } from "@zowe/core-for-zowe-sdk";
import { ConfigLayers } from "../../../../imperative/src/config/src/api/ConfigLayers";

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
            expect(logMessage).toContain('"authOrder": "token"');
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
            expect(logMessage).toContain('"authOrder": "token"');
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
            expect(logMessage).toContain('"authOrder": "token"');
        });

        it("should do nothing if zosmf profile already has token at start of authOrder", async () => {
            const layersGetSpy = jest.spyOn(ConfigLayers.prototype, "get").mockReturnValue({} as any);

            // Pretend that we have a team config.
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: true,
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
                            } as any,
                            layers: {
                                get: layersGetSpy
                            } as any

                        }
                    };
                })
            });

            const handler: any = new ApimlAuthHandler();
            await handler.processLogin(loginParams);
            expect(layersGetSpy).not.toHaveBeenCalled();
        });

        it("should detect no authOrder property in zosmf profile and set authOrder to token", async () => {
            const layersGetSpy = jest.spyOn(ConfigLayers.prototype, "get").mockReturnValue({} as any);
            const layersFindSpy = jest.spyOn(ConfigLayers.prototype, "find").mockReturnValue({} as any);
            const layersActivateSpy = jest.spyOn(ConfigLayers.prototype, "activate").mockReturnValue({} as any);
            const profGetProfPathSpy = jest.spyOn(Config.prototype.api.profiles,
                "getProfilePathFromName").mockReturnValue("Fake.Profile.Path");
            const configSaveSpy = jest.spyOn(Config.prototype, "save").mockReturnValue(null);
            const configSetSpy = jest.spyOn(Config.prototype, "set").mockReturnValue(null);

            // Pretend that we have a team config.
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: true,
                        properties: {
                            defaults: {
                                base: "PretendWeHaveBaseProfile",
                                zosmf: "ExistingZosmfProfile"
                            }
                        },
                        save: configSaveSpy,
                        set: configSetSpy,
                        api: {
                            profiles: {
                                exists: jest.fn().mockImplementation(() => {
                                    return true;
                                }),
                                get: jest.fn(() => {
                                    return {
                                        exists: true,
                                        basePath: "PretendThisBasePathWorks"
                                    };
                                }),
                                getProfilePathFromName: profGetProfPathSpy
                            } as any,
                            layers: {
                                get: layersGetSpy,
                                find: layersFindSpy,
                                activate: layersActivateSpy
                            } as any

                        }
                    };
                })
            });

            const handler: any = new ApimlAuthHandler();
            await handler.processLogin(loginParams);
            expect(layersGetSpy).toHaveBeenCalled();
            expect(layersFindSpy).toHaveBeenCalled();
            expect(layersActivateSpy).toHaveBeenCalled();
            expect(profGetProfPathSpy).toHaveBeenCalled();
            expect(configSetSpy).toHaveBeenCalledWith("Fake.Profile.Path.properties.authOrder", "token, bearer");
            expect(configSaveSpy).toHaveBeenCalled();
        });

        it("should detect token not at start of authOrder in zosmf profile and set authOrder to token", async () => {
            const layersGetSpy = jest.spyOn(ConfigLayers.prototype, "get").mockReturnValue({} as any);
            const layersFindSpy = jest.spyOn(ConfigLayers.prototype, "find").mockReturnValue({} as any);
            const layersActivateSpy = jest.spyOn(ConfigLayers.prototype, "activate").mockReturnValue({} as any);
            const profGetProfPathSpy = jest.spyOn(Config.prototype.api.profiles,
                "getProfilePathFromName").mockReturnValue("Fake.Profile.Path");
            const configSaveSpy = jest.spyOn(Config.prototype, "save").mockReturnValue(null);
            const configSetSpy = jest.spyOn(Config.prototype, "set").mockReturnValue(null);

            // Pretend that we have a team config.
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: true,
                        properties: {
                            defaults: {
                                base: "PretendWeHaveBaseProfile",
                                zosmf: "ExistingZosmfProfile"
                            }
                        },
                        save: configSaveSpy,
                        set: configSetSpy,
                        api: {
                            profiles: {
                                exists: jest.fn().mockImplementation(() => {
                                    return true;
                                }),
                                get: jest.fn(() => {
                                    return {
                                        exists: true,
                                        basePath: "PretendThisBasePathWorks",
                                        authOrder: "basic, token, bearer"
                                    };
                                }),
                                getProfilePathFromName: profGetProfPathSpy
                            } as any,
                            layers: {
                                get: layersGetSpy,
                                find: layersFindSpy,
                                activate: layersActivateSpy
                            } as any

                        }
                    };
                })
            });

            const handler: any = new ApimlAuthHandler();
            await handler.processLogin(loginParams);
            expect(layersGetSpy).toHaveBeenCalled();
            expect(layersFindSpy).toHaveBeenCalled();
            expect(layersActivateSpy).toHaveBeenCalled();
            expect(profGetProfPathSpy).toHaveBeenCalled();
            expect(configSetSpy).toHaveBeenCalledWith("Fake.Profile.Path.properties.authOrder", "token, bearer");
            expect(configSaveSpy).toHaveBeenCalled();
        });
    });
});
