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

jest.mock("../../../../logger/src/LoggerUtils");
import * as fs from "fs";
import * as path from "path";
import * as lodash from "lodash";
import { IHandlerParameters } from "../../../../cmd";
import { SessConstants } from "../../../../rest";
import { ImperativeConfig } from "../../../../utilities";
import { Config } from "../../../../config";
import { IConfigSecure } from "../../../../config/src/doc/IConfigSecure";
import FakeAuthHandler from "./__data__/FakeAuthHandler";
import { CredentialManagerFactory } from "../../../../security";
import { ImperativeError } from "../../../..";

const MY_APP = "my_app";

function secureConfig(file: string, profileName: string): IConfigSecure {
    return {
        [file]: {
            [`profiles.${profileName}.properties.tokenValue`]: "fakeToken"
        }
    };
}

describe("BaseAuthHandler config", () => {
    let fakeConfig: Config;

    beforeAll(() => {
        Object.defineProperty(CredentialManagerFactory, "initialized", { get: () => true });
        Object.defineProperty(ImperativeConfig, "instance", {
            get: () => ({
                config: fakeConfig,
                loadedConfig: { envVariablePrefix: "FAKE" }
            })
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe("login", () => {
        const configPath = __dirname + `/__resources__/no_auth.config.json`;
        const fakeVault = {
            load: jest.fn(),
            save: jest.fn()
        };

        const mockSetObj = jest.fn();
        const loginParams: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn(),
                    prompt: jest.fn()
                },
                data: {
                    setObj: mockSetObj
                }
            },
            arguments: {
                user: "fakeUser",
                password: "fakePass"
            },
            positionals: ["auth", "login", "creds"],
            definition: {}
        } as any;

        describe("default layer", () => {
            beforeEach(async () => {
                jest.spyOn(Config, "search").mockReturnValue(configPath);
                jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false);
                fakeConfig = await Config.load(MY_APP, { vault: fakeVault });
            });

            it("should show token without creating profile if showToken is specified", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);
                params.arguments.showToken = true;

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync");
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(writeFileSpy).not.toHaveBeenCalled();
                expect(mockSetObj).toBeCalledTimes(1);
                expect(mockSetObj.mock.calls[0][0]).toEqual({ tokenType: handler.mDefaultTokenType, tokenValue: "fakeToken" });
            });

            it("should show token without creating profile if prompt times out", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync");
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(params.response.console.prompt).toBeCalledTimes(1);
                expect(writeFileSpy).not.toHaveBeenCalled();
                expect(mockSetObj).toBeCalledTimes(1);
                expect(mockSetObj.mock.calls[0][0]).toEqual({ tokenType: handler.mDefaultTokenType, tokenValue: "fakeToken" });
            });

            it("should show token without creating profile if user rejects prompt", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                params.response.console.prompt = jest.fn(async () => "n");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync");
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(params.response.console.prompt).toBeCalledTimes(1);
                expect(writeFileSpy).not.toHaveBeenCalled();
                expect(mockSetObj).toBeCalledTimes(1);
                expect(mockSetObj.mock.calls[0][0]).toEqual({ tokenType: handler.mDefaultTokenType, tokenValue: "fakeToken" });
            });

            it("should fail if unable to securely save credentials", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);

                jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValueOnce(false);
                jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValueOnce({ secureErrorDetails: jest.fn() } as any);
                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync");
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeDefined();
                expect(caughtError.message).toBe("Unable to securely save credentials.");
                expect(caughtError).toBeInstanceOf(ImperativeError);
                expect(caughtError.additionalDetails).toContain("FAKE_OPT_TOKEN_VALUE");
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(writeFileSpy).not.toHaveBeenCalled();
            });

            it("should create new profile if user accepts prompt", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);
                expect(fakeConfig.properties.profiles.fruit_creds).toBeUndefined();

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                params.response.console.prompt = jest.fn(async () => "y");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(params.response.console.prompt).toBeCalledTimes(1);
                expect(writeFileSpy).toBeCalledTimes(1);
                expect(fakeVault.save).toBeCalledTimes(1);

                expect(fakeVault.save.mock.calls[0][1]).toContain(`"profiles.fruit_creds.properties.tokenValue":"fakeToken"`);
                expect(fakeConfig.properties.profiles.fruit_creds.properties).toEqual({
                    host: "fakeHost",
                    port: 3000,
                    tokenType: handler.mDefaultTokenType,
                    tokenValue: "fakeToken"
                });

                const layer = (fakeConfig as any).layerActive();
                expect(layer.user).toBe(false);
                expect(layer.global).toBe(false);
                expect(layer.properties.defaults.fruit).toBe("fruit_creds");
                expect(layer.properties.profiles.fruit_creds.secure).toContain("tokenValue");
            });

            it("should create new profile if existing base profile contains user/password", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);
                params.arguments["fruit-profile"] = "fruit";
                expect(fakeConfig.properties.profiles.fruit_creds).toBeUndefined();

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                params.response.console.prompt = jest.fn(async () => "y");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(params.response.console.prompt).toBeCalledTimes(1);
                expect(writeFileSpy).toBeCalledTimes(1);
                expect(fakeVault.save).toBeCalledTimes(1);

                expect(fakeVault.save.mock.calls[0][1]).toContain(`"profiles.fruit_creds.properties.tokenValue":"fakeToken"`);
                expect(fakeConfig.properties.profiles.fruit_creds.properties).toEqual({
                    host: "fakeHost",
                    port: 3000,
                    tokenType: handler.mDefaultTokenType,
                    tokenValue: "fakeToken"
                });

                const layer = (fakeConfig as any).layerActive();
                expect(layer.user).toBe(false);
                expect(layer.global).toBe(false);
                expect(layer.properties.defaults.fruit).toBe("fruit_creds");
                expect(layer.properties.profiles.fruit_creds.secure).toContain("tokenValue");
            });

            it("should update existing base profile if it doesn't contain user/password", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);
                fakeConfig.api.profiles.defaultSet("fruit", "fruit");
                (fakeConfig as any).layerActive().properties.profiles.fruit.secure = [];

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(writeFileSpy).toBeCalledTimes(1);
                expect(fakeVault.save).toBeCalledTimes(1);
                expect(fakeConfig.properties.profiles.fruit_creds).toBeUndefined();

                expect(fakeVault.save.mock.calls[0][1]).toContain(`"profiles.fruit.properties.tokenValue":"fakeToken"`);
                expect(fakeConfig.properties.profiles.fruit.properties).toEqual({
                    protocol: "ftp",
                    tokenType: handler.mDefaultTokenType,
                    tokenValue: "fakeToken"
                });

                const layer = (fakeConfig as any).layerActive();
                expect(layer.user).toBe(false);
                expect(layer.global).toBe(false);
                expect(layer.properties.profiles.fruit.secure).toContain("tokenValue");
            });
        });

        describe("project user layer", () => {
            beforeEach(async () => {
                jest.spyOn(Config, "search").mockReturnValueOnce(configPath).mockReturnValue("fakePath");
                jest.spyOn(fs, "existsSync")
                    .mockReturnValueOnce(true)      // Project user layer
                    .mockReturnValueOnce(false)     // Project layer
                    .mockReturnValueOnce(false)     // User layer
                    .mockReturnValueOnce(false);    // Global layer
                fakeConfig = await Config.load(MY_APP, { vault: fakeVault });
            });

            it("should update existing base profile if it doesn't contain user/password", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);
                fakeConfig.api.profiles.defaultSet("fruit", "fruit");
                (fakeConfig as any).layerActive().properties.profiles.fruit.secure = [];

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(writeFileSpy).toBeCalledTimes(1);
                expect(fakeVault.save).toBeCalledTimes(1);
                expect(fakeConfig.properties.profiles.fruit_creds).toBeUndefined();

                expect(fakeVault.save.mock.calls[0][1]).toContain(`"profiles.fruit.properties.tokenValue":"fakeToken"`);
                expect(fakeConfig.properties.profiles.fruit.properties).toEqual({
                    protocol: "ftp",
                    tokenType: handler.mDefaultTokenType,
                    tokenValue: "fakeToken"
                });

                const layer = (fakeConfig as any).layerActive();
                expect(layer.user).toBe(true);
                expect(layer.global).toBe(false);
                expect(layer.properties.profiles.fruit.secure).toContain("tokenValue");
            });
        });

        describe("global layer", () => {
            beforeEach(async () => {
                jest.spyOn(Config, "search").mockReturnValue("fakePath");
                jest.spyOn(fs, "existsSync")
                    .mockReturnValueOnce(false)     // Project user layer
                    .mockReturnValueOnce(false)     // Project layer
                    .mockReturnValueOnce(false)     // User layer
                    .mockReturnValueOnce(true);     // Global layer
                jest.spyOn(path, "join").mockReturnValueOnce("fakePath").mockReturnValueOnce(configPath);
                fakeConfig = await Config.load(MY_APP, { homeDir: "fakeHome", vault: fakeVault });
            });

            it("should update existing base profile if it doesn't contain user/password", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);
                fakeConfig.api.profiles.defaultSet("fruit", "fruit");
                (fakeConfig as any).layerActive().properties.profiles.fruit.secure = [];

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(writeFileSpy).toBeCalledTimes(1);
                expect(fakeVault.save).toBeCalledTimes(1);
                expect(fakeConfig.properties.profiles.fruit_creds).toBeUndefined();

                expect(fakeVault.save.mock.calls[0][1]).toContain(`"profiles.fruit.properties.tokenValue":"fakeToken"`);
                expect(fakeConfig.properties.profiles.fruit.properties).toEqual({
                    protocol: "ftp",
                    tokenType: handler.mDefaultTokenType,
                    tokenValue: "fakeToken"
                });

                const layer = (fakeConfig as any).layerActive();
                expect(layer.user).toBe(false);
                expect(layer.global).toBe(true);
                expect(layer.properties.profiles.fruit.secure).toContain("tokenValue");
            });
        });

        describe("global user layer", () => {
            beforeEach(async () => {
                jest.spyOn(Config, "search").mockReturnValue("fakePath");
                jest.spyOn(fs, "existsSync")
                    .mockReturnValueOnce(false)     // Project user layer
                    .mockReturnValueOnce(false)     // Project layer
                    .mockReturnValueOnce(true)      // User layer
                    .mockReturnValueOnce(false);    // Global layer
                jest.spyOn(path, "join").mockReturnValueOnce(configPath).mockReturnValueOnce("fakePath");
                fakeConfig = await Config.load(MY_APP, { homeDir: "fakeHome", vault: fakeVault });
            });

            it("should update existing base profile if it doesn't contain user/password", async () => {
                const handler = new FakeAuthHandler();
                const params = lodash.cloneDeep(loginParams);
                fakeConfig.api.profiles.defaultSet("fruit", "fruit");
                (fakeConfig as any).layerActive().properties.profiles.fruit.secure = [];

                const doLoginSpy = jest.spyOn(handler as any, "doLogin");
                const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
                let caughtError;

                try {
                    await handler.process(params);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(doLoginSpy).toBeCalledTimes(1);
                expect(writeFileSpy).toBeCalledTimes(1);
                expect(fakeVault.save).toBeCalledTimes(1);
                expect(fakeConfig.properties.profiles.fruit_creds).toBeUndefined();

                expect(fakeVault.save.mock.calls[0][1]).toContain(`"profiles.fruit.properties.tokenValue":"fakeToken"`);
                expect(fakeConfig.properties.profiles.fruit.properties).toEqual({
                    protocol: "ftp",
                    tokenType: handler.mDefaultTokenType,
                    tokenValue: "fakeToken"
                });

                const layer = (fakeConfig as any).layerActive();
                expect(layer.user).toBe(true);
                expect(layer.global).toBe(true);
                expect(layer.properties.profiles.fruit.secure).toContain("tokenValue");
            });
        });
    });

    describe("logout", () => {
        const configPath = __dirname + `/__resources__/auth.config.json`;
        const fakeVault = {
            load: async () => JSON.stringify(secureConfig(configPath, "fruit")),
            save: jest.fn(),
            name: "fake"
        };

        const logoutParams: IHandlerParameters = {
            response: {
                console: {
                    error: jest.fn(),
                    errorHeader: jest.fn(),
                    log: jest.fn()
                },
                data: {
                    setExitCode: jest.fn()
                }
            },
            arguments: {
                host: "fakeHost",
                port: "fakePort",
                tokenType: SessConstants.TOKEN_TYPE_JWT,
                tokenValue: "fakeToken"
            },
            positionals: ["auth", "logout", "creds"],
            definition: {}
        } as any;

        beforeEach(async () => {
            jest.restoreAllMocks();
            jest.spyOn(Config, "search").mockReturnValue(configPath);
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false);
            fakeConfig = await Config.load(MY_APP, { vault: fakeVault });
        });

        it("should logout successfully from profile specified by user", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);
            params.arguments["fruit-profile"] = "fruit";

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
            const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
            let caughtError;

            expect(fakeConfig.properties.profiles.fruit.properties.tokenType).toBeDefined();
            expect(fakeConfig.properties.profiles.fruit.properties.tokenValue).toBeDefined();

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).toBeCalledTimes(1);
            expect(writeFileSpy).toBeCalledTimes(1);
            expect(fakeVault.save).toBeCalledTimes(1);
            expect(fakeVault.save.mock.calls[0][1]).toBe("{}");
            expect(fakeConfig.properties.profiles.fruit.properties.tokenType).toBeUndefined();
            expect(fakeConfig.properties.profiles.fruit.properties.tokenValue).toBeUndefined();
        });

        it("should logout successfully from default profile", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);
            fakeConfig.api.profiles.defaultSet("fruit", "fruit");
            expect(fakeConfig.properties.profiles.fruit.properties.tokenType).toBeDefined();
            expect(fakeConfig.properties.profiles.fruit.properties.tokenValue).toBeDefined();

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
            const writeFileSpy = jest.spyOn(fs, "writeFileSync").mockReturnValueOnce(undefined);
            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).toBeCalledTimes(1);
            expect(writeFileSpy).toBeCalledTimes(1);
            expect(fakeVault.save).toBeCalledTimes(1);
            expect(fakeVault.save.mock.calls[0][1]).toBe("{}");
            expect(fakeConfig.properties.profiles.fruit.properties.tokenType).toBeUndefined();
            expect(fakeConfig.properties.profiles.fruit.properties.tokenValue).toBeUndefined();
        });

        it("should logout successfully without matching token in profile", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);
            params.arguments.tokenValue += "2";
            params.arguments["fruit-profile"] = "fruit";
            expect(fakeConfig.properties.profiles.fruit.properties.tokenType).toBeDefined();
            expect(fakeConfig.properties.profiles.fruit.properties.tokenValue).toBeDefined();

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
            const writeFileSpy = jest.spyOn(fs, "writeFileSync");
            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).toBeCalledTimes(1);
            expect(writeFileSpy).toBeCalledTimes(0);
            expect(fakeConfig.properties.profiles.fruit.properties.tokenType).toBeDefined();
            expect(fakeConfig.properties.profiles.fruit.properties.tokenValue).toBeDefined();
        });

        it("should logout successfully without any profile", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
            const writeFileSpy = jest.spyOn(fs, "writeFileSync");
            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).toBeCalledTimes(1);
            expect(writeFileSpy).not.toHaveBeenCalled();
        });

        it("should not logout without a token", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);
            delete params.arguments.tokenValue;

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
            const writeFileSpy = jest.spyOn(fs, "writeFileSync");

            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).not.toHaveBeenCalled();
            expect(writeFileSpy).not.toHaveBeenCalled();
            expect((params.response.console.error as any).mock.calls[0][0]).toContain("Token was not provided");
            expect(params.response.data.setExitCode).toHaveBeenCalledWith(1);
        });

        it("should not touch the config file if there is no profile to modify", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout").mockRejectedValueOnce({errorCode: "401"});
            const writeFileSpy = jest.spyOn(fs, "writeFileSync");

            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).toHaveBeenCalled();
            expect(writeFileSpy).not.toHaveBeenCalled();
            expect((params.response.console.log as any).mock.calls[0][0]).toContain("Token is not valid or expired");
            expect((params.response.console.log as any).mock.calls[0][0]).toContain("Empty profile was provided");
        });

        it("should not touch the config file if the token type was not specified", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);
            params.arguments["fruit-profile"] = "fruity";

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
            const writeFileSpy = jest.spyOn(fs, "writeFileSync");

            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).toHaveBeenCalled();
            expect(writeFileSpy).not.toHaveBeenCalled();
            expect((params.response.console.log as any).mock.calls[0][0]).toContain("Token type was not provided");
        });

        it("should not touch the config file if the token type does not match", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);
            params.arguments.tokenType = "fakeType.1";
            params.arguments["fruit-profile"] = "fruit";
            fakeConfig.properties.profiles.fruit.properties.tokenType = "fakeType.2";

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
            const writeFileSpy = jest.spyOn(fs, "writeFileSync");

            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).toHaveBeenCalled();
            expect(writeFileSpy).not.toHaveBeenCalled();
            expect((params.response.console.log as any).mock.calls[0][0]).toContain("Token type does not match the authentication service");
        });

        it("should not touch the config file if the token value does not match", async () => {
            const handler = new FakeAuthHandler();
            const params = lodash.cloneDeep(logoutParams);
            params.arguments.tokenValue = "fakeValue.1";
            params.arguments["fruit-profile"] = "fruit";
            fakeConfig.properties.profiles.fruit.properties.tokenValue = "fakeValue.2";

            const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
            const writeFileSpy = jest.spyOn(fs, "writeFileSync");

            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(doLogoutSpy).toHaveBeenCalled();
            expect(writeFileSpy).not.toHaveBeenCalled();
            expect((params.response.console.log as any).mock.calls[0][0]).toContain("Token value does not match the securely stored value");
        });
    });
});
