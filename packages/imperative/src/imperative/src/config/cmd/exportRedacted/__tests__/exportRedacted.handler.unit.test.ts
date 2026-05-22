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
import { ImperativeConfig } from "../../../../../../";
import ExportRedactedHandler from "../exportRedacted.handler";
import { ProfileInfo, ConfigUtils } from "../../../../../../config";

describe("ExportRedactedHandler", () => {
    let handler: ExportRedactedHandler;
    let mockParams: any;
    let mockProfileInfo: ProfileInfo;

    beforeEach(() => {
        handler = new ExportRedactedHandler();
        mockParams = {
            arguments: {
                redactStrings: true,
                redactNumbers: true,
                redactBooleans: false,
                hideSecureFields: false,
                redactProfileNames: true,
                dryRun: true
            },
            response: {
                console: {
                    log: jest.fn()
                },
                data: {
                    setObj: jest.fn()
                }
            }
        } as any;

        mockProfileInfo = {
            readProfilesFromDisk: jest.fn().mockResolvedValue(undefined),
            getTeamConfig: jest.fn().mockReturnValue({
                layerActive: jest.fn().mockReturnValue({
                    path: "/mock/config.json"
                }),
                layers: []
            })
        } as any;

        // Mock ImperativeConfig
        jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
            config: {
                exists: true
            }
        } as any);

        // Mock ConfigUtils.initImpUtils
        jest.spyOn(ConfigUtils, "initImpUtils").mockReturnValue({
            log: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        } as any);

        // Mock ProfileInfo constructor
        jest.spyOn(ProfileInfo.prototype, "readProfilesFromDisk").mockResolvedValue(undefined);
        jest.spyOn(ProfileInfo.prototype, "getTeamConfig").mockReturnValue({
            layerActive: jest.fn().mockReturnValue({
                path: "/mock/config.json"
            }),
            layers: [
                {
                    exists: true,
                    global: false,
                    user: false,
                    path: "/mock/config.json"
                }
            ]
        } as any);

        // Mock fs.readFileSync
        jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
            $schema: "https://example.com/schema.json",
            profiles: {
                "test-profile": {
                    type: "base",
                    properties: {
                        host: "example.com",
                        port: 443,
                        secure: true,
                        connectionTimeout: 10000,
                        user: "$ZOWE_USER",
                        emptyStr: "",
                        arrayOfStrings: ["string1", "string2"],
                        nestedObject: {
                            key1: "value1",
                            nestedNum: 20000
                        }
                    },
                    profiles: {
                        "nested-profile": {
                            type: "zosmf",
                            properties: {
                                encoding: "IBM-1047"
                            }
                        }
                    },
                    secure: ["user", "password"]
                }
            },
            defaults: {
                base: "test-profile",
                zosmf: "test-profile.nested-profile"
            }
        }));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should perform dry run and output to console", async () => {
        await handler.process(mockParams);

        expect(mockParams.response.console.log).toHaveBeenCalled();
        expect(mockParams.response.data.setObj).toHaveBeenCalled();
    });

    it("should redact profile names consistently", async () => {
        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[1][0];
        const result = JSON.parse(logCall);

        const topProfileKey = Object.keys(result.profiles)[0];
        const nestedProfileKey = Object.keys(result.profiles[topProfileKey].profiles)[0];

        // Profile names should be redacted
        expect(topProfileKey).toMatch(/<profile\d+>/);
        expect(nestedProfileKey).toMatch(/<profile\d+>/);

        // Defaults should reference the same redacted profile name
        expect(result.defaults.base).toBe(topProfileKey);
        // Nested defaults should be dot-separated and match top profile key + nested profile key
        expect(result.defaults.zosmf).toBe(`${topProfileKey}.${nestedProfileKey}`);
    });

    it("should redact profile names in defaults section even if redactStrings is false", async () => {
        mockParams.arguments.redactStrings = false;
        mockParams.arguments.redactProfileNames = true;

        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[1][0];
        const result = JSON.parse(logCall);

        const topProfileKey = Object.keys(result.profiles)[0];
        const nestedProfileKey = Object.keys(result.profiles[topProfileKey].profiles)[0];

        expect(topProfileKey).toMatch(/<profile\d+>/);
        expect(result.defaults.base).toBe(topProfileKey);
        expect(result.defaults.zosmf).toBe(`${topProfileKey}.${nestedProfileKey}`);
    });

    it("should not redact profile names in defaults section if redactProfileNames is false", async () => {
        mockParams.arguments.redactStrings = false;
        mockParams.arguments.redactProfileNames = false;

        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[1][0];
        const result = JSON.parse(logCall);

        expect(Object.keys(result.profiles)[0]).toBe("test-profile");
        expect(result.defaults.base).toBe("test-profile");
        expect(result.defaults.zosmf).toBe("test-profile.nested-profile");
    });

    it("should preserve secure field names when not hidden", async () => {
        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[1][0];
        const result = JSON.parse(logCall);

        const profileKey = Object.keys(result.profiles)[0];
        expect(result.profiles[profileKey].secure).toEqual(["user", "password"]);
    });

    it("should redact string values but preserve booleans", async () => {
        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[1][0];
        const result = JSON.parse(logCall);

        const profileKey = Object.keys(result.profiles)[0];
        const properties = result.profiles[profileKey].properties;

        // String should be redacted
        expect(properties.host).toMatch(/<host\d+>/);
        // Environment variable should preserve $ prefix before angle brackets
        expect(properties.user).toMatch(/^\$<user\d+>$/);
        // Empty string should not be redacted
        expect(properties.emptyStr).toBe("");
        // Number should be redacted with specialized prefix "port"
        expect(properties.port).toMatch(/<port\d+>/);
        // Number connectionTimeout should be redacted with prefix "num" (and NOT fall back to "str")
        expect(properties.connectionTimeout).toMatch(/<num\d+>/);
        // Boolean should not be redacted
        expect(properties.secure).toBe(true);
    });

    it("should redact booleans with prefix bool if redactBooleans is true", async () => {
        mockParams.arguments.redactBooleans = true;

        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[1][0];
        const result = JSON.parse(logCall);

        const profileKey = Object.keys(result.profiles)[0];
        const properties = result.profiles[profileKey].properties;

        // Boolean secure should be redacted with prefix "bool"
        expect(properties.secure).toMatch(/<bool\d+>/);
    });

    it("should redact array and nested object type properties", async () => {
        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[1][0];
        const result = JSON.parse(logCall);

        const profileKey = Object.keys(result.profiles)[0];
        const properties = result.profiles[profileKey].properties;

        // Array elements should be mapped and redacted
        expect(properties.arrayOfStrings).toBeInstanceOf(Array);
        expect(properties.arrayOfStrings[0]).toMatch(/<str\d+>/);
        expect(properties.arrayOfStrings[1]).toMatch(/<str\d+>/);

        // Nested object elements should be mapped and redacted recursively
        expect(properties.nestedObject).toBeInstanceOf(Object);
        expect(properties.nestedObject.key1).toMatch(/<str\d+>/);
        expect(properties.nestedObject.nestedNum).toMatch(/<num\d+>/);
    });

    it("should redact schema path", async () => {
        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[1][0];
        const result = JSON.parse(logCall);

        expect(result.$schema).toBe("<SCHEMA_PATH_REDACTED>");
    });

    it("should export config files to directory and log details", async () => {
        // Change dryRun to false
        mockParams.arguments.dryRun = false;
        mockParams.arguments.exportDir = path.join(process.cwd(), "mock");

        // Mock layers in ProfileInfo with different source path lengths
        const layers = [
            {
                exists: true,
                global: false,
                user: false,
                path: path.join(process.cwd(), "mock", "zowe.config.json")
            },
            {
                exists: true,
                global: true,
                user: false,
                path: path.join(process.cwd(), "longer-mock-path", "zowe.config.json")
            }
        ];

        jest.spyOn(ProfileInfo.prototype, "getTeamConfig").mockReturnValue({
            layerActive: jest.fn().mockReturnValue({
                path: path.join(process.cwd(), "mock", "zowe.config.json")
            }),
            layers
        } as any);

        // Mock fs.existsSync & fs.writeFileSync
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const writeSpy = jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});

        await handler.process(mockParams);

        expect(writeSpy).toHaveBeenCalledTimes(2);
        
        // Sources: "mock/zowe.config.json" (21 chars) and "longer-mock-path/zowe.config.json" (32 chars)
        // Source 1 should be padded to 33 chars: "mock/zowe.config.json            "
        // Source 2 should be padded to 33 chars: "longer-mock-path/zowe.config.json"
        expect(mockParams.response.console.log).toHaveBeenCalledWith(
            `${path.join("mock", "zowe.config.json").padEnd(33)} exported to ${path.join("mock", "project.zowe.config.json")}`
        );
        expect(mockParams.response.console.log).toHaveBeenCalledWith(
            `${path.join("longer-mock-path", "zowe.config.json").padEnd(33)} exported to ${path.join("mock", "global.zowe.config.json")}`
        );
    });
});