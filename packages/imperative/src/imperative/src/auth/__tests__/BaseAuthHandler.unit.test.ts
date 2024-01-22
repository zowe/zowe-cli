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

import { IHandlerParameters } from "../../../../cmd";
import { ConnectionPropsForSessCfg } from "../../../..";
import { ImperativeConfig } from "../../../..";
import FakeAuthHandler from "./__data__/FakeAuthHandler";

describe("BaseAuthHandler", () => {
    const configSaveMock = jest.fn();
    let teamCfgExistsMock = jest.fn(() => true);
    let profileExistsMock = jest.fn(() => true);

    beforeAll(() => {
        // we do not want to call the real addPropsOrPrompt
        ConnectionPropsForSessCfg.addPropsOrPrompt = jest.fn((): any => ({
            hostname: "connHostNm",
            port: 5678,
            user: "connUser",
            password: "connPassword"
        }));

        // we do not want to use the real ImperativeConfig
        Object.defineProperty(ImperativeConfig, "instance", {
            get: () => ({
                cliHome: (): string => "/fake/cli/home/path",
                envVariablePrefix: (): string => "FAKE_ZOWE_CLI_PREFIX",
                config: {
                    exists: teamCfgExistsMock,
                    set: (): any => null,
                    save: configSaveMock,
                    properties: {
                        defaults: { "zosmf": "fakeProfNm" },
                        profiles: {
                            fakeProfNm: {
                                type: "zosmf",
                                host: "fakeHostNm",
                                port: 1234
                            }
                        }
                    },
                    api: {
                        secure: {
                            loadFailed: false,
                            securePropsForProfile: (): any => []
                        },
                        profiles: {
                            get: () => ({
                                fakeProfNm: {
                                    type: "zosmf",
                                    host: "fakeHostNm",
                                    port: 1234
                                }
                            }),
                            set: jest.fn(),
                            defaultSet: jest.fn(),
                            exists: profileExistsMock,
                            getProfilePathFromName: () => "fake/path"
                        },
                        layers: {
                            get: () => ({
                                path: "fake/path",
                                exists: true,
                                properties: {},
                                global: true,
                                user: false
                            }),
                            find: () => ({
                                user: false,
                                global: true
                            }),
                            activate: (): any => null
                        }
                    }
                }
            })
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should process login successfully and update profile", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {
                user: "fakeUser",
                password: "fakePass"
            },
            positionals: ["auth", "login"],
            profiles: {}
        } as any;

        // report that we have a team config and a profile
        teamCfgExistsMock = jest.fn(() => true);
        profileExistsMock = jest.fn(() => true);

        const doLoginSpy = jest.spyOn(handler as any, "doLogin");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLoginSpy).toHaveBeenCalledTimes(1);
        expect(configSaveMock).toHaveBeenCalledTimes(1);
    });

    it("should process login successfully and create profile", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn(),
                    prompt: jest.fn(async () => "y")
                }
            },
            arguments: {
                user: "fakeUser",
                password: "fakePass"
            },
            positionals: ["auth", "login"]
        } as any;

        // report user and password are in our secure properties
        ImperativeConfig.instance.config.api.secure.securePropsForProfile = (): any => ["user", "password"];

        // report that we have no team config and no profile
        teamCfgExistsMock = jest.fn(() => false);
        profileExistsMock = jest.fn(() => false);

        const doLoginSpy = jest.spyOn(handler as any, "doLogin");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLoginSpy).toHaveBeenCalledTimes(1);
        expect(params.response.console.prompt).toHaveBeenCalledTimes(1);
        expect(configSaveMock).toHaveBeenCalledTimes(1);
    });

    it("should process login successfully without creating profile on timeout", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn(),
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
            positionals: ["auth", "login"]
        } as any;

        // report that we have no team config and no profile
        teamCfgExistsMock = jest.fn(() => false);
        profileExistsMock = jest.fn(() => false);

        const doLoginSpy = jest.spyOn(handler as any, "doLogin");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLoginSpy).toHaveBeenCalledTimes(1);
        expect(params.response.console.prompt).toHaveBeenCalledTimes(1);
        expect(configSaveMock).toHaveBeenCalledTimes(0);
    });

    it("should process logout successfully", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {
                host: "fakeHost",
                port: "fakePort",
                // Purposely remove the token type to test that we still provide a default token type
                tokenValue: "fakeToken",
                // Add user and password to prove that they get removed and are not required for logout
                user: "fakeUser",
                password: "fakePass"
            },
            positionals: ["auth", "logout"]
        } as any;

        // report that we have a team config and a profile
        teamCfgExistsMock = jest.fn(() => true);
        profileExistsMock = jest.fn(() => true);

        const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLogoutSpy).toHaveBeenCalledTimes(1);
        expect(params.arguments.tokenType).toEqual(handler.mDefaultTokenType);
        expect(params.arguments.user).toBeUndefined();
        expect(params.arguments.password).toBeUndefined();
        expect(configSaveMock).toHaveBeenCalledTimes(0);

    });

    it("should not logout when tokenValue is not provided", async () => {
        let errMsg: string = "";
        let exitCode: number = 0;
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn(),
                    errorHeader: jest.fn((_errMsg) => {
                        errMsg += _errMsg + "\n";
                    }),
                    error: jest.fn((_errMsg) => {
                        errMsg += _errMsg + "\n";
                    }),
                },
                data: {
                    setExitCode: jest.fn((_exitCode) => {
                        exitCode = _exitCode;
                    })
                }
            },
            arguments: {
                host: "fakeHost",
                port: "fakePort",
                tokenType: handler.mDefaultTokenType,
                tokenValue: null,
            },
            positionals: ["auth", "logout"]
        } as any;

        // report that we have a team config and a profile
        teamCfgExistsMock = jest.fn(() => true);
        profileExistsMock = jest.fn(() => true);

        const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLogoutSpy).toHaveBeenCalledTimes(0);
        expect(errMsg).toContain("Token was not provided, so can't log out");
        expect(errMsg).toContain("You need to authenticate first using `zowe auth login`");
        expect(exitCode).toEqual(1);
    });

    it("should fail to process invalid action name", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {},
            positionals: ["auth", "invalid"]
        } as any;

        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain(`The group name "invalid"`);
        expect(caughtError.message).toContain("is not valid");
    });

    it("should fail to login with invalid token value", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {
                user: "fakeUser",
                password: "fakePass"
            },
            positionals: ["auth", "login"]
        } as any;

        const doLoginSpy = jest.spyOn(handler as any, "doLogin").mockResolvedValue(null);
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain("token value");
        expect(doLoginSpy).toBeCalledTimes(1);
    });
});
