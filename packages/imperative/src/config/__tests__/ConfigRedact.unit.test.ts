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
import { ConfigRedact } from "../src/api/ConfigRedact";

describe("ConfigRedact", () => {
    let mockConfig: any;
    let redact: ConfigRedact;

    beforeEach(() => {
        mockConfig = {
            layers: [
                {
                    exists: true,
                    global: false,
                    user: false,
                    path: "/mock/zowe.config.json"
                }
            ]
        };
        redact = new ConfigRedact(mockConfig);

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

    it("returns one redacted result per existing layer without writing to disk", () => {
        const writeSpy = jest.spyOn(fs, "writeFileSync");
        const results = redact.getRedactedLayers();

        expect(results).toHaveLength(1);
        expect(results[0].source).toBe(path.join("mock", "zowe.config.json"));
        expect(results[0].target).toBeUndefined();
        expect(writeSpy).not.toHaveBeenCalled();
    });

    it("applies default redaction options matching the CLI command defaults", () => {
        const [{ redactedConfig }] = redact.getRedactedLayers();
        const profileKey = Object.keys(redactedConfig.profiles)[0];
        const properties = redactedConfig.profiles[profileKey].properties;

        // redactProfileNames defaults to true
        expect(profileKey).toMatch(/<profile\d+>/);
        expect(redactedConfig.defaults.base).toBe(profileKey);
        // redactStrings defaults to true
        expect(properties.host).toMatch(/<host\d+>/);
        // redactBooleans defaults to false
        expect(properties.secure).toBe(true);
        // hideSecureFields defaults to false
        expect(redactedConfig.profiles[profileKey].secure).toEqual(["user", "password"]);
        // $schema is always redacted
        expect(redactedConfig.$schema).toBe("<SCHEMA_PATH_REDACTED>");
    });

    it("keeps redaction keys consistent for the same value across layers", () => {
        mockConfig.layers.push({
            exists: true,
            global: true,
            user: false,
            path: "/mock/global.zowe.config.json"
        });

        const results = redact.getRedactedLayers();
        const firstHost = results[0].redactedConfig.profiles[Object.keys(results[0].redactedConfig.profiles)[0]].properties.host;
        const secondHost = results[1].redactedConfig.profiles[Object.keys(results[1].redactedConfig.profiles)[0]].properties.host;

        expect(firstHost).toBe(secondHost);
    });

    it("resets redaction keys between separate calls", () => {
        const first = redact.getRedactedLayers().at(0)!;
        const firstProfileKey = Object.keys(first.redactedConfig.profiles)[0];

        const second = redact.getRedactedLayers().at(0)!;
        const secondProfileKey = Object.keys(second.redactedConfig.profiles)[0];

        expect(firstProfileKey).toBe(secondProfileKey);
    });

    it("honors showHostPath to bypass string redaction for host and basePath", () => {
        const [{ redactedConfig }] = redact.getRedactedLayers({ showHostPath: true });
        const profileKey = Object.keys(redactedConfig.profiles)[0];

        expect(redactedConfig.profiles[profileKey].properties.host).toBe("example.com");
    });

    it("hides secure field names when hideSecureFields is true", () => {
        const [{ redactedConfig }] = redact.getRedactedLayers({ hideSecureFields: true });
        const profileKey = Object.keys(redactedConfig.profiles)[0];

        expect(redactedConfig.profiles[profileKey].secure).toBeUndefined();
    });

    it("exports redacted config files to the given directory", () => {
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const writeSpy = jest.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

        const exportDir = path.join(process.cwd(), "mock-export");
        const results = redact.exportToDirectory(exportDir);

        expect(results).toHaveLength(1);
        expect(results[0].target).toBe(path.join(exportDir, "project.zowe.config.json"));
        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(
            path.join(exportDir, "project.zowe.config.json"),
            expect.any(String),
            "utf8"
        );
    });
});
