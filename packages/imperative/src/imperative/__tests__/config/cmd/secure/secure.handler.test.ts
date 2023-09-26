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

import { IHandlerParameters, Logger } from "../../../../..";
import { Config } from "../../../../../config/src/Config";
import { IConfig, IConfigOpts, IConfigProfile } from "../../../../../config";
import { ImperativeConfig } from "../../../../../utilities";
import { IImperativeConfig } from "../../../../src/doc/IImperativeConfig";
import { ICredentialManagerInit } from "../../../../../security/src/doc/ICredentialManagerInit";
import { CredentialManagerFactory } from "../../../../../security";
import { expectedConfigObject } from
    "../../../../../../__tests__/__integration__/imperative/__tests__/__integration__/cli/config/__resources__/expectedObjects";
import SecureHandler from "../../../../src/config/cmd/secure/secure.handler";
import * as config from "../../../../../../__tests__/__integration__/imperative/src/imperative";
import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk";
import * as path from "path";
import * as lodash from "lodash";
import * as fs from "fs";
import { SessConstants } from "../../../../../rest";
import { setupConfigToLoad } from "../../../../../../__tests__/src/TestUtil";

const getIHandlerParametersObject = (): IHandlerParameters => {
    const x: any = {
        response: {
            data: {
                setMessage: jest.fn((setMsgArgs) => {
                    // Nothing
                }),
                setObj: jest.fn((setObjArgs) => {
                    // Nothing
                })
            },
            console: {
                log: jest.fn((logs) => {
                    // Nothing
                }),
                error: jest.fn((errors) => {
                    // Nothing
                }),
                errorHeader: jest.fn(() => undefined)
            }
        },
        arguments: {},
        definition: {}
    };
    return x as IHandlerParameters;
};

const credentialManager: ICredentialManagerInit = {
    service: "Zowe",
    displayName: "imperativeTestCredentialManager",
    invalidOnFailure: false
};

const fakeConfig = config as IImperativeConfig;
const fakeProjPath = path.join(__dirname, "fakeapp.config.json");
const fakeSchemaPath = path.join(__dirname, "fakeapp.schema.json");
const fakeProjUserPath = path.join(__dirname, "fakeapp.config.user.json");
const fakeGblProjPath = path.join(__dirname, ".fakeapp", "fakeapp.config.json");
const fakeGblSchemaPath = path.join(__dirname, ".fakeapp", "fakeapp.schema.json");
const fakeGblProjUserPath = path.join(__dirname, ".fakeapp", "fakeapp.config.user.json");
const fakeUnrelatedPath = path.join(__dirname, "fakeapp.unrelated.config.json");

const fakeSecureDataJson = {};
fakeSecureDataJson[fakeProjPath] = {"profiles.base.properties.secure": "fakeSecureValue"};
fakeSecureDataJson[fakeGblProjPath] = {"profiles.base.properties.secure": "fakeSecureValue"};
fakeSecureDataJson[fakeUnrelatedPath] = {"profiles.base.properties.secure": "anotherFakeSecureValue"};

const fakeSecureData = Buffer.from(JSON.stringify(fakeSecureDataJson)).toString("base64");

describe("Configuration Secure command handler", () => {
    let readFileSyncSpy: any;
    let writeFileSyncSpy: any;
    let existsSyncSpy: any;
    let searchSpy: any;
    let setSchemaSpy: any;
    let keytarGetPasswordSpy: any;
    let keytarSetPasswordSpy: any;
    let keytarDeletePasswordSpy: any;

    const configOpts: IConfigOpts = {
        vault: {
            load: ((k: string): Promise<string> => {
                return CredentialManagerFactory.manager.load(k, true);
            }),
            save: ((k: string, v: any): Promise<void> => {
                return CredentialManagerFactory.manager.save(k, v);
            })
        }
    };

    beforeAll( async() => {
        keytarGetPasswordSpy = jest.spyOn(keytar, "getPassword");
        keytarSetPasswordSpy = jest.spyOn(keytar, "setPassword");
        keytarDeletePasswordSpy = jest.spyOn(keytar, "deletePassword");

        // Start mocking out some of the credential management functions
        // Any secure data being loaded will appear to be fakeSecureValue
        keytarGetPasswordSpy.mockResolvedValue(fakeSecureData);
        keytarSetPasswordSpy.mockImplementation();
        keytarDeletePasswordSpy.mockImplementation();

        await CredentialManagerFactory.initialize(credentialManager); // Prepare config setup
    });

    beforeEach( async () => {
        ImperativeConfig.instance.loadedConfig = lodash.cloneDeep(fakeConfig);

        searchSpy = jest.spyOn(Config, "search");
        keytarGetPasswordSpy = jest.spyOn(keytar, "getPassword");
        keytarSetPasswordSpy = jest.spyOn(keytar, "setPassword");
        keytarDeletePasswordSpy = jest.spyOn(keytar, "deletePassword");
    });

    afterEach( () => {
        jest.restoreAllMocks();
    });

    it("should attempt to secure the project configuration", async () => {
        const handler = new SecureHandler();
        const params = getIHandlerParametersObject();

        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;

        // Start doing fs mocks
        // And the prompting of the secure handler
        keytarGetPasswordSpy.mockReturnValue(fakeSecureData);
        keytarSetPasswordSpy.mockImplementation();
        keytarDeletePasswordSpy.mockImplementation();
        readFileSyncSpy = jest.spyOn(fs, "readFileSync");
        writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        existsSyncSpy = jest.spyOn(fs, "existsSync");

        const eco = lodash.cloneDeep(expectedConfigObject);
        eco.$schema = "./fakeapp.schema.json";

        readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
        existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Only the project config exists
        writeFileSyncSpy.mockImplementation();
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

        await setupConfigToLoad(undefined, configOpts); // Setup the config

        // We aren't testing the config initialization - clear the spies
        searchSpy.mockClear();
        writeFileSyncSpy.mockClear();
        existsSyncSpy.mockClear();
        readFileSyncSpy.mockClear();

        const promptWithTimeoutSpy = jest.fn(() => "fakePromptingData");
        (params.response.console as any).prompt = promptWithTimeoutSpy;
        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        await handler.process(params);

        const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
        delete fakeSecureDataExpectedJson[fakeProjPath];
        fakeSecureDataExpectedJson[fakeProjPath] = {
            "profiles.base.properties.secret": "fakePromptingData"
        };
        const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

        const compObj: any = {};
        // Make changes to satisfy what would be stored on the JSON
        compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles.base.properties.secret; // Delete the secret

        if (process.platform === "win32") {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(4);
        } else {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(3);
        }
        expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeProjPath, JSON.stringify(compObj, null, 4)); // Config
    });

    it("should attempt to secure the user configuration", async () => {
        const handler = new SecureHandler();
        const params = getIHandlerParametersObject();

        params.arguments.userConfig = true;
        params.arguments.globalConfig = false;

        // Start doing fs mocks
        // And the prompting of the secure handler
        keytarGetPasswordSpy.mockReturnValue(fakeSecureData);
        keytarSetPasswordSpy.mockImplementation();
        keytarDeletePasswordSpy.mockImplementation();
        readFileSyncSpy = jest.spyOn(fs, "readFileSync");
        writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        existsSyncSpy = jest.spyOn(fs, "existsSync");

        const eco = lodash.cloneDeep(expectedConfigObject);
        eco.$schema = "./fakeapp.schema.json";

        readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
        existsSyncSpy.mockReturnValueOnce(true).mockReturnValue(false); // Only the user config exists
        writeFileSyncSpy.mockImplementation();
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

        await setupConfigToLoad(undefined, configOpts); // Setup the config

        // We aren't testing the config initialization - clear the spies
        searchSpy.mockClear();
        writeFileSyncSpy.mockClear();
        existsSyncSpy.mockClear();
        readFileSyncSpy.mockClear();

        const promptWithTimeoutSpy = jest.fn(() => "fakePromptingData");
        (params.response.console as any).prompt = promptWithTimeoutSpy;
        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        await handler.process(params);

        const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
        fakeSecureDataExpectedJson[fakeProjUserPath] = {
            "profiles.base.properties.secret": "fakePromptingData"
        };
        const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

        const compObj: any = {};
        // Make changes to satisfy what would be stored on the JSON
        compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles.base.properties.secret; // Delete the secret

        if (process.platform === "win32") {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(4);
        } else {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(3);
        }
        expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeProjUserPath, JSON.stringify(compObj, null, 4)); // Config
    });

    it("should attempt to secure the global project configuration", async () => {
        const handler = new SecureHandler();
        const params = getIHandlerParametersObject();

        params.arguments.userConfig = false;
        params.arguments.globalConfig = true;

        // Start doing fs mocks
        // And the prompting of the secure handler
        keytarGetPasswordSpy.mockReturnValue(fakeSecureData);
        keytarSetPasswordSpy.mockImplementation();
        keytarDeletePasswordSpy.mockImplementation();
        readFileSyncSpy = jest.spyOn(fs, "readFileSync");
        writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        existsSyncSpy = jest.spyOn(fs, "existsSync");

        const eco = lodash.cloneDeep(expectedConfigObject);
        eco.$schema = "./fakeapp.schema.json";

        readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
        existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(false)
            .mockReturnValueOnce(true).mockReturnValue(false); // Only the global project config exists
        writeFileSyncSpy.mockImplementation();
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

        await setupConfigToLoad(undefined, configOpts); // Setup the config

        // We aren't testing the config initialization - clear the spies
        searchSpy.mockClear();
        writeFileSyncSpy.mockClear();
        existsSyncSpy.mockClear();
        readFileSyncSpy.mockClear();

        const promptWithTimeoutSpy = jest.fn(() => "fakePromptingData");
        (params.response.console as any).prompt = promptWithTimeoutSpy;
        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        await handler.process(params);

        const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
        delete fakeSecureDataExpectedJson[fakeGblProjPath];
        fakeSecureDataExpectedJson[fakeGblProjPath] = {
            "profiles.base.properties.secret": "fakePromptingData"
        };
        const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

        const compObj: any = {};
        // Make changes to satisfy what would be stored on the JSON
        compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles.base.properties.secret; // Delete the secret

        if (process.platform === "win32") {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(4);
        } else {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(3);
        }
        expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeGblProjPath, JSON.stringify(compObj, null, 4)); // Config
    });

    it("should attempt to secure the global user configuration", async () => {
        const handler = new SecureHandler();
        const params = getIHandlerParametersObject();

        params.arguments.userConfig = true;
        params.arguments.globalConfig = true;

        // Start doing fs mocks
        // And the prompting of the secure handler
        keytarGetPasswordSpy.mockReturnValue(fakeSecureData);
        keytarSetPasswordSpy.mockImplementation();
        keytarDeletePasswordSpy.mockImplementation();
        readFileSyncSpy = jest.spyOn(fs, "readFileSync");
        writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        existsSyncSpy = jest.spyOn(fs, "existsSync");

        const eco = lodash.cloneDeep(expectedConfigObject);
        eco.$schema = "./fakeapp.schema.json";

        readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
        existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true)
            .mockReturnValue(false); // Only the global user config exists
        writeFileSyncSpy.mockImplementation();
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

        await setupConfigToLoad(undefined, configOpts); // Setup the config

        // We aren't testing the config initialization - clear the spies
        searchSpy.mockClear();
        writeFileSyncSpy.mockClear();
        existsSyncSpy.mockClear();
        readFileSyncSpy.mockClear();

        const promptWithTimeoutSpy = jest.fn(() => "fakePromptingData");
        (params.response.console as any).prompt = promptWithTimeoutSpy;

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        await handler.process(params);

        const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
        delete fakeSecureDataExpectedJson[fakeGblProjUserPath];
        fakeSecureDataExpectedJson[fakeGblProjUserPath] = {
            "profiles.base.properties.secret": "fakePromptingData"
        };
        const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

        const compObj: any = {};
        // Make changes to satisfy what would be stored on the JSON
        compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles.base.properties.secret; // Delete the secret

        if (process.platform === "win32") {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(4);
        } else {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(3);
        }
        expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeGblProjUserPath, JSON.stringify(compObj, null, 4)); // Config
    });

    it("should fail to secure the project configuration if there is no project configuration", async () => {
        const handler = new SecureHandler();
        const params = getIHandlerParametersObject();

        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;

        // Start doing fs mocks
        // And the prompting of the secure handler
        keytarGetPasswordSpy.mockReturnValue(fakeSecureData);
        keytarSetPasswordSpy.mockImplementation();
        keytarDeletePasswordSpy.mockImplementation();
        readFileSyncSpy = jest.spyOn(fs, "readFileSync");
        writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        existsSyncSpy = jest.spyOn(fs, "existsSync");

        const eco = lodash.cloneDeep(expectedConfigObject);
        eco.$schema = "./fakeapp.schema.json";

        readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
        existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true)
            .mockReturnValue(false); // Only the global user config exists
        writeFileSyncSpy.mockImplementation();
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

        await setupConfigToLoad(undefined, configOpts); // Setup the config

        // We aren't testing the config initialization - clear the spies
        searchSpy.mockClear();
        writeFileSyncSpy.mockClear();
        existsSyncSpy.mockClear();
        readFileSyncSpy.mockClear();

        const promptWithTimeoutSpy = jest.fn(() => "fakePromptingData");
        (params.response.console as any).prompt = promptWithTimeoutSpy;
        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        await handler.process(params);

        expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(0);
        expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(0);
        expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(0);
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);
        expect(ImperativeConfig.instance.config.api.secure.secureFields().length).toEqual(0);
    });

    it("should secure the project configuration and prune unused properties", async () => {
        const handler = new SecureHandler();
        const params = getIHandlerParametersObject();

        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        params.arguments.prune = true;

        // Start doing fs mocks
        // And the prompting of the secure handler
        keytarGetPasswordSpy.mockReturnValue(fakeSecureData);
        keytarSetPasswordSpy.mockImplementation();
        keytarDeletePasswordSpy.mockImplementation();
        readFileSyncSpy = jest.spyOn(fs, "readFileSync");
        writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        existsSyncSpy = jest.spyOn(fs, "existsSync");

        const eco = lodash.cloneDeep(expectedConfigObject);
        eco.$schema = "./fakeapp.schema.json";

        readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
        existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Only the project config exists
        writeFileSyncSpy.mockImplementation();
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

        await setupConfigToLoad(undefined, configOpts); // Setup the config

        // We aren't testing the config initialization - clear the spies
        searchSpy.mockClear();
        writeFileSyncSpy.mockClear();
        existsSyncSpy.mockClear();
        readFileSyncSpy.mockClear();

        const promptWithTimeoutSpy = jest.fn(() => "fakePromptingData");
        (params.response.console as any).prompt = promptWithTimeoutSpy;
        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        await handler.process(params);

        const fakeSecureDataExpectedJson = {
            [fakeProjPath]: {
                "profiles.base.properties.secret": "fakePromptingData"
            }
        };
        const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

        const compObj: any = {};
        // Make changes to satisfy what would be stored on the JSON
        compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles.base.properties.secret; // Delete the secret

        if (process.platform === "win32") {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(8);
        } else {
            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(6);
        }
        expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(2);
        expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeProjPath, JSON.stringify(compObj, null, 4)); // Config
    });

    describe("special prompting for auth token", () => {
        const baseProfile: IConfigProfile = {
            type: "base",
            properties: {
                host: "example.com",
                port: 443,
                tokenType: SessConstants.TOKEN_TYPE_JWT
            },
            secure: [
                "tokenValue"
            ]
        };

        const expectedConfigObjectWithToken: IConfig = {
            $schema: "./fakeapp.schema.json",
            profiles: {
                base: baseProfile,
            },
            defaults: {
                base: "base"
            }
        };

        const authHandlerPath = __dirname + "/../../../../src/auth/handlers/AbstractAuthHandler";
        const handler = new SecureHandler();
        const params = getIHandlerParametersObject();
        let mockAuthHandlerApi;
        let promptWithTimeoutSpy;

        beforeAll(() => {
            mockAuthHandlerApi = {
                promptParams: { defaultTokenType: SessConstants.TOKEN_TYPE_JWT },
                createSessCfg: jest.fn(x => x),
                sessionLogin: jest.fn().mockResolvedValue("fakeLoginData")
            };

            jest.doMock(authHandlerPath, () => {
                const { AbstractAuthHandler } = jest.requireActual(authHandlerPath);
                return {
                    default: jest.fn(() => {
                        const handler = Object.create(AbstractAuthHandler.prototype);
                        return Object.assign(handler, {
                            getAuthHandlerApi: jest.fn().mockReturnValue(mockAuthHandlerApi)
                        });
                    })
                };
            });
        });

        beforeEach(async () => {
            params.arguments.userConfig = false;
            params.arguments.globalConfig = false;

            // Start doing fs mocks
            // And the prompting of the secure handler
            keytarGetPasswordSpy.mockReturnValue(fakeSecureData);
            keytarSetPasswordSpy.mockImplementation();
            keytarDeletePasswordSpy.mockImplementation();
            readFileSyncSpy = jest.spyOn(fs, "readFileSync");
            writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
            existsSyncSpy = jest.spyOn(fs, "existsSync");

            mockAuthHandlerApi.sessionLogin.mockClear();
            writeFileSyncSpy.mockReset();
            promptWithTimeoutSpy = jest.fn(() => "fakePromptingData");
            (params.response.console as any).prompt = promptWithTimeoutSpy;
        });

        afterAll(() => {
            jest.unmock(authHandlerPath);
        });

        it("should invoke auth handler to obtain token and store it securely", async () => {
            const eco = lodash.cloneDeep(expectedConfigObjectWithToken);

            // Create another base profile and mock the loggers to test multiple login operations in a single config-secure
            eco.profiles["base2"] = baseProfile;
            const dummyLogger: any = {debug: jest.fn(), info: jest.fn()};
            jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(dummyLogger);
            jest.spyOn(Logger, "getAppLogger").mockReturnValue(dummyLogger);

            readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
            existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Only the project config exists
            writeFileSyncSpy.mockImplementation();
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

            await setupConfigToLoad(undefined, configOpts); // Setup the config

            jest.spyOn(ImperativeConfig.instance, "loadedConfig", "get").mockReturnValue({
                ...fakeConfig,
                profiles: [{
                    type: "base",
                    authConfig: [{ handler: authHandlerPath } as any]
                } as any]
            });

            await handler.process(params);

            const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
            delete fakeSecureDataExpectedJson[fakeProjPath];
            fakeSecureDataExpectedJson[fakeProjPath] = {
                "profiles.base.properties.tokenValue": "fakeLoginData",
                "profiles.base2.properties.tokenValue": "fakeLoginData"
            };
            const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

            const compObj: any = {};
            // Make changes to satisfy what would be stored on the JSON
            compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
            delete compObj.profiles.base.properties.tokenValue;  // Delete the secret
            delete compObj.profiles.base2.properties.tokenValue;  // Delete the secret

            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(process.platform === "win32" ? 4 : 3);
            expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(4);  // User and password
            expect(mockAuthHandlerApi.createSessCfg).toHaveBeenCalledTimes(2);
            expect(mockAuthHandlerApi.sessionLogin).toHaveBeenCalledTimes(2);
            expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
            expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeProjPath, JSON.stringify(compObj, null, 4)); // Config
        });

        it("should not invoke auth handler if profile type is undefined", async () => {
            const eco = lodash.cloneDeep(expectedConfigObjectWithToken);
            delete eco.profiles.base.type;

            readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
            existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Only the project config exists
            writeFileSyncSpy.mockImplementation();
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

            await setupConfigToLoad(undefined, configOpts); // Setup the config
            await handler.process(params);

            const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
            delete fakeSecureDataExpectedJson[fakeProjPath];
            fakeSecureDataExpectedJson[fakeProjPath] = {
                "profiles.base.properties.tokenValue": "fakePromptingData"
            };
            const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

            const compObj: any = {};
            // Make changes to satisfy what would be stored on the JSON
            compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
            delete compObj.profiles.base.properties.tokenValue;  // Delete the secret

            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(process.platform === "win32" ? 4 : 3);
            expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
            expect(mockAuthHandlerApi.sessionLogin).toHaveBeenCalledTimes(0);
            expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
            expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeProjPath, JSON.stringify(compObj, null, 4)); // Config
        });

        it("should not invoke auth handler if profile token type is undefined", async () => {
            const eco = lodash.cloneDeep(expectedConfigObjectWithToken);
            delete eco.profiles.base.properties.tokenType;

            readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
            existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Only the project config exists
            writeFileSyncSpy.mockImplementation();
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

            await setupConfigToLoad(undefined, configOpts); // Setup the config
            await handler.process(params);

            const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
            delete fakeSecureDataExpectedJson[fakeProjPath];
            fakeSecureDataExpectedJson[fakeProjPath] = {
                "profiles.base.properties.tokenValue": "fakePromptingData"
            };
            const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

            const compObj: any = {};
            // Make changes to satisfy what would be stored on the JSON
            compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
            delete compObj.profiles.base.properties.tokenValue;  // Delete the secret

            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(process.platform === "win32" ? 4 : 3);
            expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
            expect(mockAuthHandlerApi.sessionLogin).toHaveBeenCalledTimes(0);
            expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
            expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeProjPath, JSON.stringify(compObj, null, 4)); // Config
        });

        it("should not invoke auth handler if no matching auth config is found", async () => {
            const eco = lodash.cloneDeep(expectedConfigObjectWithToken);

            readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
            existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Only the project config exists
            writeFileSyncSpy.mockImplementation();
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

            await setupConfigToLoad(undefined, configOpts); // Setup the config

            jest.spyOn(ImperativeConfig.instance, "loadedConfig", "get").mockReturnValueOnce({
                profiles: [{
                    type: "not-base",
                    authConfig: [{ handler: authHandlerPath } as any]
                } as any]
            });

            await handler.process(params);

            const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
            delete fakeSecureDataExpectedJson[fakeProjPath];
            fakeSecureDataExpectedJson[fakeProjPath] = {
                "profiles.base.properties.tokenValue": "fakePromptingData"
            };
            const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

            const compObj: any = {};
            // Make changes to satisfy what would be stored on the JSON
            compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
            delete compObj.profiles.base.properties.tokenValue;  // Delete the secret

            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(process.platform === "win32" ? 4 : 3);
            expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
            expect(mockAuthHandlerApi.sessionLogin).toHaveBeenCalledTimes(0);
            expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
            expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeProjPath, JSON.stringify(compObj, null, 4)); // Config
        });

        it("should not invoke auth handler if auth handler is for different token type", async () => {
            const eco = lodash.cloneDeep(expectedConfigObjectWithToken);

            readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
            existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Only the project config exists
            writeFileSyncSpy.mockImplementation();
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

            await setupConfigToLoad(undefined, configOpts); // Setup the config

            jest.spyOn(ImperativeConfig.instance, "loadedConfig", "get").mockReturnValueOnce({
                profiles: [{
                    type: "base",
                    authConfig: [{ handler: authHandlerPath } as any]
                } as any]
            });

            mockAuthHandlerApi.promptParams.defaultTokenType = SessConstants.TOKEN_TYPE_LTPA;
            await handler.process(params);
            mockAuthHandlerApi.promptParams.defaultTokenType = SessConstants.TOKEN_TYPE_JWT;

            const fakeSecureDataExpectedJson = lodash.cloneDeep(fakeSecureDataJson);
            delete fakeSecureDataExpectedJson[fakeProjPath];
            fakeSecureDataExpectedJson[fakeProjPath] = {
                "profiles.base.properties.tokenValue": "fakePromptingData"
            };
            const fakeSecureDataExpected = Buffer.from(JSON.stringify(fakeSecureDataExpectedJson)).toString("base64");

            const compObj: any = {};
            // Make changes to satisfy what would be stored on the JSON
            compObj.$schema = "./fakeapp.schema.json"; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
            delete compObj.profiles.base.properties.tokenValue;  // Delete the secret

            expect(keytarDeletePasswordSpy).toHaveBeenCalledTimes(process.platform === "win32" ? 4 : 3);
            expect(keytarGetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(1);
            expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(1);
            expect(mockAuthHandlerApi.sessionLogin).toHaveBeenCalledTimes(0);
            expect(keytarSetPasswordSpy).toHaveBeenCalledWith("Zowe", "secure_config_props", fakeSecureDataExpected);
            expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeProjPath, JSON.stringify(compObj, null, 4)); // Config
        });

        it("should fail to invoke auth handler if it throws an error", async () => {
            const eco = lodash.cloneDeep(expectedConfigObjectWithToken);

            readFileSyncSpy.mockReturnValueOnce(JSON.stringify(eco));
            existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Only the project config exists
            writeFileSyncSpy.mockImplementation();
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return

            await setupConfigToLoad(undefined, configOpts); // Setup the config

            jest.spyOn(ImperativeConfig.instance, "loadedConfig", "get").mockReturnValueOnce({
                profiles: [{
                    type: "base",
                    authConfig: [{ handler: authHandlerPath } as any]
                } as any]
            });
            mockAuthHandlerApi.sessionLogin.mockRejectedValueOnce(new Error("bad handler"));
            let caughtError;

            try {
                await handler.process(params);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Failed to fetch jwtToken");
            expect(promptWithTimeoutSpy).toHaveBeenCalledTimes(2);  // User and password
            expect(mockAuthHandlerApi.sessionLogin).toHaveBeenCalledTimes(1);
            expect(keytarSetPasswordSpy).toHaveBeenCalledTimes(0);
            expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);
        });
    });
});
