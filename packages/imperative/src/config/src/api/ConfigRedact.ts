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
import { ImperativeError } from "../../../error";
import { IConfigLayer } from "../doc/IConfigLayer";
import { IConfigExportRedactedOpts } from "../doc/IConfigExportRedactedOpts";
import { IConfigExportRedactedResult } from "../doc/IConfigExportRedactedResult";
import { ConfigApi } from "./ConfigApi";

type NormalizedOpts = Required<IConfigExportRedactedOpts>;

/**
 * API Class for redacting sensitive values out of config layers so that
 * they can be safely shared or used for troubleshooting.
 */
export class ConfigRedact extends ConfigApi {
    private keyCounters: Map<string, number> = new Map();
    private valueToKeyMap: Map<string, string> = new Map();

    // _______________________________________________________________________
    /**
     * Produce redacted copies of every config layer that exists on disk,
     * without writing anything. Useful for previewing the result of a
     * redacted export (e.g. a dry run) before committing to a directory.
     *
     * @param opts Options that control which values get redacted.
     */
    public getRedactedLayers(opts: IConfigExportRedactedOpts = {}): IConfigExportRedactedResult[] {
        this.resetKeyMaps();
        const normalized = this.normalizeOpts(opts);

        const results: IConfigExportRedactedResult[] = [];
        for (const layer of this.mConfig.layers) {
            if (layer.exists) {
                results.push({
                    source: this.getLayerSourceName(layer),
                    redactedConfig: this.createRedactedConfig(layer, normalized)
                });
            }
        }
        return results;
    }

    // _______________________________________________________________________
    /**
     * Redact every config layer that exists on disk and write the results
     * to the given directory.
     *
     * @param exportDir Directory where redacted config files will be written.
     * @param opts Options that control which values get redacted.
     */
    public exportToDirectory(exportDir: string, opts: IConfigExportRedactedOpts = {}): IConfigExportRedactedResult[] {
        this.resetKeyMaps();
        const normalized = this.normalizeOpts(opts);

        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const results: IConfigExportRedactedResult[] = [];
        for (const layer of this.mConfig.layers) {
            if (layer.exists) {
                const redactedConfig = this.createRedactedConfig(layer, normalized);
                const filePath = path.join(exportDir, this.getLayerFilename(layer));
                this.writeToFile(JSON.stringify(redactedConfig, null, 2), filePath);

                results.push({
                    source: this.getLayerSourceName(layer),
                    redactedConfig,
                    target: filePath
                });
            }
        }
        return results;
    }

    // _______________________________________________________________________

    private resetKeyMaps(): void {
        this.keyCounters = new Map();
        this.valueToKeyMap = new Map();
    }

    private normalizeOpts(opts: IConfigExportRedactedOpts): NormalizedOpts {
        return {
            redactStrings: opts.redactStrings ?? true,
            redactNumbers: opts.redactNumbers ?? true,
            redactBooleans: opts.redactBooleans ?? false,
            hideSecureFields: opts.hideSecureFields ?? false,
            redactProfileNames: opts.redactProfileNames ?? true,
            showHostPath: opts.showHostPath ?? false
        };
    }

    private getLayerSourceName(layer: IConfigLayer): string {
        return path.join(path.basename(path.dirname(layer.path)), path.basename(layer.path));
    }

    private getLayerFilename(layer: IConfigLayer): string {
        if (layer.global && layer.user) {
            return "global.zowe.config.user.json";
        } else if (layer.global && !layer.user) {
            return "global.zowe.config.json";
        } else if (!layer.global && layer.user) {
            return "project.zowe.config.user.json";
        } else {
            return "project.zowe.config.json";
        }
    }

    private createRedactedConfig(layer: IConfigLayer, opts: NormalizedOpts): Record<string, any> {
        // Read the raw JSON file directly to avoid any ProfileInfo processing/merging
        let originalConfig: any;
        try {
            const rawContent = fs.readFileSync(layer.path, "utf8");
            // Strip JSON comments before parsing since config files may contain them
            const cleanedContent = this.stripJsonComments(rawContent);
            originalConfig = JSON.parse(cleanedContent);
        } catch (error) {
            throw new ImperativeError({
                msg: `Failed to read config file '${layer.path}': ${error.message}`,
                causeErrors: error
            });
        }

        const redacted: any = {};

        for (const [rawKey, value] of Object.entries(originalConfig)) {
            const key = rawKey.toLowerCase();
            if (key === "profiles") {
                redacted.profiles = {};

                for (const [profileName, profileData] of Object.entries(value as any)) {
                    const redactedProfileName = opts.redactProfileNames ?
                        this.getOrCreateKey(profileName, "profile") : profileName;
                    redacted.profiles[redactedProfileName] = this.redactProfileObject(profileData, opts);
                }
            } else if (key === "defaults") {
                if (opts.redactProfileNames && value && typeof value === "object" && !Array.isArray(value)) {
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
                    redacted[rawKey] = this.redactObject(value, opts);
                }
            }
        }
        return redacted;
    }

    private redactProfileObject(profile: any, opts: NormalizedOpts): any {
        const redactedProfile: any = {};

        if (profile.type) {
            redactedProfile.type = profile.type;
        }

        if (profile.properties) {
            redactedProfile.properties = {};
            for (const [propName, propValue] of Object.entries(profile.properties)) {
                redactedProfile.properties[propName] = this.redactValue(propName, propValue, opts);
            }
        }

        if (profile.profiles) {
            redactedProfile.profiles = {};
            for (const [nestedProfileName, nestedProfileData] of Object.entries(profile.profiles)) {
                const redactedNestedName = opts.redactProfileNames ?
                    this.getOrCreateKey(nestedProfileName, "profile") : nestedProfileName;
                redactedProfile.profiles[redactedNestedName] = this.redactProfileObject(nestedProfileData, opts);
            }
        }

        if (profile.secure && !opts.hideSecureFields) {
            redactedProfile.secure = profile.secure;
        }

        return redactedProfile;
    }

    private redactValue(propertyName: string, value: any, opts: NormalizedOpts): any {
        const valueType = typeof value;

        if (opts.showHostPath && (propertyName === "host" || propertyName === "basePath")) {
            return value;
        }

        switch (valueType) {
            case "string":
                if (opts.redactStrings && value !== "") {
                    return this.getOrCreateKey(value, propertyName);
                }
                return value;

            case "number":
                if (opts.redactNumbers) {
                    return this.getOrCreateKey(value, propertyName);
                }
                return value;

            case "boolean":
                if (opts.redactBooleans) {
                    return this.getOrCreateKey(value, propertyName);
                }
                return value;

            case "object":
                if (value === null) return null;
                if (Array.isArray(value)) {
                    return value.map(item => this.redactValue(propertyName, item, opts));
                }
                return this.redactObject(value, opts);

            default:
                return value;
        }
    }

    private redactObject(obj: any, opts: NormalizedOpts): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.redactObject(item, opts));
        }

        if (typeof obj === "object") {
            const redacted: any = {};
            for (const [key, value] of Object.entries(obj)) {
                redacted[key] = this.redactValue(key, value, opts);
            }
            return redacted;
        }

        return obj;
    }

    private getOrCreateKey(value: any, propertyName: string): string {
        const valueStr = String(value);
        const cacheKey = `${typeof value}:${valueStr}`;

        if (this.valueToKeyMap.has(cacheKey)) {
            return this.valueToKeyMap.get(cacheKey)!;
        }

        const keyPrefix = this.getKeyPrefix(propertyName, value);
        const nextCount = (this.keyCounters.get(keyPrefix) ?? 0) + 1;
        this.keyCounters.set(keyPrefix, nextCount);

        let key = `<${keyPrefix}${nextCount}>`;
        if (valueStr.startsWith("$")) {
            key = "$" + key;
        }

        this.valueToKeyMap.set(cacheKey, key);

        return key;
    }

    private getKeyPrefix(propertyName: string, value: any): string {
        const lowerName = propertyName.toLowerCase();
        const valueType = typeof value;

        const namePrefixes = ["host", "port", "path", "user", "base", "profile", "password"];
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

            fs.writeFileSync(filePath, content, "utf8");
        } catch (error) {
            throw new ImperativeError({
                msg: `Failed to write to file '${filePath}': ${error.message}`,
                causeErrors: error
            });
        }
    }
}
