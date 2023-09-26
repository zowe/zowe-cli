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

import * as fs from "fs";
import * as fsExtra from "fs-extra";
import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk";
import { Config, ConfigBuilder, ConfigSchema } from "../../../../../config";
import { IHandlerParameters } from "../../../../../cmd";
import { ProfileIO } from "../../../../../profiles";
import { AppSettings } from "../../../../../settings";
import { ImperativeConfig } from "../../../../../utilities";
import * as npmInterface from "../../../../src/plugins/utilities/npm-interface";
import { PluginIssues } from "../../../../src/plugins/utilities/PluginIssues";
import ConvertProfilesHandler from "../../../../src/config/cmd/convert-profiles/convert-profiles.handler";

jest.mock("../../../../src/plugins/utilities/npm-interface");
jest.mock("../../../../../imperative/src/OverridesLoader");

let stdout;
let stderr;

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
                    stdout += logs;
                }),
                error: jest.fn((errors) => {
                    stderr += errors;
                }),
                errorHeader: jest.fn(() => undefined),
                prompt: jest.fn()
            }
        },
        arguments: {},
    };
    return x as IHandlerParameters;
};

describe("Configuration Convert Profiles command handler", () => {
    let mockImperativeConfig: any;

    beforeEach(() => {
        mockImperativeConfig = {
            cliHome: __dirname,
            config: {
                api: {
                    layers: {
                        activate: jest.fn(),
                        merge: jest.fn()
                    }
                },
                layerActive: jest.fn().mockReturnValue({}),
                save: jest.fn(),
                exists: false
            }
        };
        stdout = stderr = "";
        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue(mockImperativeConfig);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should do nothing if there are no old plug-ins or profiles", async () => {
        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(0);
        const params = getIHandlerParametersObject();

        await handler.process(params);
        expect(stdout).toContain("No old profiles were found");
        expect(stderr).toBe("");
    });

    it("should remove obsolete plug-ins", async () => {
        const oldPluginInfo = {
            plugins: ["pluginA", "pluginB"],
            overrides: ["overrideX"]
        };
        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce(oldPluginInfo);
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(0);
        jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
            getInstalledPlugins: jest.fn().mockReturnValue({ "pluginA": null, "pluginB": null })
        } as any);
        const removeOverrideSpy = jest.spyOn(handler as any, "removeOverride").mockImplementation();
        const uninstallSpy = jest.spyOn(npmInterface, "uninstall")
            .mockImplementationOnce(() => { throw new Error("invalid plugin"); })
            .mockImplementation();
        const params = getIHandlerParametersObject();
        params.arguments.prompt = false;

        await handler.process(params);
        expect(stdout).toContain("The following plug-ins will be removed");
        expect(stdout).toContain("Uninstalled plug-in: pluginB");
        expect(stderr).toContain("Failed to uninstall plug-in \"pluginA\"");
        expect(removeOverrideSpy).toHaveBeenCalledWith("overrideX", 0, ["overrideX"]);
        expect(uninstallSpy).toHaveBeenCalledTimes(2);
    });

    it("should convert old profiles", async () => {
        const metaError = new Error("invalid meta file");
        const profileError = new Error("invalid profile file");
        jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {
                fruit: ["apple", "coconut"]
            },
            profilesFailed: [
                { name: "banana", type: "fruit", error: profileError },
                { type: "fruit", error: metaError }
            ]
        });
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(3);
        const params = getIHandlerParametersObject();
        params.arguments.prompt = false;

        await handler.process(params);
        expect(stdout).toContain("Detected 3 old profile(s)");
        expect(stdout).toContain("Converted fruit profiles: apple, coconut");
        expect(stderr).toContain("Failed to load fruit profile \"banana\"");
        expect(stderr).toContain(profileError.message);
        expect(stderr).toContain("Failed to find default fruit profile");
        expect(stderr).toContain(metaError.message);
        expect(updateSchemaSpy).toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).toHaveBeenCalled();
    });

    it("should not convert old profiles if team config already exists", async () => {
        jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {
                fruit: ["apple", "coconut", "banana"]
            },
            profilesFailed: []
        });
        mockImperativeConfig.config.exists = true;
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(3);
        const params = getIHandlerParametersObject();
        params.arguments.prompt = false;

        await handler.process(params);
        expect(stdout).toContain("A team configuration file was detected");
        expect(stdout).toContain("No old profiles were found");
        expect(stdout).not.toContain("Converted fruit profiles: apple, coconut");
        expect(updateSchemaSpy).not.toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).not.toHaveBeenCalled();
    });

    it("should remove plug-ins and convert profiles if prompt is accepted", async () => {
        const configConvertSpy = jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {},
            profilesFailed: []
        });
        jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: ["fake-plugin"], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(1);
        jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
            getInstalledPlugins: jest.fn().mockReturnValue({ "fake-plugin": null })
        } as any);
        const uninstallSpy = jest.spyOn(npmInterface, "uninstall").mockImplementation();
        const params = getIHandlerParametersObject();
        (params.response.console.prompt as any).mockResolvedValueOnce("y");

        await handler.process(params);
        expect(stdout).toContain("Detected 1 old profile(s)");
        expect(stdout).toContain("The following plug-ins will be removed");
        expect(stdout).toContain("Your new profiles have been saved");
        expect(stdout).toContain("Your old profiles have been moved");
        expect(stderr).toBe("");
        expect(uninstallSpy).toHaveBeenCalled();
        expect(configConvertSpy).toHaveBeenCalled();
    });

    it("should do nothing if prompt is rejected", async () => {
        const configConvertSpy = jest.spyOn(ConfigBuilder, "convert");

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: ["fake-plugin"], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(1);
        const uninstallSpy = jest.spyOn(npmInterface, "uninstall");
        const params = getIHandlerParametersObject();
        (params.response.console.prompt as any).mockResolvedValueOnce("n");

        await handler.process(params);
        expect(stdout).toContain("Detected 1 old profile(s)");
        expect(stdout).toContain("The following plug-ins will be removed");
        expect(stderr).toBe("");
        expect(uninstallSpy).not.toHaveBeenCalled();
        expect(configConvertSpy).not.toHaveBeenCalled();
    });

    it("should remove existing profiles and delete secure properties", async () => {
        const metaError = new Error("invalid meta file");
        jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {
                fruit: ["apple", "coconut", "banana"]
            },
            profilesFailed: []
        });
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();
        jest.spyOn(keytar, "findCredentials").mockResolvedValue([
            {account: "testAcct", password: "testPassword"}
        ]);
        jest.spyOn(keytar, "deletePassword").mockResolvedValue(true);
        const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockImplementation(() => {
            return true;
        });

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(3);
        const findOldSecurePropsSpy = jest.spyOn(handler as any, "findOldSecureProps");
        const deleteOldSecurePropsSpy = jest.spyOn(handler as any, "deleteOldSecureProps");

        const params = getIHandlerParametersObject();
        params.arguments.prompt = false;
        params.arguments.delete = true;

        await handler.process(params);
        expect(stdout).toContain("Detected 3 old profile(s)");
        expect(stdout).toContain("Converted fruit profiles: apple, coconut, banana");
        expect(stdout).toContain("Deleting the profiles directory");
        expect(stdout).toContain("Deleting secure value for \"@brightside/core/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"@zowe/cli/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Broadcom-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe/testAcct\"");
        expect(updateSchemaSpy).toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).toHaveBeenCalled();
        expect(removeSyncSpy).toHaveBeenCalledTimes(1);
        expect(findOldSecurePropsSpy).toHaveBeenCalledTimes(5);
        expect(deleteOldSecurePropsSpy).toHaveBeenCalledTimes(5);
    });

    it("should remove existing profiles and delete secure properties with prompt", async () => {
        const metaError = new Error("invalid meta file");
        jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {
                fruit: ["apple", "coconut", "banana"]
            },
            profilesFailed: []
        });
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();
        jest.spyOn(keytar, "findCredentials").mockResolvedValue([
            {account: "testAcct", password: "testPassword"}
        ]);
        jest.spyOn(keytar, "deletePassword").mockResolvedValue(true);
        const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockImplementation(() => {
            return true;
        });

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(3);
        const findOldSecurePropsSpy = jest.spyOn(handler as any, "findOldSecureProps");
        const deleteOldSecurePropsSpy = jest.spyOn(handler as any, "deleteOldSecureProps");

        const params = getIHandlerParametersObject();
        (params.response.console.prompt as any).mockResolvedValueOnce("y").mockResolvedValueOnce("y");
        params.arguments.delete = true;

        await handler.process(params);
        expect(stdout).toContain("Detected 3 old profile(s)");
        expect(stdout).toContain("Converted fruit profiles: apple, coconut, banana");
        expect(stdout).toContain("Deleting the profiles directory");
        expect(stdout).toContain("Deleting secure value for \"@brightside/core/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"@zowe/cli/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Broadcom-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe/testAcct\"");
        expect(updateSchemaSpy).toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).toHaveBeenCalled();
        expect(removeSyncSpy).toHaveBeenCalledTimes(1);
        expect(findOldSecurePropsSpy).toHaveBeenCalledTimes(5);
        expect(deleteOldSecurePropsSpy).toHaveBeenCalledTimes(5);
        expect(params.response.console.prompt).toHaveBeenCalledTimes(2);
    });

    it("should remove existing profiles and not delete secure properties with prompt", async () => {
        const metaError = new Error("invalid meta file");
        jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {
                fruit: ["apple", "coconut", "banana"]
            },
            profilesFailed: []
        });
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();
        jest.spyOn(keytar, "findCredentials").mockResolvedValue([
            {account: "testAcct", password: "testPassword"}
        ]);
        jest.spyOn(keytar, "deletePassword").mockResolvedValue(true);
        const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockImplementation(() => {
            return true;
        });

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(3);
        const findOldSecurePropsSpy = jest.spyOn(handler as any, "findOldSecureProps");
        const deleteOldSecurePropsSpy = jest.spyOn(handler as any, "deleteOldSecureProps");

        const params = getIHandlerParametersObject();
        (params.response.console.prompt as any).mockResolvedValueOnce("y").mockResolvedValueOnce("n");
        params.arguments.delete = true;

        await handler.process(params);
        expect(stdout).toContain("Detected 3 old profile(s)");
        expect(stdout).toContain("Converted fruit profiles: apple, coconut, banana");
        expect(stdout).not.toContain("Deleting the profiles directory");
        expect(stdout).not.toContain("Deleting secure value for \"@brightside/core/testAcct\"");
        expect(stdout).not.toContain("Deleting secure value for \"@zowe/cli/testAcct\"");
        expect(stdout).not.toContain("Deleting secure value for \"Zowe-Plugin/testAcct\"");
        expect(stdout).not.toContain("Deleting secure value for \"Broadcom-Plugin/testAcct\"");
        expect(stdout).not.toContain("Deleting secure value for \"Zowe/testAcct\"");
        expect(updateSchemaSpy).toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).toHaveBeenCalled();
        expect(removeSyncSpy).toHaveBeenCalledTimes(0);
        expect(findOldSecurePropsSpy).toHaveBeenCalledTimes(0);
        expect(deleteOldSecurePropsSpy).toHaveBeenCalledTimes(0);
        expect(params.response.console.prompt).toHaveBeenCalledTimes(2);
    });

    it("should remove existing profiles and delete secure properties except secure_config_props", async () => {
        const metaError = new Error("invalid meta file");
        jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {
                fruit: ["apple", "coconut", "banana"]
            },
            profilesFailed: []
        });
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();
        jest.spyOn(keytar, "findCredentials").mockResolvedValue([
            {account: "testAcct", password: "testPassword"},
            {account: "secure_config_props", password: "testPassword"},
            {account: "secure_config_props-1", password: "testPassword"}
        ]);
        jest.spyOn(keytar, "deletePassword").mockResolvedValue(true);
        const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockImplementation(() => {
            return true;
        });

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(3);
        const findOldSecurePropsSpy = jest.spyOn(handler as any, "findOldSecureProps");
        const deleteOldSecurePropsSpy = jest.spyOn(handler as any, "deleteOldSecureProps");

        const params = getIHandlerParametersObject();
        params.arguments.prompt = false;
        params.arguments.delete = true;

        await handler.process(params);
        expect(stdout).toContain("Detected 3 old profile(s)");
        expect(stdout).toContain("Converted fruit profiles: apple, coconut, banana");
        expect(stdout).toContain("Deleting the profiles directory");
        expect(stdout).toContain("Deleting secure value for \"@brightside/core/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"@zowe/cli/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Broadcom-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe/testAcct\"");
        expect(updateSchemaSpy).toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).toHaveBeenCalled();
        expect(removeSyncSpy).toHaveBeenCalledTimes(1);
        expect(findOldSecurePropsSpy).toHaveBeenCalledTimes(5);
        expect(deleteOldSecurePropsSpy).toHaveBeenCalledTimes(5);
    });

    it("should handle no profiles and delete secure properties except secure_config_props with prompt", async () => {
        const configBuilderConvertSpy = jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {},
            profilesFailed: []
        });
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();
        jest.spyOn(keytar, "findCredentials").mockResolvedValue([
            {account: "testAcct", password: "testPassword"},
            {account: "secure_config_props", password: "testPassword"},
            {account: "secure_config_props-1", password: "testPassword"}
        ]);
        jest.spyOn(keytar, "deletePassword").mockResolvedValue(true);
        const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockImplementation(() => {
            return true;
        });

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(0);
        const findOldSecurePropsSpy = jest.spyOn(handler as any, "findOldSecureProps");
        const deleteOldSecurePropsSpy = jest.spyOn(handler as any, "deleteOldSecureProps");

        const params = getIHandlerParametersObject();
        (params.response.console.prompt as any).mockResolvedValueOnce("y");
        params.arguments.prompt = true;
        params.arguments.delete = true;

        await handler.process(params);
        expect(stdout).toContain("No old profiles were found");
        expect(stdout).toContain("Deleting the profiles directory");
        expect(stdout).toContain("Deleting secure value for \"@brightside/core/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"@zowe/cli/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Broadcom-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe/testAcct\"");
        expect(configBuilderConvertSpy).not.toHaveBeenCalled();
        expect(updateSchemaSpy).not.toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).not.toHaveBeenCalled();
        expect(removeSyncSpy).toHaveBeenCalledTimes(1);
        expect(findOldSecurePropsSpy).toHaveBeenCalledTimes(5);
        expect(deleteOldSecurePropsSpy).toHaveBeenCalledTimes(5);
        expect(params.response.console.prompt).toHaveBeenCalledTimes(1);
    });

    it("should remove existing profiles, delete secure properties, and handle a rimraf delete error", async () => {
        jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {
                fruit: ["apple", "coconut", "banana"]
            },
            profilesFailed: []
        });
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();
        jest.spyOn(keytar, "findCredentials").mockResolvedValue([
            {account: "testAcct", password: "testPassword"}
        ]);
        jest.spyOn(keytar, "deletePassword").mockResolvedValue(true);
        const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockImplementation(() => {
            throw new Error("test error");
        });

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(3);
        const findOldSecurePropsSpy = jest.spyOn(handler as any, "findOldSecureProps");
        const deleteOldSecurePropsSpy = jest.spyOn(handler as any, "deleteOldSecureProps");

        const params = getIHandlerParametersObject();
        params.arguments.prompt = false;
        params.arguments.delete = true;

        await handler.process(params);
        expect(stdout).toContain("Detected 3 old profile(s)");
        expect(stdout).toContain("Converted fruit profiles: apple, coconut, banana");
        expect(stdout).toContain("Deleting secure value for \"@brightside/core/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"@zowe/cli/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Broadcom-Plugin/testAcct\"");
        expect(stdout).toContain("Deleting secure value for \"Zowe/testAcct\"");
        expect(stderr).toContain("Failed to delete the profiles directory");
        expect(updateSchemaSpy).toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).toHaveBeenCalled();
        expect(removeSyncSpy).toHaveBeenCalledTimes(1);
        expect(findOldSecurePropsSpy).toHaveBeenCalledTimes(5);
        expect(deleteOldSecurePropsSpy).toHaveBeenCalledTimes(5);
    });

    it("should throw an error if keytar unavailable", async () => {
        const metaError = new Error("invalid meta file");
        jest.spyOn(ConfigBuilder, "convert").mockResolvedValueOnce({
            config: Config.empty(),
            profilesConverted: {
                fruit: ["apple", "coconut", "banana"]
            },
            profilesFailed: []
        });
        const updateSchemaSpy = jest.spyOn(ConfigSchema, "updateSchema").mockReturnValueOnce(undefined);
        jest.spyOn(fs, "renameSync").mockReturnValueOnce();
        jest.spyOn(keytar, "findCredentials").mockImplementation(() => {
            throw new Error("test error");
        });
        const removeSyncSpy = jest.spyOn(fsExtra, "removeSync").mockImplementation(() => {
            return true;
        });

        const handler = new ConvertProfilesHandler();
        jest.spyOn(handler as any, "getOldPluginInfo").mockReturnValueOnce({ plugins: [], overrides: [] });
        jest.spyOn(handler as any, "getOldProfileCount").mockReturnValueOnce(3);

        const params = getIHandlerParametersObject();
        params.arguments.prompt = false;
        params.arguments.delete = true;

        await handler.process(params);
        expect(stdout).toContain("Detected 3 old profile(s)");
        expect(stdout).toContain("Converted fruit profiles: apple, coconut, banana");
        expect(stdout).toContain("Deleting the profiles directory");
        expect(stderr).toContain("Keytar or the credential vault are unavailable.");
        expect(stdout).not.toContain("Deleting secure value for \"@brightside/core/testAcct\"");
        expect(stdout).not.toContain("Deleting secure value for \"@zowe/cli/testAcct\"");
        expect(stdout).not.toContain("Deleting secure value for \"Zowe-Plugin/testAcct\"");
        expect(stdout).not.toContain("Deleting secure value for \"Broadcom-Plugin/testAcct\"");
        expect(stdout).not.toContain("Deleting secure value for \"Zowe/testAcct\"");
        expect(updateSchemaSpy).toHaveBeenCalled();
        expect(mockImperativeConfig.config.save).toHaveBeenCalled();
        expect(removeSyncSpy).toHaveBeenCalledTimes(1);
    });

    describe("getOldPluginInfo", () => {
        it("should return empty list", () => {
            const handler = new ConvertProfilesHandler();
            mockImperativeConfig.hostPackageName = "fake-cli";
            const result = (handler as any).getOldPluginInfo();
            expect(result).toMatchObject({ plugins: [], overrides: [] });
        });

        it("should return default credential manager with override for Zowe CLI v1", () => {
            mockImperativeConfig.hostPackageName = "@zowe/cli";
            const pluginName = "@zowe/secure-credential-store-for-zowe-cli";
            jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                get: jest.fn().mockReturnValue(pluginName)
            } as any);
            jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
                getInstalledPlugins: jest.fn().mockReturnValue({ [pluginName]: null })
            } as any);

            const handler = new ConvertProfilesHandler();
            const result = (handler as any).getOldPluginInfo();
            expect(result).toMatchObject({
                plugins: [pluginName],
                overrides: ["CredentialManager"]
            });
        });

        it("should return default credential manager without override for Zowe CLI v1", () => {
            mockImperativeConfig.hostPackageName = "@zowe/cli";
            const pluginName = "@zowe/secure-credential-store-for-zowe-cli";
            jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                get: jest.fn().mockReturnValue(false)
            } as any);
            jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
                getInstalledPlugins: jest.fn().mockReturnValue({ [pluginName]: null })
            } as any);

            const handler = new ConvertProfilesHandler();
            const result = (handler as any).getOldPluginInfo();
            expect(result).toMatchObject({
                plugins: [pluginName],
                overrides: []
            });
        });

        it("should return old credential manager plug-in for Zowe CLI v2", () => {
            mockImperativeConfig.hostPackageName = "@zowe/cli";
            const pluginName = "@zowe/secure-credential-store-for-zowe-cli";
            jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                get: jest.fn().mockReturnValue("@zowe/cli")
            } as any);
            jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
                getInstalledPlugins: jest.fn().mockReturnValue({ [pluginName]: null })
            } as any);

            const handler = new ConvertProfilesHandler();
            const result = (handler as any).getOldPluginInfo();
            expect(result).toMatchObject({
                plugins: [pluginName],
                overrides: []
            });
        });

        it("should not return default credential manager for Zowe CLI v2", () => {
            mockImperativeConfig.hostPackageName = "@zowe/cli";
            jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                get: jest.fn().mockReturnValue("@zowe/cli")
            } as any);
            jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
                getInstalledPlugins: jest.fn().mockReturnValue({})
            } as any);

            const handler = new ConvertProfilesHandler();
            const result = (handler as any).getOldPluginInfo();
            expect(result).toMatchObject({ plugins: [], overrides: [] });
        });

        it("should return custom credential manager override for Zowe CLI", () => {
            mockImperativeConfig.hostPackageName = "@zowe/cli";
            jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                get: jest.fn().mockReturnValue("ABC")
            } as any);
            jest.spyOn(PluginIssues, "instance", "get").mockReturnValue({
                getInstalledPlugins: jest.fn().mockReturnValue({})
            } as any);

            const handler = new ConvertProfilesHandler();
            const result = (handler as any).getOldPluginInfo();
            expect(result).toMatchObject({
                plugins: [],
                overrides: ["CredentialManager"]
            });
        });
    });

    describe("checkKeytarAvailable", () => {
        it("should return true if keytar does not error out", async () => {
            const findCredentialsSpy = jest.spyOn(keytar, "findCredentials").mockResolvedValue([{account: "fake", password: "fake"}]);

            const handler = new ConvertProfilesHandler();
            const result = await (handler as any).checkKeytarAvailable();
            expect(result).toEqual(true);
            expect(findCredentialsSpy).toHaveBeenCalledWith("@zowe/cli");
        });
        it("should return false if keytar errors out", async () => {
            jest.spyOn(keytar, "findCredentials").mockImplementation(() => {
                throw new Error("fake error");
            });

            const handler = new ConvertProfilesHandler();
            const result = await (handler as any).checkKeytarAvailable();
            expect(result).toEqual(false);
        });
    });

    describe("findOldSecureProps", () => {
        it("should find existing Zowe accounts", async () => {
            const findCredentialsSpy = jest.spyOn(keytar, "findCredentials").mockResolvedValue([
                {account: "fake1", password: "fakePass1"},
                {account: "fake2", password: "fakePass2"},
                {account: "fake3", password: "fakePass3"},
                {account: "fake4", password: "fakePass4"}
            ]);

            const handler = new ConvertProfilesHandler();
            Object.defineProperty(handler, "keytar", {writable: false, value: keytar});
            const handlerParmsObj = getIHandlerParametersObject();
            const result = await (handler as any).findOldSecureProps("Zowe", handlerParmsObj);
            expect(result).toEqual(["fake1", "fake2", "fake3", "fake4"]);
            expect(findCredentialsSpy).toHaveBeenCalledWith("Zowe");
            expect(handlerParmsObj.response.console.error).toHaveBeenCalledTimes(0);
        });
        it("should not find existing Zowe accounts", async () => {
            const findCredentialsSpy = jest.spyOn(keytar, "findCredentials").mockResolvedValue([]);

            const handler = new ConvertProfilesHandler();
            Object.defineProperty(handler, "keytar", {writable: false, value: keytar});
            const handlerParmsObj = getIHandlerParametersObject();
            const result = await (handler as any).findOldSecureProps("Zowe", handlerParmsObj);
            expect(result).toEqual([]);
            expect(findCredentialsSpy).toHaveBeenCalledWith("Zowe");
            expect(handlerParmsObj.response.console.error).toHaveBeenCalledTimes(0);
        });
        it("should error while finding existing Zowe accounts and catch error", async () => {
            const findCredentialsSpy = jest.spyOn(keytar, "findCredentials").mockImplementation(() => {
                throw new Error("test error");
            });

            const handler = new ConvertProfilesHandler();
            Object.defineProperty(handler, "keytar", {writable: false, value: keytar});
            const handlerParmsObj = getIHandlerParametersObject();
            const result = await (handler as any).findOldSecureProps("Zowe", handlerParmsObj);
            expect(result).toEqual([]);
            expect(findCredentialsSpy).toHaveBeenCalledWith("Zowe");
            expect(handlerParmsObj.response.console.error).toHaveBeenCalledTimes(1);
            expect(stderr).toContain("Encountered an error while gathering profiles for service");
        });
    });

    describe("deleteOldSecureProps", () => {
        it("should properly delete a credential and return success", async() => {
            const findCredentialsSpy = jest.spyOn(keytar, "deletePassword").mockResolvedValue(true);

            const handler = new ConvertProfilesHandler();
            Object.defineProperty(handler, "keytar", {writable: false, value: keytar});
            const handlerParmsObj = getIHandlerParametersObject();
            const result = await (handler as any).deleteOldSecureProps("Zowe", "zosmf_test_user", handlerParmsObj);
            expect(result).toEqual(true);
            expect(findCredentialsSpy).toHaveBeenCalledWith("Zowe", "zosmf_test_user");
            expect(handlerParmsObj.response.console.error).toHaveBeenCalledTimes(0);
        });
        it("should not properly delete a credential and return failure", async() => {
            const findCredentialsSpy = jest.spyOn(keytar, "deletePassword").mockResolvedValue(false);

            const handler = new ConvertProfilesHandler();
            Object.defineProperty(handler, "keytar", {writable: false, value: keytar});
            const handlerParmsObj = getIHandlerParametersObject();
            const result = await (handler as any).deleteOldSecureProps("Zowe", "zosmf_test_user", handlerParmsObj);
            expect(result).toEqual(false);
            expect(findCredentialsSpy).toHaveBeenCalledWith("Zowe", "zosmf_test_user");
            expect(handlerParmsObj.response.console.error).toHaveBeenCalledTimes(0);
        });
        it("should error while deleting a credential and return failure", async() => {
            const findCredentialsSpy = jest.spyOn(keytar, "deletePassword").mockImplementation(() => {
                throw new Error("test error");
            });

            const handler = new ConvertProfilesHandler();
            Object.defineProperty(handler, "keytar", {writable: false, value: keytar});
            const handlerParmsObj = getIHandlerParametersObject();
            const result = await (handler as any).deleteOldSecureProps("Zowe", "zosmf_test_user", handlerParmsObj);
            expect(result).toEqual(false);
            expect(findCredentialsSpy).toHaveBeenCalledWith("Zowe", "zosmf_test_user");
            expect(handlerParmsObj.response.console.error).toHaveBeenCalledTimes(1);
            expect(stderr).toContain("Encountered an error while deleting secure data for service");
        });
    });

    it("getOldProfileCount should find multiple types of profiles", () => {
        jest.spyOn(ProfileIO, "getAllProfileDirectories").mockReturnValueOnce(["fruit", "nut"]);
        jest.spyOn(ProfileIO, "getAllProfileNames")
            .mockReturnValueOnce(["apple", "banana", "coconut"])
            .mockReturnValueOnce(["almond", "brazil", "cashew"]);

        const handler = new ConvertProfilesHandler();
        const result = (handler as any).getOldProfileCount(__dirname);
        expect(result).toBe(6);
    });

    it("removeOverride should reset CredentialManager override", () => {
        const mockSetOverride = jest.fn();
        jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
            set: mockSetOverride
        } as any);
        mockImperativeConfig.hostPackageName = "fake-cli";
        mockImperativeConfig.loadedConfig = {
            overrides: {
                CredentialManager: "ABC"
            }
        };

        const handler = new ConvertProfilesHandler();
        (handler as any).removeOverride("CredentialManager");
        expect(mockSetOverride).toHaveBeenCalledWith("overrides", "CredentialManager", "fake-cli");
        expect(mockImperativeConfig.loadedConfig.overrides.CredentialManager).toBeUndefined();
    });
});
