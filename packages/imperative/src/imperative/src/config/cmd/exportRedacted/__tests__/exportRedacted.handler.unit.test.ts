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
import { ImperativeConfig } from "../../../../../../utilities/src/ImperativeConfig";
import ExportRedactedHandler from "../exportRedacted.handler";
import { ProfileInfo } from "../../../../../../config/src/ProfileInfo";

describe("ExportRedactedHandler", () => {
    let handler: ExportRedactedHandler;
    let mockParams: any;
    let mockProfileInfo: ProfileInfo;

    beforeEach(() => {
        handler = new ExportRedactedHandler();
        mockParams = {
            arguments: {
                includeProfiles: true,
                includeDefaults: true,
                redactStrings: true,
                redactNumbers: true,
                redactBooleans: false,
                hideSecureFields: false,
                redactProfileNames: true
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
                        secure: true
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
});