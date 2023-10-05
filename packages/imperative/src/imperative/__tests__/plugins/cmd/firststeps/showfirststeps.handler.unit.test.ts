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

jest.mock("../../../../../cmd/src/response/CommandResponse");
jest.mock("../../../../../cmd/src/response/HandlerResponse");

import { CommandResponse, IHandlerParameters } from "../../../../../cmd";
import { ImperativeConfig } from "../../../../../utilities/src/ImperativeConfig";
import { IImperativeConfig } from "../../../../src/doc/IImperativeConfig";
import { resolve } from "path";
import { TextUtils } from "../../../../../utilities";
import FirststepsHandler from "../../../../src/plugins/cmd/showfirststeps/showfirststeps.handler";
import { ImperativeError } from "../../../../../error/src/ImperativeError";
import { IPluginCfgProps } from "../../../../src/plugins/doc/IPluginCfgProps";
import { PluginManagementFacility } from "../../../../src/plugins/PluginManagementFacility";

describe("Plugin first steps command handler", () => {

    const pluginName = "sample-plugin";
    const pluginNameFS = "sample-plugin-first-steps";

    /* Put a base CLI config into ImperativeConfig. It is required by infrastructure
    * that is called underneath the functions that we want to test.
    */
    const impCfg: ImperativeConfig = ImperativeConfig.instance;
    impCfg.loadedConfig = require("../../__resources__/baseCliConfig.testData");
    impCfg.callerLocation = resolve("../../../../../../imperative-sample/lib/index.js");

    const PMF = PluginManagementFacility.instance as any;

    const goodPluginSummary: string = "This is my plugin summary!";
    const goodPluginAliases: string[] = ["sp", "samp"];

    const basePluginConfig: IImperativeConfig = {
        name: "sample-plugin",
        pluginAliases: goodPluginAliases,
        pluginSummary: goodPluginSummary,
        rootCommandDescription: "imperative sample plugin",
        definitions: [
            {
                name: "foo",
                description: "dummy foo command",
                type: "command",
                handler: "./lib/sample-plugin/cmd/foo/foo.handler"
            },
            {
                name: "bar",
                description: "dummy bar command",
                type: "command",
                handler: "./lib/sample-plugin/cmd/bar/bar.handler"
            }
        ],
        profiles: [
            {
                type: "TestProfile",
                schema: {
                    type: "object",
                    title: "The test profile schema",
                    description: "The test command profile description",
                    properties: {
                        size: {
                            optionDefinition: {
                                description: "Some description of size",
                                type: "string",
                                name: "size", aliases: ["s"],
                                required: true
                            },
                            type: "string",
                        }
                    }
                }
            }
        ]
    };

    const basePluginConfigWithFirstSteps: IImperativeConfig = {
        name: "sample-plugin-first-steps",
        pluginAliases: goodPluginAliases,
        pluginSummary: goodPluginSummary,
        rootCommandDescription: "imperative sample plugin fs",
        definitions: [
            {
                name: "foo",
                description: "dummy foo command",
                type: "command",
                handler: "./lib/sample-plugin/cmd/foo/foo.handler"
            },
            {
                name: "bar",
                description: "dummy bar command",
                type: "command",
                handler: "./lib/sample-plugin/cmd/bar/bar.handler"
            }
        ],
        profiles: [
            {
                type: "TestProfile",
                schema: {
                    type: "object",
                    title: "The test profile schema",
                    description: "The test command profile description",
                    properties: {
                        size: {
                            optionDefinition: {
                                description: "Some description of size",
                                type: "string",
                                name: "size", aliases: ["s"],
                                required: true
                            },
                            type: "string",
                        }
                    }
                }
            }
        ],
        pluginFirstSteps: "These are the first steps"
    };


    const basePluginCfgProps: IPluginCfgProps = {
        pluginName: pluginName,
        npmPackageName: "PluginNpmPkgName",
        impConfig: basePluginConfig,
        cliDependency: {
            peerDepName: "@zowe/cli",
            peerDepVer: "-1"
        },
        impDependency: {
            peerDepName: "@zowe/imperative",
            peerDepVer: "-1"
        }
    };

    const basePluginCfgPropFirstSteps: IPluginCfgProps = {
        pluginName: pluginNameFS,
        npmPackageName: "PluginNpmPkgName",
        impConfig: basePluginConfigWithFirstSteps,
        cliDependency: {
            peerDepName: "@zowe/cli",
            peerDepVer: "-1"
        },
        impDependency: {
            peerDepName: "@zowe/imperative",
            peerDepVer: "-1"
        }
    };

    const mockInstalledPlugins: IPluginCfgProps[] = [basePluginCfgProps, basePluginCfgPropFirstSteps];

    /**
     * Create object to be passed to process function
     *
     * @returns {IHandlerParameters}
     */
    const getIHandlerParametersObject = (): IHandlerParameters => {
        const x: any = {
            response: new (CommandResponse as any)(),
            arguments: {
                plugin: null
            }
        };
        return x as IHandlerParameters;
    };

    const params = getIHandlerParametersObject();
    const firststepsHandler = new FirststepsHandler() as any;

    beforeEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();

        jest.fn().mockReturnValue(mockInstalledPlugins);

        PMF.mAllPluginCfgProps = mockInstalledPlugins;
    });

    it("should display proper message when no plugin is provided in arguments", async () => {
        // plugin name is null
        params.arguments.plugin = null;
        let errorWithParameterNull;
        try {
            await firststepsHandler.process(params as IHandlerParameters);
        } catch (err) {
            errorWithParameterNull = err;
        }
        expect(errorWithParameterNull).toBeDefined();
        expect(errorWithParameterNull).toBeInstanceOf(ImperativeError);
        expect(errorWithParameterNull.message).toBe(`${TextUtils.chalk.yellow.bold("Package name")} is required.`);

        // // plugin name is empty
        params.arguments.plugin = "";
        let errorWithParameterEmpty;
        try {
            await firststepsHandler.process(params as IHandlerParameters);
        } catch (err) {
            errorWithParameterEmpty = err;
        }
        expect(errorWithParameterEmpty).toBeDefined();
        expect(errorWithParameterEmpty).toBeInstanceOf(ImperativeError);
        expect(errorWithParameterEmpty.message).toBe(`${TextUtils.chalk.yellow.bold("Package name")} is required.`);
    });

    it("should have no first steps with non-existent plugin name", async () => {
        params.arguments.plugin = ["NonExistentPluginName"];
        let error;
        try {
            await firststepsHandler.process(params as IHandlerParameters);
        } catch (err) {
            error = err;
        }
        expect(params.response.console.log).toHaveBeenCalledWith(
            "The specified plugin is not installed."
        );
        expect(error).not.toBeDefined();
    });

    it("should have existent plugin name with no first steps", async () => {
        params.arguments.plugin = ["sample-plugin"];
        let error;

        try {
            await firststepsHandler.process(params as IHandlerParameters);
        } catch (err) {
            error = err;
        }
        expect(params.response.console.log).toHaveBeenCalledWith(
            "The first steps are not defined for this plugin."
        );
        expect(error).not.toBeDefined();
    });

    it("should have existent plugin name with first steps defined", async () => {
        params.arguments.plugin = ["sample-plugin-first-steps"];
        let error;

        try {
            await firststepsHandler.process(params as IHandlerParameters);
        } catch (err) {
            error = err;
        }
        expect(params.response.console.log).toHaveBeenCalledWith(
            "These are the first steps"
        );
        expect(error).not.toBeDefined();
    });

});

