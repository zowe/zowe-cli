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

import Mock = jest.Mock;

jest.mock("child_process");
jest.mock("jsonfile");
jest.mock("../../../../../../src/imperative/plugins/utilities/npm-interface/update");
jest.mock("../../../../../../src/imperative/plugins/utilities/PMFConstants");
jest.mock("../../../../../../src/cmd/doc/handler/IHandlerParameters");
jest.mock("../../../../../../src/cmd/response/CommandResponse");
jest.mock("../../../../../../src/cmd/response/HandlerResponse");
jest.mock("../../../../../../src/logger");
jest.mock("../../../../../../src/imperative/plugins/utilities/NpmFunctions");

import { HandlerResponse, IHandlerParameters } from "../../../../../../src/cmd";
import { Console } from "../../../../../../src/console";
import { IPluginJson } from "../../../../../../src/imperative/plugins/doc/IPluginJson";
import { Logger } from "../../../../../../src/logger";
import { PMFConstants } from "../../../../../../src/imperative/plugins/utilities/PMFConstants";
import UpdateHandler from "../../../../../../src/imperative/plugins/cmd/update/update.handler";
import * as NpmFunctions from "../../../../../../src/imperative/plugins/utilities/NpmFunctions";
import * as ChildProcesses from "child_process";
import * as JsonFile from "jsonfile";
import * as NpmInterface from "../../../../../../src/imperative/plugins/utilities/npm-interface";

describe("Plugin Management Facility update handler", () => {

    const resolveVal = "test/imperative-plugins";

    const mocks = {
        npmLoginSpy: jest.spyOn(NpmFunctions, 'npmLogin') as jest.SpyInstance,
        execSyncSpy: jest.spyOn(ChildProcesses, 'execSync') as jest.SpyInstance,
        readFileSyncSpy: jest.spyOn(JsonFile, 'readFileSync') as jest.SpyInstance,
        writeFileSyncSpy: jest.spyOn(JsonFile, 'writeFileSync') as jest.SpyInstance,
        updateSpy: jest.spyOn(NpmInterface, 'update') as jest.SpyInstance,
    };

    // two plugin set of values
    const packageName = resolveVal;
    const packageVersion = "1.0.5";
    const packageRegistry = "https://registry.npmjs.org/";

    const packageName2 = "plugin1";
    const packageVersion2 = "2.0.3";
    const packageRegistry2 = "http://imperative-npm-registry:4873/";

    const pluginName = "imperative-sample-plugin";

    beforeEach(() => {
    // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();

        // This needs to be mocked before running process function of update handler
        (Logger.getImperativeLogger as unknown as Mock<typeof Logger.getImperativeLogger>).mockReturnValue(new Logger(new Console()) as any);
        mocks.execSyncSpy.mockReturnValue(packageRegistry as any);
        mocks.readFileSyncSpy.mockReturnValue({} as any);
        NpmFunctions.npmLogin(packageRegistry);
    });

    /**
     *  Create object to be passed to process function
     *
     * @returns {IHandlerParameters}
     */
    const getIHandlerParametersObject = (): IHandlerParameters => {
        const x: any = {
            response: new (HandlerResponse as any)(),
            arguments: {
                plugin: undefined
            },
        };
        return x as IHandlerParameters;
    };

    afterAll(() => {
        jest.restoreAllMocks();
    });

    /**
     * Validates that an update call was valid based on the parameters passed.
     *
     * @param {string}   packageNameParm        expected package location that install was called with.
     * @param {string}   registry               expected registry that install was called with.
     */
    const wasUpdateCallValid = (
        packageNameParm: string,
        registry: string
    ) => {
        expect(mocks.updateSpy).toHaveBeenCalledWith(
            packageNameParm, registry
        );
    };

    /**
     * Checks that the successful message was written.
     *
     * @param {IHandlerParameters} params The parameters that were passed to the
     *                                    process function.
     */
    const wasUpdateSuccessful = (params: IHandlerParameters) => {
        expect(params.response.console.log).toHaveBeenCalledWith(`Update of the npm package(${params.arguments.plugin}) was successful.\n`);
    };

    /**
     * Validates that an npmLogin was called
     * when login needed based on the parameters passed.
     */
    const wasNpmLoginCallValid = (registry: string) => {
        expect(mocks.npmLoginSpy).toHaveBeenCalledWith(registry);
    };

    /**
     * Checks that writeFileSync call was correct.
     *
     * @param {string} location The location of the plugins.json file
     *
     * @param (IPluginJson) fileJson The contents to be written to the file
     */
    const wasWriteFileSyncValid = (location: string, fileJson: IPluginJson) => {
        expect(mocks.writeFileSyncSpy).toHaveBeenCalledWith(
            location, fileJson, {spaces: 2}
        );
    };

    test("update specified plugin", async () => {

        // plugin definitions mocking file contents
        const fileJson: IPluginJson = {
            "imperative-sample-plugin": {
                package: packageName,
                registry: packageRegistry,
                version: packageVersion
            },
            "plugin1": {
                package: packageName2,
                registry: packageRegistry2,
                version: packageVersion2
            }
        };

        // Override the return value for this test only
        mocks.readFileSyncSpy.mockReturnValueOnce(fileJson as any);

        const handler = new UpdateHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = pluginName;
        params.arguments.registry = packageRegistry;

        await handler.process(params as IHandlerParameters);

        // Validate the call to login
        wasNpmLoginCallValid(packageRegistry);
        wasWriteFileSyncValid(PMFConstants.instance.PLUGIN_JSON, fileJson);
        wasUpdateCallValid(packageName, packageRegistry);

        expect(params.response.console.log).toHaveBeenCalledWith(
            `Update of the npm package(${resolveVal}) was successful.\n`);
    });

    test("update imperative-sample-plugin", async () => {

        // plugin definitions mocking file contents
        const fileJson: IPluginJson = {
            "imperative-sample-plugin": {
                package: resolveVal,
                registry: packageRegistry,
                version: "1.0.1"
            }
        };

        // Override the return value for this test only
        mocks.readFileSyncSpy.mockReturnValueOnce(fileJson as any);

        const handler = new UpdateHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = "imperative-sample-plugin";

        await handler.process(params as IHandlerParameters);

        // Validate the call to login
        wasNpmLoginCallValid(packageRegistry);
        wasWriteFileSyncValid(PMFConstants.instance.PLUGIN_JSON, fileJson);
        wasUpdateCallValid(resolveVal, packageRegistry);
        expect(params.response.console.log).toHaveBeenCalledWith(
            `Update of the npm package(${resolveVal}) was successful.\n`);
    });
});

