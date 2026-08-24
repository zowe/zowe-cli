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
import * as glob from "fast-glob";
import { ConfigUtils } from "../../config/src/ConfigUtils";
import { CredentialManagerFactory } from "../../security";
import { ImperativeConfig } from "../../utilities";
import { Logger } from "../../logger";
import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import { IExtendersJsonOpts } from "../src/doc/IExtenderOpts";

describe("Config Utils", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("hasUnsafeOrEmptyProperty", () => {
        it("should flag paths that contain a reserved property name", () => {
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("profiles.__proto__.properties.host")).toBe(true);
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("profiles.constructor.properties.host")).toBe(true);
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("profiles.prototype.properties.host")).toBe(true);
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("__proto__")).toBe(true);
        });

        it("should flag paths that contain an empty segment", () => {
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("")).toBe(true);
            expect(ConfigUtils.hasUnsafeOrEmptyProperty(".lpar1")).toBe(true);
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("lpar1.")).toBe(true);
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("lpar1..zosmf")).toBe(true);
        });

        it("should not flag normal config property paths", () => {
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("profiles.lpar1.properties.host")).toBe(false);
            // "profiles" as a profile name is legal and must not be flagged
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("profiles.profiles.properties.host")).toBe(false);
            expect(ConfigUtils.hasUnsafeOrEmptyProperty("defaults.zosmf")).toBe(false);
        });

        it("should expose the reserved property names", () => {
            expect([...ConfigUtils.UNSAFE_PROP_NAMES].sort()).toEqual(["__proto__", "constructor", "prototype"]);
        });
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

            const globSyncSpy = jest.spyOn(glob, "sync").mockReturnValueOnce([]);

            expect(ConfigUtils.onlyV1ProfilesExist).toBe(false);
            expect(globSyncSpy).toHaveBeenCalledTimes(1);
        });

        it("should return false when only V1 profile meta files exist", () => {
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

            const globSyncSpy = jest.spyOn(glob, "sync").mockReturnValueOnce(["profiles/zosmf/zosmf_meta.yaml"]);

            expect(ConfigUtils.onlyV1ProfilesExist).toBe(false);
            expect(globSyncSpy).toHaveBeenCalledTimes(1);
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

            const globSyncSpy = jest.spyOn(glob, "sync").mockReturnValueOnce(["profiles/zosmf/lpar1.yaml"]);

            expect(ConfigUtils.onlyV1ProfilesExist).toBe(true);
            expect(globSyncSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("formGlobOrProjProfileNm", () => {
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

    describe("hasTokenExpired", () => {
        it("returns false if an error occurred during parsing", async () => {
            const jsonParseSpy = jest.spyOn(JSON, "parse").mockImplementation(() => {
                throw new Error("Unknown error while parsing JSON");
            });
            expect(ConfigUtils.hasTokenExpired("HEADER.PAYLOAD.SIGNATURE")).toBe(false);
            expect(jsonParseSpy).toHaveBeenCalled();
        });

        it("returns true if a JWT token is present and has expired", async () => {
            const jsonParseSpy = jest.spyOn(JSON, "parse").mockReturnValue({
                exp: 1000000000,
            });
            expect(ConfigUtils.hasTokenExpired("HEADER.PAYLOAD.SIGNATURE")).toBe(true);
            expect(jsonParseSpy).toHaveBeenCalled();
        });

        it("returns false if a JWT payload can be parsed, but doesn't contain the exp property", async () => {
            const jsonParseSpy = jest.spyOn(JSON, "parse").mockReturnValue({
                iat: 1000000000,
            });
            expect(ConfigUtils.hasTokenExpired("HEADER.PAYLOAD.SIGNATURE")).toBe(false);
            expect(jsonParseSpy).toHaveBeenCalled();
        });

        it("returns false if a JWT token is present and has not expired", async () => {
            const jsonParseSpy = jest.spyOn(JSON, "parse").mockReturnValue({
                exp: 5000000000,
            });
            expect(ConfigUtils.hasTokenExpired("HEADER.PAYLOAD.SIGNATURE")).toBe(false);
            expect(jsonParseSpy).toHaveBeenCalled();
        });
    });

    describe("getConfigFileModeFromEnv", () => {
        const envVarName = "ZOWE" + EnvironmentalVariableSettings.CONFIG_FILE_MODE_SUFFIX;

        beforeEach(() => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                loadedConfig: { envVariablePrefix: "ZOWE" }
            } as any);
        });

        afterEach(() => {
            delete process.env[envVarName];
        });

        it("returns undefined when the variable is unset or blank", () => {
            expect(ConfigUtils.getConfigFileModeFromEnv()).toBeUndefined();
            process.env[envVarName] = "   ";
            expect(ConfigUtils.getConfigFileModeFromEnv()).toBeUndefined();
        });

        it("parses an octal value", () => {
            process.env[envVarName] = "0640";
            expect(ConfigUtils.getConfigFileModeFromEnv()).toBe(0o640);
            process.env[envVarName] = "600";
            expect(ConfigUtils.getConfigFileModeFromEnv()).toBe(0o600);
        });

        it("returns 0 so that callers can detect an explicit opt-out", () => {
            process.env[envVarName] = "0";
            expect(ConfigUtils.getConfigFileModeFromEnv()).toBe(0);
        });

        it("warns and returns undefined for a value that is not octal", () => {
            const warnSpy = jest.fn();
            jest.spyOn(Logger, "getConsoleLogger").mockReturnValue({ warn: warnSpy } as any);
            process.env[envVarName] = "rw-------";
            expect(ConfigUtils.getConfigFileModeFromEnv()).toBeUndefined();
            expect(warnSpy).toHaveBeenCalledTimes(1);
            expect(warnSpy.mock.calls[0][0]).toContain("ZOWE_CONFIG_FILE_MODE");
        });

        it("warns and returns undefined for a digit outside the octal range", () => {
            jest.spyOn(Logger, "getConsoleLogger").mockReturnValue({ warn: jest.fn() } as any);
            process.env[envVarName] = "0680";
            expect(ConfigUtils.getConfigFileModeFromEnv()).toBeUndefined();
        });

        it("warns and returns undefined for a mode above 0777", () => {
            jest.spyOn(Logger, "getConsoleLogger").mockReturnValue({ warn: jest.fn() } as any);
            process.env[envVarName] = "7777";
            expect(ConfigUtils.getConfigFileModeFromEnv()).toBeUndefined();
        });
    });

    describe("hasPlaintextSecret", () => {
        const schemaWithSecurePassword = {
            profiles: [{
                type: "zosmf",
                schema: { properties: { host: { secure: false }, password: { secure: true } } }
            }]
        };

        it("returns true when a schema-secure property is not in the secure array", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                loadedConfig: schemaWithSecurePassword
            } as any);
            expect(ConfigUtils.hasPlaintextSecret({
                profiles: { lpar1: { type: "zosmf", properties: { host: "example.com", password: "hunter2" } } }
            } as any)).toBe(true);
        });

        it("returns false when the secure array lists the property", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                loadedConfig: schemaWithSecurePassword
            } as any);
            expect(ConfigUtils.hasPlaintextSecret({
                profiles: { lpar1: { type: "zosmf", properties: { host: "example.com" }, secure: ["password"] } }
            } as any)).toBe(false);
        });

        it("finds a plain text credential in a nested profile", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                loadedConfig: schemaWithSecurePassword
            } as any);
            expect(ConfigUtils.hasPlaintextSecret({
                profiles: {
                    parent: {
                        properties: {},
                        profiles: { child: { type: "zosmf", properties: { password: "hunter2" } } }
                    }
                }
            } as any)).toBe(true);
        });

        it("falls back to a name list when no schema is available for the profile type", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({ loadedConfig: {} } as any);
            expect(ConfigUtils.hasPlaintextSecret({
                profiles: { lpar1: { type: "unknown", properties: { password: "hunter2" } } }
            } as any)).toBe(true);
            expect(ConfigUtils.hasPlaintextSecret({
                profiles: { lpar1: { type: "unknown", properties: { host: "example.com", port: 443 } } }
            } as any)).toBe(false);
        });

        it("returns false for an empty or absent profiles object", () => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({ loadedConfig: {} } as any);
            expect(ConfigUtils.hasPlaintextSecret({ profiles: {} } as any)).toBe(false);
            expect(ConfigUtils.hasPlaintextSecret({} as any)).toBe(false);
        });
    });
});
