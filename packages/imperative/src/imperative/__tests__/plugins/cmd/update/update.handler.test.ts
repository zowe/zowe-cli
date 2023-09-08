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
jest.mock("../../../../src/plugins/utilities/npm-interface/update");
jest.mock("../../../../src/plugins/utilities/PMFConstants");
jest.mock("../../../../../cmd/src/doc/handler/IHandlerParameters");
jest.mock("../../../../../cmd/src/response/CommandResponse");
jest.mock("../../../../../logger");
jest.mock("../../../../src/plugins/utilities/NpmFunctions");

import { CommandResponse, IHandlerParameters } from "../../../../../cmd";
import { Console } from "../../../../../console";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "jsonfile";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { Logger } from "../../../../../logger";
import { PMFConstants } from "../../../../src/plugins/utilities/PMFConstants";
import { update } from "../../../../src/plugins/utilities/npm-interface";
import UpdateHandler from "../../../../src/plugins/cmd/update/update.handler";
import { npmLogin } from "../../../../src/plugins/utilities/NpmFunctions";

describe("Plugin Management Facility update handler", () => {

    const resolveVal = "Users/SWAWI03/IdeaProjects/imperative-plugins";

    // Objects created so types are correct.
    const mocks = {
        npmLogin: npmLogin as Mock<typeof  npmLogin>,
        execSync: execSync as Mock<typeof execSync>,
        readFileSync: readFileSync as Mock<typeof readFileSync>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>,
        update: update as Mock<typeof update>
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
        (Logger.getImperativeLogger as Mock<typeof Logger.getImperativeLogger>).mockReturnValue(new Logger(new Console()));
        mocks.execSync.mockReturnValue(packageRegistry);
        mocks.readFileSync.mockReturnValue({});
        npmLogin(packageRegistry);
    });

    /**
   *  Create object to be passed to process function
   *
   * @returns {IHandlerParameters}
   */
    const getIHandlerParametersObject = (): IHandlerParameters => {
        const x: any = {
            response: new (CommandResponse as any)(),
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
        expect(mocks.update).toHaveBeenCalledWith(
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
        expect(mocks.npmLogin).toHaveBeenCalledWith(registry);
    };

    /**
   * Checks that writeFileSync call was correct.
   *
   * @param {string} location The location of the plugins.json file
   *
   * @param (IPluginJson) fileJson The contents to be written to the file
   */
    const wasWriteFileSyncValid = (location: string, fileJson: IPluginJson) => {
        expect(mocks.writeFileSync).toHaveBeenCalledWith(
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
        mocks.readFileSync.mockReturnValueOnce(fileJson);

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
        mocks.readFileSync.mockReturnValueOnce(fileJson);

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

