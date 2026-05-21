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
            layers: []
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
                        user: "$ZOWE_USER",
                        emptyStr: ""
                    },
                    secure: ["user", "password"]
                }
            },
            defaults: {
                base: "test-profile"
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

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[0][0];
        const result = JSON.parse(logCall);

        // Profile names should be redacted
        expect(Object.keys(result.profiles)[0]).toMatch(/<profile\d+>/);
        // Defaults should reference the same redacted profile name
        expect(result.defaults.base).toMatch(/<profile\d+>/);
    });

    it("should preserve secure field names when not hidden", async () => {
        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[0][0];
        const result = JSON.parse(logCall);

        const profileKey = Object.keys(result.profiles)[0];
        expect(result.profiles[profileKey].secure).toEqual(["user", "password"]);
    });

    it("should redact string values but preserve booleans", async () => {
        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[0][0];
        const result = JSON.parse(logCall);

        const profileKey = Object.keys(result.profiles)[0];
        const properties = result.profiles[profileKey].properties;

        // String should be redacted
        expect(properties.host).toMatch(/<host\d+>/);
        // Environment variable should preserve $ prefix before angle brackets
        expect(properties.user).toMatch(/^\$<user\d+>$/);
        // Empty string should not be redacted
        expect(properties.emptyStr).toBe("");
        // Number should be redacted
        expect(properties.port).toMatch(/<port\d+>/);
        // Boolean should not be redacted
        expect(properties.secure).toBe(true);
    });

    it("should redact schema path", async () => {
        await handler.process(mockParams);

        const logCall = (mockParams.response.console.log as jest.Mock).mock.calls[0][0];
        const result = JSON.parse(logCall);

        expect(result.$schema).toBe("<SCHEMA_PATH_REDACTED>");
    });

    it("should export config files to directory and log details", async () => {
        // Change dryRun to false
        mockParams.arguments.dryRun = false;
        mockParams.arguments.exportDir = path.join(process.cwd(), "mock");

        // Mock layers in ProfileInfo
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
                path: path.join(process.cwd(), "mock", "zowe.config.json")
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
        expect(mockParams.response.console.log).toHaveBeenCalledWith(
            `${path.join("mock", "zowe.config.json")} exported to ${path.join("mock", "project.zowe.config.json")}`
        );
        expect(mockParams.response.console.log).toHaveBeenCalledWith(
            `${path.join("mock", "zowe.config.json")} exported to ${path.join("mock", "global.zowe.config.json")}`
        );
    });
});