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
import { ICommandHandler, IHandlerParameters, ImperativeConfig, ImperativeError } from "../../../../..";
import { ProfileInfo } from "../../../../../config";

export default class ExportRedactedHandler implements ICommandHandler {
    private keyCounters: Map<string, number> = new Map();
    private valueToKeyMap: Map<string, string> = new Map();

    public async process(params: IHandlerParameters): Promise<void> {
        try {
            const config = ImperativeConfig.instance.config;

            if (!config.exists) {
                throw new ImperativeError({
                    msg: "No Zowe configuration found. Please initialize a configuration first using 'zowe config init'."
                });
            }

            const exportDir = params.arguments.exportDir || process.cwd();
            const isDryRun = params.arguments.dryRun;

            if (isDryRun) {
                const layers = ImperativeConfig.instance.config.layers;
                const dryRunOutputs: any = {};
                let hasOutput = false;

                for (const layer of layers) {
                    if (layer.exists) {
                        const redactedConfig = await this.createRedactedConfig(layer, params.arguments);
                        const sourceName = path.join(path.basename(path.dirname(layer.path)), path.basename(layer.path));
                        const formattedOutput = JSON.stringify(redactedConfig, null, 2);

                        if (hasOutput) {
                            params.response.console.log("\n" + "=".repeat(80) + "\n");
                        }
                        params.response.console.log(`--- ${sourceName} ---`);
                        params.response.console.log(formattedOutput);
                        dryRunOutputs[sourceName] = redactedConfig;
                        hasOutput = true;
                    }
                }
                params.response.data.setObj(dryRunOutputs);
            } else {
                const exportedFiles = await this.exportToDirectory(exportDir, params.arguments);
                const maxSourceLength = Math.max(...exportedFiles.map(file => file.source.length));
                for (const file of exportedFiles) {
                    const relativeTarget = path.relative(process.cwd(), file.target);
                    const paddedSource = file.source.padEnd(maxSourceLength);
                    params.response.console.log(`${paddedSource} exported to ${relativeTarget}`);
                }
            }

        } catch (error) {
            throw new ImperativeError({
                msg: `Failed to export configuration: ${error.message}`,
                causeErrors: error
            });
        }
    }

    private exportToDirectory(exportDir: string, args: any): Array<{ source: string, target: string }> {
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const layers = ImperativeConfig.instance.config.layers;
        const exportedFiles: Array<{ source: string, target: string }> = [];

        for (const layer of layers) {
            if (layer.exists) {
                const redactedConfig = this.createRedactedConfig(layer, args);
                
                let filename: string;
                if (layer.global && layer.user) {
                    filename = "global.zowe.config.user.json";
                } else if (layer.global && !layer.user) {
                    filename = "global.zowe.config.json";
                } else if (!layer.global && layer.user) {
                    filename = "project.zowe.config.user.json";
                } else {
                    filename = "project.zowe.config.json";
                }
                
                const filePath = path.join(exportDir, filename);
                const formattedOutput = JSON.stringify(redactedConfig, null, 2);
                this.writeToFile(formattedOutput, filePath);

                exportedFiles.push({
                    source: path.join(path.basename(path.dirname(layer.path)), path.basename(layer.path)),
                    target: filePath
                });
            }
        }

        return exportedFiles;
    }

    private createRedactedConfig(layer: any, args: any): unknown {
        const activeLayer = layer;

        // Read the raw JSON file directly to avoid any ProfileInfo processing/merging
        let originalConfig: any;
        try {
            const rawContent = fs.readFileSync(activeLayer.path, 'utf8');
            // Strip JSON comments before parsing since config files may contain them
            const cleanedContent = this.stripJsonComments(rawContent);
            originalConfig = JSON.parse(cleanedContent);
        } catch (error) {
            throw new ImperativeError({
                msg: `Failed to read config file '${activeLayer.path}': ${error.message}`,
                causeErrors: error
            });
        }

        const redacted: any = {};

        for (const [rawKey, value] of Object.entries(originalConfig)) {
            const key = rawKey.toLowerCase();
            if (key === "profiles") {
                redacted.profiles = {};

                for (const [profileName, profileData] of Object.entries(value as any)) {
                    const redactedProfileName = args.redactProfileNames ?
                        this.getOrCreateKey(profileName, "profile") : profileName;
                    redacted.profiles[redactedProfileName] = this.redactProfileObject(profileData, args);
                }
            } else if (key === "defaults") {
                if (args.redactProfileNames && value && typeof value === "object" && !Array.isArray(value)) {
                    const redactedDefaults: any = {};
                    for (const [defaultKey, defaultValue] of Object.entries(value as any)) {
                        if (typeof defaultValue === "string" && defaultValue !== "") {
                            if (defaultValue.includes(".")) {
                                redactedDefaults[defaultKey] = defaultValue
                                    .split(".")
                                    .map(part => this.getOrCreateKey(part, "profile"))
                                    .join(".");
                            } else {
                                redactedDefaults[defaultKey] = this.getOrCreateKey(defaultValue, "profile");
                            }
                        } else {
                            redactedDefaults[defaultKey] = defaultValue;
                        }
                    }
                    redacted.defaults = redactedDefaults;
                } else {
                    redacted.defaults = value;
                }
            } else {
                if (key === "$schema") {
                    redacted[rawKey] = "<SCHEMA_PATH_REDACTED>";
                } else {
                    redacted[rawKey] = this.redactObject(value, args);
                }
            }
        }
        return redacted;
    }

    private redactProfileObject(profile: any, args: any): any {
        const redactedProfile: any = {};

        if (profile.type) {
            redactedProfile.type = profile.type;
        }

        if (profile.properties) {
            redactedProfile.properties = {};
            for (const [propName, propValue] of Object.entries(profile.properties)) {
                redactedProfile.properties[propName] = this.redactValue(
                    propName,
                    propValue,
                    args
                );
            }
        }

        if (profile.profiles) {
            redactedProfile.profiles = {};
            for (const [nestedProfileName, nestedProfileData] of Object.entries(profile.profiles)) {
                const redactedNestedName = args.redactProfileNames ?
                    this.getOrCreateKey(nestedProfileName, "profile") : nestedProfileName;
                redactedProfile.profiles[redactedNestedName] = this.redactProfileObject(nestedProfileData, args);
            }
        }

        if (profile.secure && !args.hideSecureFields) {
            redactedProfile.secure = profile.secure;
        }

        return redactedProfile;
    }

    private redactValue(propertyName: string, value: any, args: any): any {
        const valueType = typeof value;

        switch (valueType) {
            case "string":
                if (args.redactStrings && value !== "") {
                    return this.getOrCreateKey(value, propertyName);
                }
                return value;

            case "number":
                if (args.redactNumbers) {
                    return this.getOrCreateKey(value, propertyName);
                }
                return value;

            case "boolean":
                if (args.redactBooleans) {
                    return this.getOrCreateKey(value, propertyName);
                }
                return value;

            case "object":
                if (value === null) return null;
                if (Array.isArray(value)) {
                    return value.map(item => this.redactValue(propertyName, item, args));
                }
                return this.redactObject(value, args);

            default:
                return value;
        }
    }

    private redactObject(obj: any, args: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.redactObject(item, args));
        }

        if (typeof obj === "object") {
            const redacted: any = {};
            for (const [key, value] of Object.entries(obj)) {
                redacted[key] = this.redactValue(key, value, args);
            }
            return redacted;
        }

        return obj;
    }

    private getOrCreateKey(value: any, propertyName: string): string {
        const valueStr = String(value);

        if (this.valueToKeyMap.has(valueStr)) {
            return this.valueToKeyMap.get(valueStr)!;
        }

        const keyPrefix = this.getKeyPrefix(propertyName, value);
        const nextCount = (this.keyCounters.get(keyPrefix) ?? 0) + 1;
        this.keyCounters.set(keyPrefix, nextCount);

        let key = `<${keyPrefix}${nextCount}>`;
        if (valueStr.startsWith("$")) {
            key = "$" + key;
        }

        this.valueToKeyMap.set(valueStr, key);

        return key;
    }

    private getKeyPrefix(propertyName: string, value: any): string {
        const lowerName = propertyName.toLowerCase();
        const valueType = typeof value;

        const namePrefixes = ["host", "port", "path", "user", "base", "profile"];
        const matchedPrefix = namePrefixes.find(prefix => lowerName.includes(prefix));
        if (matchedPrefix) {
            return matchedPrefix;
        }

        const typePrefixes: Record<string, string> = {
            boolean: "bool",
            number: "num",
            string: "str"
        };

        return typePrefixes[valueType] || "value";
    }

    private stripJsonComments(content: string): string {
        return content.replace(/("([^"\\]|\\.)*")|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (match, g1) => {
            if (g1) return g1;
            return "";
        });
    }

    private writeToFile(content: string, filePath: string): void {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, content, 'utf8');
        } catch (error) {
            throw new ImperativeError({
                msg: `Failed to write to file '${filePath}': ${error.message}`,
                causeErrors: error
            });
        }
    }
}