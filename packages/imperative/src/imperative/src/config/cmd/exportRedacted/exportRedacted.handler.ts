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
    private keyCounter = 1;
    private valueToKeyMap: Map<string, string> = new Map();
    private profileInfo: ProfileInfo;

    public async process(params: IHandlerParameters): Promise<void> {
        try {
            const config = ImperativeConfig.instance.config;

            if (!config.exists) {
                throw new ImperativeError({
                    msg: "No Zowe configuration found. Please initialize a configuration first using 'zowe config init'."
                });
            }

            this.profileInfo = new ProfileInfo("zowe");
            await this.profileInfo.readProfilesFromDisk();

            const exportDir = params.arguments.exportDir || process.cwd();
            const isDryRun = params.arguments.dryRun;

            if (isDryRun) {
                // Dry run - output to console
                const redactedConfig = await this.createRedactedConfig(null, params.arguments);
                const formattedOutput = JSON.stringify(redactedConfig, null, 2);
                params.response.console.log(formattedOutput);
                params.response.data.setObj(redactedConfig);
            } else {
                // Export to directory
                await this.exportToDirectory(exportDir, params.arguments);
                params.response.console.log(`Configuration exported to: ${exportDir}`);
            }

        } catch (error) {
            throw new ImperativeError({
                msg: `Failed to export configuration: ${error.message}`,
                causeErrors: error
            });
        }
    }

    private async exportToDirectory(exportDir: string, args: any): Promise<void> {
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const teamConfig = this.profileInfo.getTeamConfig();
        const MAX_LAYERS = 4;
        const layers = teamConfig.layers.slice(0, MAX_LAYERS); // Up to 4 layers: global, project, user, env

        for (const layer of layers) {
            if (layer.exists) {
                const redactedConfig = await this.createRedactedConfig(layer, args);
                
                // Generate proper Zowe config file names with location prefix
                let filename: string;
                if (layer.global && layer.user) {
                    // Global user layer
                    filename = "global.zowe.config.user.json";
                } else if (layer.global && !layer.user) {
                    // Global system layer  
                    filename = "global.zowe.config.json";
                } else if (!layer.global && layer.user) {
                    // Project user layer
                    filename = "project.zowe.config.user.json";
                } else {
                    // Project layer (neither global nor user)
                    filename = "project.zowe.config.json";
                }
                
                const filePath = path.join(exportDir, filename);
                const formattedOutput = JSON.stringify(redactedConfig, null, 2);
                await this.writeToFile(formattedOutput, filePath);
            }
        }
    }

    private async createRedactedConfig(layer: any, args: any): Promise<any> {
        const teamConfig = this.profileInfo.getTeamConfig();
        const activeLayer = layer || teamConfig.layerActive();

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

        // Start with the original structure and redact values
        // Process properties in the same order as the original config
        const redacted: any = {};

        // Process all properties in their original order
        for (const [key, value] of Object.entries(originalConfig)) {
            if (key === "profiles" && args.includeProfiles) {
                // Process profiles - preserve complete original structure including nested profiles
                redacted.profiles = {};

                for (const [profileName, profileData] of Object.entries(value as any)) {
                    const profile = profileData as any;

                    // Start with empty profile object
                    const redactedProfile: any = {};

                    // Copy type if it exists
                    if (profile.type) {
                        redactedProfile.type = profile.type;
                    }

                    // Redact properties while preserving exact original structure
                    // Only process properties that actually exist in the original properties section
                    if (profile.properties) {
                        redactedProfile.properties = {};
                        for (const [propName, propValue] of Object.entries(profile.properties)) {
                            // Only include properties that are actually defined in the original properties
                            redactedProfile.properties[propName] = this.redactValue(
                                propName,
                                propValue,
                                null, // Schema not needed for basic redaction
                                args
                            );
                        }
                    }

                    // Recursively handle nested profiles
                    if (profile.profiles) {
                        redactedProfile.profiles = {};
                        for (const [nestedProfileName, nestedProfileData] of Object.entries(profile.profiles)) {
                            // Use redacted name for nested profiles if profile name redaction is enabled
                            const redactedNestedName = args.redactProfileNames ?
                                this.getOrCreateKey(nestedProfileName, "profile") : nestedProfileName;
                            redactedProfile.profiles[redactedNestedName] = this.redactProfileObject(nestedProfileData, args);
                        }
                    }

                    // Only include secure fields if they were actually present in the original config
                    if (profile.secure && !args.hideSecureFields) {
                        redactedProfile.secure = profile.secure;
                    }

                    // Use redacted profile name as key if profile name redaction is enabled
                    const redactedProfileName = args.redactProfileNames ?
                        this.getOrCreateKey(profileName, "profile") : profileName;
                    redacted.profiles[redactedProfileName] = redactedProfile;
                }
            } else if (key === "defaults" && args.includeDefaults) {
                // Process defaults - only redact if profile names should be redacted
                if (args.redactProfileNames) {
                    redacted.defaults = this.redactObject(value, args);
                } else {
                    // Don't redact defaults by default - they're just profile references
                    redacted.defaults = value;
                }
            } else if (key !== "profiles" && key !== "defaults") {
                // Process all other properties in their original position
                if (key === "$schema") {
                    redacted[key] = "<SCHEMA_PATH_REDACTED>";
                } else {
                    redacted[key] = this.redactObject(value, args);
                }
            }
        }
        return redacted;
    }

    private redactProfileObject(profile: any, args: any): any {
        const redactedProfile: any = {};

        // Copy type if it exists
        if (profile.type) {
            redactedProfile.type = profile.type;
        }

        // Redact properties while preserving structure
        if (profile.properties) {
            redactedProfile.properties = {};
            for (const [propName, propValue] of Object.entries(profile.properties)) {
                redactedProfile.properties[propName] = this.redactValue(
                    propName,
                    propValue,
                    null,
                    args
                );
            }
        }

        // Recursively handle nested profiles
        if (profile.profiles) {
            redactedProfile.profiles = {};
            for (const [nestedProfileName, nestedProfileData] of Object.entries(profile.profiles)) {
                // Use redacted name for nested profiles if profile name redaction is enabled
                const redactedNestedName = args.redactProfileNames ?
                    this.getOrCreateKey(nestedProfileName, "profile") : nestedProfileName;
                redactedProfile.profiles[redactedNestedName] = this.redactProfileObject(nestedProfileData, args);
            }
        }

        // Only include secure fields if they were actually present in the original config
        if (profile.secure && !args.hideSecureFields) {
            redactedProfile.secure = profile.secure;
        }

        return redactedProfile;
    }

    private redactValue(propertyName: string, value: any, schema: any, args: any): any {
        const valueType = typeof value;

        // Apply type-based redaction rules
        switch (valueType) {
            case "string":
                if (args.redactStrings) {
                    return this.getOrCreateKey(value, propertyName);
                }
                return value;

            case "number":
                if (args.redactNumbers) {
                    return this.getOrCreateKey(value.toString(), propertyName);
                }
                return value;

            case "boolean":
                if (args.redactBooleans) {
                    return this.getOrCreateKey(value.toString(), propertyName);
                }
                return value;

            case "object":
                if (value === null) return null;
                if (Array.isArray(value)) {
                    return value.map(item => this.redactValue(propertyName, item, schema, args));
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
                redacted[key] = this.redactValue(key, value, null, args);
            }
            return redacted;
        }

        return obj;
    }

    private getOrCreateKey(value: string, propertyName: string): string {
        // Convert value to string for consistent mapping
        const valueStr = String(value);

        // Check if we already have a key for this value
        if (this.valueToKeyMap.has(valueStr)) {
            return this.valueToKeyMap.get(valueStr)!;
        }

        // Create a new key based on the property type and value
        const keyPrefix = this.getKeyPrefix(propertyName, value);
        const key = `<${keyPrefix}${this.keyCounter}>`;
        this.keyCounter++;

        // Store the mapping
        this.valueToKeyMap.set(valueStr, key);

        return key;
    }

    private getKeyPrefix(propertyName: string, value: any): string {
        const lowerName = propertyName.toLowerCase();
        const valueType = typeof value;

        // Type-specific prefixes
        if (valueType === "boolean") return "bool";
        if (valueType === "number") return "num";

        // String-specific prefixes based on property name
        if (lowerName.includes("host")) return "host";
        if (lowerName.includes("url") || lowerName.includes("endpoint")) return "url";
        if (lowerName.includes("port")) return "port";
        if (lowerName.includes("path")) return "path";
        if (lowerName.includes("user") || lowerName.includes("username")) return "user";
        if (lowerName.includes("base")) return "base";
        if (lowerName.includes("profile")) return "profile";

        // Default based on type
        if (valueType === "string") return "str";
        return "value";
    }

    private stripJsonComments(content: string): string {
        // Remove single-line comments (// comment)
        let cleaned = content.replace(/\/\/.*$/gm, '');

        // Remove multi-line comments (/* comment */)
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

        return cleaned;
    }

    private async writeToFile(content: string, filePath: string): Promise<void> {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write file
            fs.writeFileSync(filePath, content, 'utf8');
        } catch (error) {
            throw new ImperativeError({
                msg: `Failed to write to file '${filePath}': ${error.message}`,
                causeErrors: error
            });
        }
    }
}