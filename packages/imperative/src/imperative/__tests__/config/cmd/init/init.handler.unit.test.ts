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

import { IHandlerParameters } from "../../../../..";
import { Config } from "../../../../../config/src/Config";
import { ConfigConstants } from "../../../../../config/src/ConfigConstants";
import { ImperativeConfig, ProcessUtils } from "../../../../../utilities";
import { IImperativeConfig } from "../../../../src/doc/IImperativeConfig";
import { expectedSchemaObject } from
    "../../../../../../__tests__/__integration__/imperative/__tests__/__integration__/cli/config/__resources__/expectedObjects";
import InitHandler from "../../../../src/config/cmd/init/init.handler";
import * as config from "../../../../../../__tests__/__integration__/imperative/src/imperative";
import * as path from "path";
import * as lodash from "lodash";
import * as fs from "fs";
import { CredentialManagerFactory } from "../../../../../security";
import { setupConfigToLoad } from "../../../../../../__tests__/src/TestUtil";
import { OverridesLoader } from "../../../../src/OverridesLoader";
import { ConfigUtils, ImperativeError } from "../../../../..";

jest.mock("fs");

const getIHandlerParametersObject = (): IHandlerParameters => {
    const x: any = {
        response: {
            data: {
                setMessage: jest.fn((_setMsgArgs) => {
                    // Nothing
                }),
                setObj: jest.fn((_setObjArgs) => {
                    // Nothing
                })
            },
            console: {
                log: jest.fn((_logs) => {
                    // Nothing
                }),
                error: jest.fn((_errors) => {
                    // Nothing
                }),
                errorHeader: jest.fn(() => undefined)
            }
        },
        arguments: {},
    };
    return x as IHandlerParameters;
};

const fakeConfig = config as IImperativeConfig;
if (fakeConfig.profiles && fakeConfig.baseProfile) {
    // Add base profile to profiles array to mimic Imperative init
    fakeConfig.profiles.push(fakeConfig.baseProfile);
}
const fakeProjPath = path.join(__dirname, "fakeapp.config.json");
const fakeSchemaPath = path.join(__dirname, "fakeapp.schema.json");
const fakeProjUserPath = path.join(__dirname, "fakeapp.config.user.json");
const fakeGblProjPath = path.join(__dirname, ".fakeapp", "fakeapp.config.json");
const fakeGblSchemaPath = path.join(__dirname, ".fakeapp", "fakeapp.schema.json");
const fakeGblProjUserPath = path.join(__dirname, ".fakeapp", "fakeapp.config.user.json");

const testLayers = [
    {
        name: "project",
        user: false,
        global: false,
        configPath: fakeProjPath,
        schemaPath: fakeSchemaPath
    },
    {
        name: "global",
        user: false,
        global: true,
        configPath: fakeGblProjPath,
        schemaPath: fakeGblSchemaPath
    },
    {
        name: "project user",
        user: true,
        global: false,
        configPath: fakeProjUserPath,
        schemaPath: fakeSchemaPath
    },
    {
        name: "global user",
        user: true,
        global: true,
        configPath: fakeGblProjUserPath,
        schemaPath: fakeGblSchemaPath
    }
];

describe("Configuration Initialization command handler", () => {
    let writeFileSyncSpy: any;
    let existsSyncSpy: any;
    let searchSpy: any;
    let setSchemaSpy: any;
    let editFileSpy: any;

    beforeEach(async () => {
        jest.resetAllMocks();
        ImperativeConfig.instance.loadedConfig = lodash.cloneDeep(fakeConfig);
        Object.defineProperty(CredentialManagerFactory, "initialized", { get: () => true });

        writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        existsSyncSpy = jest.spyOn(fs, "existsSync");
        searchSpy = jest.spyOn(Config, "search");
        editFileSpy = jest.spyOn(ProcessUtils, "openInEditor");
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    // Run tests for all the config layers
    testLayers.forEach(({ name, user, global, configPath, schemaPath }) => describe(`${name} layer`, () => {
        let baseProfName: string;
        if (global) {
            baseProfName = "global_base";
        } else {
            baseProfName = "project_base";
        }

        it("should attempt to initialize the configuration", async () => {
            const handler = new InitHandler();
            const params = getIHandlerParametersObject();
            params.arguments.userConfig = user;
            params.arguments.globalConfig = global;

            existsSyncSpy.mockReturnValue(false); // No files exist
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
            await setupConfigToLoad(); // Setup the config

            const ensureCredMgrSpy = jest.spyOn(OverridesLoader, "ensureCredentialManagerLoaded");
            setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

            // We aren't testing the config initialization - clear the spies
            existsSyncSpy.mockClear();
            searchSpy.mockClear();

            // initWithSchema
            const readPromptSpy = jest.fn(() => "fakeValue");
            (params.response.console as any).prompt = readPromptSpy;
            writeFileSyncSpy.mockImplementation(); // Don't actually write files

            if (!global) jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
            await handler.process(params as IHandlerParameters);

            const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
            if (!user) {
                delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
                delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret
            }

            expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
            expect(setSchemaSpy).toHaveBeenCalledTimes(1);
            expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

            expect(readPromptSpy).toHaveBeenCalledTimes(user ? 0 : 2); // User config is a skeleton - no prompting should occur
            // Prompting for secure property
            if (!user) expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});
            expect(editFileSpy).not.toHaveBeenCalled();

            expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
            // 1 = Schema and 2 = Config
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, schemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, configPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));

            // Secure value supplied during prompting should be on properties
            if (!user) {
                expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual("fakeValue");
                expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual("fakeValue");
            }
        });

        it("should attempt to do a dry run of initializing the configuration", async () => {
            const handler = new InitHandler();
            const params = getIHandlerParametersObject();
            params.arguments.userConfig = user;
            params.arguments.globalConfig = global;
            params.arguments.dryRun = true;

            existsSyncSpy.mockReturnValue(false); // No files exist
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
            await setupConfigToLoad(); // Setup the config

            const ensureCredMgrSpy = jest.spyOn(OverridesLoader, "ensureCredentialManagerLoaded");
            setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

            // We aren't testing the config initialization - clear the spies
            existsSyncSpy.mockClear();
            searchSpy.mockClear();

            // initWithSchema
            const readPromptSpy = jest.fn(() => "fakeValue");
            (params.response.console as any).prompt = readPromptSpy;
            writeFileSyncSpy.mockImplementation(); // Don't actually write files

            // initForDryRun
            const initForDryRunSpy = jest.spyOn(handler as any, "initForDryRun");

            if (!global) jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
            await handler.process(params as IHandlerParameters);

            expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);

            expect(readPromptSpy).toHaveBeenCalledTimes(0); // Dry run mode - no prompting should occur

            expect(initForDryRunSpy).toHaveBeenCalledTimes(1);
            expect(initForDryRunSpy).toHaveBeenCalledWith(ImperativeConfig.instance.config,
                params.arguments.userConfig, params.arguments.globalConfig
            );

            expect(writeFileSyncSpy).not.toHaveBeenCalled();
        });

        it("should attempt to overwrite the configuration", async () => {
            const handler = new InitHandler();
            const params = getIHandlerParametersObject();
            params.arguments.userConfig = user;
            params.arguments.globalConfig = global;
            params.arguments.overwrite = true;
            params.arguments.forSure = true;

            existsSyncSpy.mockReturnValue(false); // No files exist
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
            await setupConfigToLoad(); // Setup the config

            const ensureCredMgrSpy = jest.spyOn(OverridesLoader, "ensureCredentialManagerLoaded");
            setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");
            const initWithSchemaSpy = jest.spyOn(handler as any, "initWithSchema");

            // We aren't testing the config initialization - clear the spies
            existsSyncSpy.mockClear();
            searchSpy.mockClear();

            // initWithSchema
            const readPromptSpy = jest.fn(() => "fakeValue");
            (params.response.console as any).prompt = readPromptSpy;
            writeFileSyncSpy.mockImplementation(); // Don't actually write files

            if (!global) jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
            await handler.process(params as IHandlerParameters);

            const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
            if (!user) {
                delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
                delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret
            }

            expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
            expect(setSchemaSpy).toHaveBeenCalledTimes(1);
            expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

            expect(readPromptSpy).toHaveBeenCalledTimes(user ? 0 : 2);
            // Prompting for secure property
            if (!user) expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});

            expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);

            // Secure value supplied during prompting should be on properties
            if (!user) {
                expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual("fakeValue");
                expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual("fakeValue");
            }

            // initWithSchema called with the correct parameters
            expect(initWithSchemaSpy).toHaveBeenCalledTimes(1);
            expect(initWithSchemaSpy).toHaveBeenCalledWith(ImperativeConfig.instance.config, params.arguments.userConfig,
                params.arguments.globalConfig, params.arguments.overwrite && params.arguments.forSure);
        });

        it("should attempt to initialize the configuration with prompting disabled", async () => {
            const handler = new InitHandler();
            const params = getIHandlerParametersObject();
            params.arguments.userConfig = user;
            params.arguments.globalConfig = global;
            params.arguments.prompt = false;

            existsSyncSpy.mockReturnValue(false); // No files exist
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
            await setupConfigToLoad(); // Setup the config

            setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

            // We aren't testing the config initialization - clear the spies
            existsSyncSpy.mockClear();
            searchSpy.mockClear();

            // initWithSchema
            const readPromptSpy = jest.fn(() => "fakeValue");
            (params.response.console as any).prompt = readPromptSpy;
            writeFileSyncSpy.mockImplementation(); // Don't actually write files

            if (!global) jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
            await handler.process(params as IHandlerParameters);

            const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config

            expect(setSchemaSpy).toHaveBeenCalledTimes(1);
            expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

            expect(readPromptSpy).toHaveBeenCalledTimes(0); // CI flag should not prompt

            expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
            // 1 = Schema and 2 = Config
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, schemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
            expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, configPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));
        });

        it("should attempt to overwrite the configuration with prompting disabled", async () => {
            const handler = new InitHandler();
            const params = getIHandlerParametersObject();
            params.arguments.userConfig = user;
            params.arguments.globalConfig = global;
            params.arguments.prompt = false;
            params.arguments.overwrite = true;
            params.arguments.forSure = true;

            existsSyncSpy.mockReturnValue(false); // No files exist
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
            await setupConfigToLoad(); // Setup the config

            setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");
            const initWithSchemaSpy = jest.spyOn(handler as any, "initWithSchema");

            // We aren't testing the config initialization - clear the spies
            existsSyncSpy.mockClear();
            searchSpy.mockClear();

            // initWithSchema
            const readPromptSpy = jest.fn(() => "fakeValue");
            (params.response.console as any).prompt = readPromptSpy;
            writeFileSyncSpy.mockImplementation(); // Don't actually write files

            if (!global) jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
            await handler.process(params as IHandlerParameters);

            const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config

            expect(setSchemaSpy).toHaveBeenCalledTimes(1);
            expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

            expect(readPromptSpy).toHaveBeenCalledTimes(0); // CI flag should not prompt

            expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);

            // initWithSchema called with the correct parameters
            expect(initWithSchemaSpy).toHaveBeenCalledTimes(1);
            expect(initWithSchemaSpy).toHaveBeenCalledWith(ImperativeConfig.instance.config, params.arguments.userConfig,
                params.arguments.globalConfig, params.arguments.overwrite && params.arguments.forSure);
        });

        it("should attempt to do a dry run of initializing the configuration and handle no changes", async () => {
            const handler = new InitHandler();
            const params = getIHandlerParametersObject();
            params.arguments.userConfig = user;
            params.arguments.globalConfig = global;
            params.arguments.prompt = false;

            existsSyncSpy.mockReturnValue(false); // No files exist
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
            await setupConfigToLoad(); // Setup the config

            // We aren't testing the config initialization - clear the spies
            existsSyncSpy.mockClear();
            searchSpy.mockClear();

            // initWithSchema
            const readPromptSpy = jest.fn(() => "fakeValue");
            (params.response.console as any).prompt = readPromptSpy;
            writeFileSyncSpy.mockImplementation(); // Don't actually write files

            if (!global) jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
            await handler.process(params as IHandlerParameters);

            const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
            lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
            // console.log(JSON.stringify(compObj, null, 2));

            // initForDryRun
            const initForDryRunSpy = jest.spyOn(handler as any, "initForDryRun");
            const jsonDataSpy = jest.spyOn(params.response.data, "setObj");
            params.arguments.dryRun = true;

            if (!global) jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
            await handler.process(params as IHandlerParameters);

            expect(initForDryRunSpy).toHaveBeenCalledTimes(1);
            expect(initForDryRunSpy).toHaveBeenCalledWith(ImperativeConfig.instance.config,
                params.arguments.userConfig, params.arguments.globalConfig
            );

            expect(jsonDataSpy).toHaveBeenCalledTimes(1);
            // console.log(jsonDataSpy.mock.calls[0][0]);
            expect(JSON.parse(jsonDataSpy.mock.calls[0][0])).toMatchObject(compObj);
        });

        it("should initialize configuration and then edit it", async () => {
            const handler = new InitHandler();
            const params = getIHandlerParametersObject();
            params.arguments.userConfig = user;
            params.arguments.globalConfig = global;
            params.arguments.edit = true;

            existsSyncSpy.mockReturnValue(false); // No files exist
            searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
            await setupConfigToLoad(); // Setup the config

            const ensureCredMgrSpy = jest.spyOn(OverridesLoader, "ensureCredentialManagerLoaded");
            setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

            // We aren't testing the config initialization - clear the spies
            existsSyncSpy.mockClear();
            searchSpy.mockClear();

            // initWithSchema
            const readPromptSpy = jest.fn(() => "fakeValue");
            (params.response.console as any).prompt = readPromptSpy;
            writeFileSyncSpy.mockImplementation(); // Don't actually write files

            if (!global) jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
            await handler.process(params as IHandlerParameters);

            expect(ensureCredMgrSpy).toHaveBeenCalledTimes(1);
            expect(setSchemaSpy).toHaveBeenCalledTimes(1);
            expect(readPromptSpy).toHaveBeenCalledTimes(user ? 0 : 2);
            expect(editFileSpy).toHaveBeenCalledWith(ImperativeConfig.instance.config.layerActive().path, undefined);
            expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);

            if (!user) expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual("fakeValue");
        });
    }));

    it("should attempt to initialize the project configuration and use boolean true for the prompt", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        const baseProfName = "project_base";

        existsSyncSpy.mockReturnValue(false); // No files exist
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => "true");
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
        await handler.process(params as IHandlerParameters);

        const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
        delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret

        expect(setSchemaSpy).toHaveBeenCalledTimes(1);
        expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

        expect(readPromptSpy).toHaveBeenCalledTimes(2);
        // Prompting for secure property
        expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
        // 1 = Schema and 2 = Config
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeSchemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, fakeProjPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));

        // Secure value supplied during prompting should be on properties
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual("true");
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual(true);
    });

    it("should attempt to initialize the project configuration and use boolean false for the prompt", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        const baseProfName = "project_base";

        existsSyncSpy.mockReturnValue(false); // No files exist
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => "false");
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
        await handler.process(params as IHandlerParameters);

        const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
        delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret

        expect(setSchemaSpy).toHaveBeenCalledTimes(1);
        expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

        expect(readPromptSpy).toHaveBeenCalledTimes(2);
        // Prompting for secure property
        expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
        // 1 = Schema and 2 = Config
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeSchemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, fakeProjPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));

        // Secure value supplied during prompting should be on properties
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual("false");
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual(false);
    });

    it("should attempt to initialize the project configuration and use a number for the prompt", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        const baseProfName = "project_base";

        existsSyncSpy.mockReturnValue(false); // No files exist
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const randomValueString = "9001";
        const randomValueNumber = parseInt(randomValueString, 10);
        const readPromptSpy = jest.fn(() => randomValueString);
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
        await handler.process(params as IHandlerParameters);

        const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
        delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret

        expect(setSchemaSpy).toHaveBeenCalledTimes(1);
        expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

        expect(readPromptSpy).toHaveBeenCalledTimes(2);
        // Prompting for secure property
        expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
        // 1 = Schema and 2 = Config
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeSchemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, fakeProjPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));

        // Secure value supplied during prompting should be on properties
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual(randomValueString);
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual(randomValueNumber);
    });

    it("should attempt to initialize the project configuration and handle getting nothing from the prompt", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        const baseProfName = "project_base";

        existsSyncSpy.mockReturnValue(false); // No files exist
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => undefined);
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
        await handler.process(params as IHandlerParameters);

        const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
        delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret

        expect(setSchemaSpy).toHaveBeenCalledTimes(1);
        expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

        expect(readPromptSpy).toHaveBeenCalledTimes(2);
        // Prompting for secure property
        expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
        // 1 = Schema and 2 = Config
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeSchemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, fakeProjPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));

        // Secure value supplied during prompting should be on properties
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual(undefined);
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual(undefined);
    });

    it("should attempt to initialize the project configuration and overwrite empty value with prompt", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        const baseProfName = "project_base";

        existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Project config exists
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify({
            profiles: {
                project_base: {
                    properties: {
                        secret: ""
                    }
                }
            },
            defaults: {}
        }));
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => "area51");
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
        await handler.process(params as IHandlerParameters);

        const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
        delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret

        expect(setSchemaSpy).toHaveBeenCalledTimes(1);
        expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

        expect(readPromptSpy).toHaveBeenCalledTimes(2);
        // Prompting for secure property
        expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
        // 1 = Schema and 2 = Config
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeSchemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, fakeProjPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));

        // Secure value supplied during prompting should be on properties
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual("area51");
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual("area51");
    });

    it("should attempt to initialize the project configuration and overwrite non-empty value with prompt", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        const baseProfName = "project_base";

        existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Project config exists
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify({
            profiles: {
                project_base: {
                    properties: {
                        secret: "expired"
                    }
                }
            },
            defaults: {}
        }));
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => "area51");
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
        await handler.process(params as IHandlerParameters);

        const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
        delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret

        expect(setSchemaSpy).toHaveBeenCalledTimes(1);
        expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

        expect(readPromptSpy).toHaveBeenCalledTimes(2);
        // Prompting for secure property
        expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
        // 1 = Schema and 2 = Config
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeSchemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, fakeProjPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));

        // Secure value supplied during prompting should be on properties
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual("area51");
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual("area51");
    });

    it("should attempt to initialize the project configuration and not overwrite value when prompt is skipped", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        const baseProfName = "project_base";

        existsSyncSpy.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false); // Project config exists
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify({
            profiles: {
                project_base: {
                    properties: {
                        info: "fakeValue",
                        secret: "area51",
                        // Keeping this as `"undefined"` to test that we are not coercing it to the falsy value `undefined`
                        undefined_type: "undefined"
                    }
                }
            },
            defaults: {}
        }));
        await setupConfigToLoad(); // Setup the config

        ImperativeConfig.instance.loadedConfig.baseProfile.schema.properties.info.includeInTemplate = true;
        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => "");
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
        await handler.process(params as IHandlerParameters);

        const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
        delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret

        expect(setSchemaSpy).toHaveBeenCalledTimes(1);
        expect(setSchemaSpy).toHaveBeenCalledWith(expectedSchemaObject);

        expect(readPromptSpy).toHaveBeenCalledTimes(3);
        // Prompting for secure property
        expect(readPromptSpy).toHaveBeenCalledWith(expect.stringContaining("to skip:"), {"hideText": true});

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
        // 1 = Schema and 2 = Config
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(1, fakeSchemaPath, JSON.stringify(expectedSchemaObject, null, ConfigConstants.INDENT));
        expect(writeFileSyncSpy).toHaveBeenNthCalledWith(2, fakeProjPath, JSON.stringify(compObj, null, ConfigConstants.INDENT));

        // Secure value supplied during prompting should be on properties
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.info).toEqual("fakeValue");
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.secret).toEqual("area51");
        expect(ImperativeConfig.instance.config.properties.profiles[baseProfName].properties.undefined_type).toEqual("undefined");
    });

    it("should display warning if unable to securely save credentials", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;
        const baseProfName = "project_base";

        existsSyncSpy.mockReturnValue(false); // No files exist
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => undefined);
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files
        jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValue(false);
        jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue({ secureErrorDetails: jest.fn() } as any);

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);
        await handler.process(params as IHandlerParameters);

        const compObj: any = { $schema: "./fakeapp.schema.json" }; // Fill in the name of the schema file, and make it first
        lodash.merge(compObj, ImperativeConfig.instance.config.properties); // Add the properties from the config
        delete compObj.profiles[baseProfName].properties.secret; // Delete the secret
        delete compObj.profiles[baseProfName].properties.undefined_type; // Delete the undefined secret

        expect(readPromptSpy).toHaveBeenCalledTimes(0);
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
        expect(params.response.console.log).toHaveBeenCalledTimes(2);
        expect((params.response.console.log as any).mock.calls[0][0]).toContain("Unable to securely save credentials");
    });

    it("should display correct error message for process() given additionalDetails property is defined in ImperativeError", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;

        existsSyncSpy.mockReturnValue(false); // No files exist
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => undefined);
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files
        jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValue(false);
        jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue({ secureErrorDetails: jest.fn() } as any);

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);

        // Mocking for logical branch intended to evaluate
        const secureSaveErrorSpy = jest.spyOn(ConfigUtils, "secureSaveError");

        secureSaveErrorSpy.mockImplementation(() => {
            return new ImperativeError({
                msg: "fake message",
                additionalDetails: "fake additional details"
            });
        });

        await handler.process(params as IHandlerParameters);

        expect(secureSaveErrorSpy.mock.results[0].value).toBeInstanceOf(ImperativeError);
        expect(secureSaveErrorSpy.mock.results[0].value.additionalDetails).toEqual(
            "fake additional details");
        expect((params.response.console.log as any).mock.calls[0][0]).toContain("fake additional details");
    });
    it("should display correct error message for process() given additionalDetails property is NOT defined in ImperativeError", async () => {
        const handler = new InitHandler();
        const params = getIHandlerParametersObject();
        params.arguments.userConfig = false;
        params.arguments.globalConfig = false;

        existsSyncSpy.mockReturnValue(false); // No files exist
        searchSpy.mockReturnValueOnce(fakeProjUserPath).mockReturnValueOnce(fakeProjPath); // Give search something to return
        await setupConfigToLoad(); // Setup the config

        setSchemaSpy = jest.spyOn(ImperativeConfig.instance.config, "setSchema");

        // We aren't testing the config initialization - clear the spies
        existsSyncSpy.mockClear();
        searchSpy.mockClear();

        // initWithSchema
        const readPromptSpy = jest.fn(() => undefined);
        (params.response.console as any).prompt = readPromptSpy;
        writeFileSyncSpy.mockImplementation(); // Don't actually write files
        jest.spyOn(CredentialManagerFactory, "initialized", "get").mockReturnValue(false);
        jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValue({ secureErrorDetails: jest.fn() } as any);

        jest.spyOn(process, "cwd").mockReturnValueOnce(null as unknown as string);

        // Mocking for logical branch intended to evaluate
        const secureSaveErrorSpy = jest.spyOn(ConfigUtils, "secureSaveError");

        secureSaveErrorSpy.mockImplementation(() => {
            return new ImperativeError({
                msg: "fake message"
            });
        });

        await handler.process(params as IHandlerParameters);

        expect(secureSaveErrorSpy.mock.results[0].value).toBeInstanceOf(ImperativeError);
        expect((params.response.console.log as any).mock.calls[0][0]).not.toContain("fake additional details");
    });
});
