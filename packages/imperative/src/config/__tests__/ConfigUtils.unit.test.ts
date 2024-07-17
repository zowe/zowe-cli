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
import * as path from "path";
import * as os from "os";
import * as jsonfile from "jsonfile";
import { ConfigUtils } from "../../config/src/ConfigUtils";
import { CredentialManagerFactory } from "../../security";
import { ImperativeConfig } from "../../utilities";
import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import { IExtendersJsonOpts } from "../src/doc/IExtenderOpts";

describe("Config Utils", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("coercePropValue", () => {
        it("should parse value when type is boolean", () => {
            expect(ConfigUtils.coercePropValue("false", "boolean")).toBe(false);
            expect(ConfigUtils.coercePropValue("true", "boolean")).toBe(true);
        });

        it("should parse value when type is number", () => {
            expect(ConfigUtils.coercePropValue("2", "number")).toBe(2);
            expect(ConfigUtils.coercePropValue("3.14", "number")).toBe(3.14);
        });

        it("should parse value when type is unknown", () => {
            expect(ConfigUtils.coercePropValue("false")).toBe(false);
            expect(ConfigUtils.coercePropValue("2")).toBe(2);
            expect(ConfigUtils.coercePropValue("abc")).toBe("abc");
        });

        it("should not parse value when type is string", () => {
            expect(ConfigUtils.coercePropValue("false", "string")).toBe("false");
            expect(ConfigUtils.coercePropValue("2", "string")).toBe("2");
            expect(ConfigUtils.coercePropValue("abc", "string")).toBe("abc");
        });
    });

    describe("getActiveProfileName", () => {
        it("should get name from command arguments", () => {
            const profileName = ConfigUtils.getActiveProfileName("fruit", {
                "fruit-profile": "apple"
            } as any, "coconut");
            expect(profileName).toBe("apple");
        });

        it("should get name from default profiles", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValueOnce({
                config: {
                    properties: {
                        profiles: {},
                        defaults: {
                            fruit: "banana"
                        }
                    }
                }
            } as any);
            const profileName = ConfigUtils.getActiveProfileName("fruit", {} as any, "coconut");
            expect(profileName).toBe("banana");
        });

        it("should fall back to default name if provided", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValueOnce({
                config: {
                    properties: {
                        profiles: {},
                        defaults: {}
                    }
                }
            } as any);
            const profileName = ConfigUtils.getActiveProfileName("fruit", {} as any, "coconut");
            expect(profileName).toBe("coconut");
        });

        it("should fall back to profile type", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValueOnce({} as any);
            const profileName = ConfigUtils.getActiveProfileName("fruit", {} as any);
            expect(profileName).toBe("fruit");
        });
    });

    describe("secureSaveError", () => {
        it("should create error object with details populated", () => {
            jest.spyOn(CredentialManagerFactory, "manager", "get").mockReturnValueOnce({
                secureErrorDetails: jest.fn()
            } as any);
            const solution = "Fix the problem";
            const error = ConfigUtils.secureSaveError(solution);
            expect(error.message).toBe("Unable to securely save credentials.");
            expect(error.additionalDetails).toBe(solution);
        });
    });

    describe("onlyV1ProfilesExist", () => {
        afterEach(() => {
            jest.restoreAllMocks(); // restore spies
            jest.clearAllMocks();   // set counts back to zero
        });

        it("should return false when a team config exists", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValueOnce({
                config: {
                    exists: true
                }
            } as any);

            expect(ConfigUtils.onlyV1ProfilesExist).toBe(false);
        });

        it("should return false when neither team config or v1 profiles exist", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                config: {
                    exists: false
                },
                cliHome: "/fake/cli/home/dir",
                loadedConfig: jest.fn(() => {
                    return {
                        envVariablePrefix: "Fake_cli_prefix"
                    };
                })
            } as any);

            const fsExistsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);

            expect(ConfigUtils.onlyV1ProfilesExist).toBe(false);
            expect(fsExistsSyncSpy).toHaveBeenCalledTimes(1);
        });

        it("should return true when only V1 profiles exist", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                config: {
                    exists: false
                },
                cliHome: "/fake/cli/home/dir",
                loadedConfig: jest.fn(() => {
                    return {
                        envVariablePrefix: "Fake_cli_prefix"
                    };
                })
            } as any);

            const fsExistsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

            expect(ConfigUtils.onlyV1ProfilesExist).toBe(true);
            expect(fsExistsSyncSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("formGlobOrProjProfileNm", () => {
        afterEach(() => {
            /* zzz
            jest.restoreAllMocks(); // restore spies
            jest.clearAllMocks();   // set counts back to zero
            */
        });

        it("should return the type name if the type is not base", () => {
            const baseProfileName = ConfigUtils.formGlobOrProjProfileNm("zosmf", false);
            expect(baseProfileName).toEqual("zosmf");
        });

        it("should return a project base profile name when asked", () => {
            const baseProfileName = ConfigUtils.formGlobOrProjProfileNm("base", false);
            expect(baseProfileName).toEqual("project_base");
        });

        it("should return a global base profile name when asked", () => {
            const baseProfileName = ConfigUtils.formGlobOrProjProfileNm("base", true);
            expect(baseProfileName).toEqual("global_base");
        });

        it("should return a global base profile name when no project layer exists", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                config: {
                    exists: true,
                    layers: [
                        {
                            path: "fakePath",
                            exists: true,
                            properties: {},
                            global: true,
                            user: false
                        }
                    ]
                }
            } as any);

            const baseProfileName = ConfigUtils.formGlobOrProjProfileNm("base");
            expect(baseProfileName).toEqual("global_base");
        });

        it("should return a global base profile name when no base type in nested profiles", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                config: {
                    exists: true,
                    layers: [
                        {
                            path: "fakePath",
                            exists: true,
                            properties: {},
                            global: false,
                            user: false
                        }
                    ],
                    layerProfiles: jest.fn(() => {
                        return {
                            properties: {}
                        };
                    })
                }
            } as any);

            const baseProfileName = ConfigUtils.formGlobOrProjProfileNm("base");
            expect(baseProfileName).toEqual("global_base");
        });

        it("should return a project base profile name when found in nested profiles", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                config: {
                    exists: true,
                    layers: [
                        {
                            path: "fakePath",
                            exists: true,
                            properties: {},
                            global: false,
                            user: false
                        }
                    ],
                    layerProfiles: jest.fn(() => {
                        return {
                            properties: {
                                profiles: {
                                    profiles: {
                                        properties: {},
                                        type: "base"
                                    }
                                }
                            }
                        };
                    })
                }
            } as any);

            const baseProfileName = ConfigUtils.formGlobOrProjProfileNm("base");
            expect(baseProfileName).toEqual("project_base");
        });
    });

    describe("getZoweDir", () => {
        const expectedLoadedConfig = {
            name: "zowe",
            defaultHome: path.join("z", "zowe"),
            envVariablePrefix: "ZOWE"
        };
        let defaultHome: string;
        let envReadSpy: any;
        let homeDirSpy: any;
        let loadedConfigOrig: any;

        beforeAll(() => {
            loadedConfigOrig = ImperativeConfig.instance.loadedConfig;
        });

        beforeEach(() => {
            envReadSpy = jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValue({
                cliHome: { value: null }
            } as any);
            homeDirSpy = jest.spyOn(os, "homedir").mockReturnValue(expectedLoadedConfig.defaultHome);
            ImperativeConfig.instance.loadedConfig = undefined as any;
            defaultHome = path.join(expectedLoadedConfig.defaultHome, ".zowe");
        });

        afterAll(() => {
            ImperativeConfig.instance.loadedConfig = loadedConfigOrig;
            envReadSpy.mockRestore();
            homeDirSpy.mockRestore();
        });

        it("should return the ENV cliHome even if loadedConfig is set in the process", () => {
            jest.spyOn(EnvironmentalVariableSettings, "read").mockReturnValue({ cliHome: { value: "test" } } as any);
            expect(ImperativeConfig.instance.loadedConfig).toBeUndefined();
            expect(ConfigUtils.getZoweDir()).toEqual("test");
            expect(ImperativeConfig.instance.loadedConfig).toEqual({ ...expectedLoadedConfig, defaultHome });
        });

        it("should return the defaultHome and set loadedConfig if undefined", () => {
            expect(ImperativeConfig.instance.loadedConfig).toBeUndefined();
            expect(ConfigUtils.getZoweDir()).toEqual(defaultHome);
            expect(ImperativeConfig.instance.loadedConfig).toEqual({ ...expectedLoadedConfig, defaultHome });
        });

        it("should return the defaultHome and reset loadedConfig if defaultHome changes", () => {
            expect(ImperativeConfig.instance.loadedConfig).toBeUndefined();
            ImperativeConfig.instance.loadedConfig = { ...expectedLoadedConfig, defaultHome: "test" };
            expect(ImperativeConfig.instance.loadedConfig?.defaultHome).toEqual("test");
            expect(ConfigUtils.getZoweDir()).toEqual(defaultHome);
            expect(ImperativeConfig.instance.loadedConfig).toEqual({ ...expectedLoadedConfig, defaultHome });
        });

        it("should return the defaultHome without resetting loadedConfig", () => {
            expect(ImperativeConfig.instance.loadedConfig).toBeUndefined();
            ImperativeConfig.instance.loadedConfig = expectedLoadedConfig;
            expect(ConfigUtils.getZoweDir()).toEqual(defaultHome);
            expect(ImperativeConfig.instance.loadedConfig).toEqual({ ...expectedLoadedConfig, defaultHome });
        });
    });

    const dummyExtJson: IExtendersJsonOpts = {
        profileTypes: {
            "test": {
                from: ["Zowe Client App"]
            }
        }
    };
    describe("readExtendersJsonFromDisk", () => {
        // case 1: the JSON file doesn't exist at time of read
        it("writes an empty extenders.json file if it doesn't exist on disk", async () => {
            const writeFileSyncMock = jest.spyOn(jsonfile, "writeFileSync").mockImplementation();
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
            ConfigUtils.readExtendersJson();
            expect(writeFileSyncMock).toHaveBeenCalled();
        });

        // case 2: JSON file exists on-disk at time of read
        it("reads extenders.json from disk if it exists", async () => {
            const readFileSyncMock = jest.spyOn(jsonfile, "readFileSync").mockReturnValueOnce(dummyExtJson);
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const result = ConfigUtils.readExtendersJson();
            expect(readFileSyncMock).toHaveBeenCalled();
            expect(result).toEqual({
                profileTypes: {
                    "test": {
                        from: ["Zowe Client App"]
                    }
                }
            });
        });
    });

    describe("writeExtendersJson", () => {
        // case 1: Write operation is successful
        it("returns true if written to disk successfully", async () => {
            const writeFileSyncMock = jest.spyOn(jsonfile, "writeFileSync").mockImplementation();
            expect(ConfigUtils.writeExtendersJson(dummyExtJson)).toBe(true);
            expect(writeFileSyncMock).toHaveBeenCalled();
        });

        // case 2: Write operation is unsuccessful
        it("returns false if it couldn't write to disk", async () => {
            const writeFileSyncMock = jest.spyOn(jsonfile, "writeFileSync").mockImplementation();
            writeFileSyncMock.mockImplementation(() => { throw new Error(); });
            expect(ConfigUtils.writeExtendersJson(dummyExtJson)).toBe(false);
            expect(writeFileSyncMock).toHaveBeenCalled();
        });
    });
});
