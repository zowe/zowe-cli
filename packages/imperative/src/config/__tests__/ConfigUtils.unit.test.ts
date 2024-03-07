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

import { ConfigUtils } from "../../config/src/ConfigUtils";
import { CredentialManagerFactory } from "../../security";
import { ImperativeConfig } from "../../utilities";

describe("Config Utils", () => {
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
});
