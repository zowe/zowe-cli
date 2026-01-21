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

import type { Config } from "./Config";
import type { IConfigEnvVarManaged } from "./doc/IConfigEnvVarManaged";
import type { IConfigLayer } from "./doc/IConfigLayer";
import { ConfigUtils } from "./ConfigUtils";

export class ConfigEnvironmentVariables {

    private static simpleEnvironmentVariableRegexGlobal = /\$([A-Za-z0-9_]+)/g;
    private static complexEnvironmentVariableRegexGlobal = /\${([^}]+)}/g;

    /**
     * @internal
     * Replace environment variables in a config layer with their real values
     * @param obj The config object to iterate over
     * @param config The overall config class to modify
     * @param layer The config layer being operated on
     * @param path The current high level path to the properties being evaluated
     */
    public static replaceEnvironmentVariablesInConfigLayer(obj: any, config: Config, layer: IConfigLayer, path: string = "") {
        Object.keys(obj).forEach(key => {
            const propPath = path + "." + key;
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] != null) {
                this.replaceEnvironmentVariablesInConfigLayer(obj[key], config, layer, propPath);
            } else if (typeof obj[key] == 'string' && obj[key].includes("$") &&
            this.findEnvironmentVariables(obj[key]).size > 0) {
                const replacementValue = ConfigUtils.coercePropValue(
                    this.replaceEnvironmentVariablesInString(obj[key])
                );
                const entry: IConfigEnvVarManaged = {
                    global: layer.global,
                    user: layer.user,
                    propPath: propPath,
                    originalValue: obj[key],
                    replacementValue
                };
                config.mEnvVarManaged.push(entry);
                obj[key] = replacementValue;
            }
        });
    }

    /**
     * @internal
     * Replace the real values of the variables with the variable names
     * @param obj The config object to iterate over
     * @param config The overall config class to modify
     * @param layer The config layer being operated on
     * @param path The current high level path to the properties being evaluated
     */
    public static restoreEnvironmentVariablesInConfigLayer(obj: any, config: Config, layer: IConfigLayer, path: string = "") {
        Object.keys(obj).forEach(key => {
            const propPath = path + "." + key;
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] != null) {
                this.restoreEnvironmentVariablesInConfigLayer(obj[key], config, layer, propPath);
            } else if (typeof obj[key] == 'string') {
                const match = config.mEnvVarManaged.find((value) => {
                    return value.propPath == propPath && value.global == layer.global && value.user == layer.user;
                });
                if (match) { obj[key] = match.originalValue; }
            }
        });
    }

    /**
     * Find all environment variables in a given string and return the variable names
     * @internal
     * @param candidate The string to search for enviornment variables
     * @returns {Set<string>} A set of strings if environment variables are found, an empty set otherwise
     */
    private static findEnvironmentVariables(candidate: string): Set<string> {
        const potentialEnvironmentVariables: Set<string> = new Set();

        // Match using the regexes
        const simpleMatches = candidate.matchAll(this.simpleEnvironmentVariableRegexGlobal);
        const complexMatches = candidate.matchAll(this.complexEnvironmentVariableRegexGlobal);

        // Iterate over matches, ensure validity, add any that are missing from the map if requested
        for (const match of [...simpleMatches, ...complexMatches]) {

            // Ensure the environment variable candidate is valid and has a value
            const value = process.env[match[1]];
            if (value != null) {

                // Return list of environment variables
                potentialEnvironmentVariables.add(match[1]);
            }
        }

        return potentialEnvironmentVariables;
    }

    /**
     * Find and replace all known environment variables in a string
     * @param candidate The string to replace environment variables in
     * @returns {string} The string with the environment variables replaced with their values
     */
    private static replaceEnvironmentVariablesInString(candidate: string): string {
        let modifiedString = candidate;

        let simpleMatch: RegExpExecArray | null = this.simpleEnvironmentVariableRegexGlobal.exec(modifiedString);
        while ( simpleMatch != null ) {
            const environmentMatch = process.env[simpleMatch[1]];
            if (environmentMatch) {
                modifiedString = this.replaceRegexText(modifiedString, simpleMatch, environmentMatch);
                this.simpleEnvironmentVariableRegexGlobal.lastIndex =
                this.simpleEnvironmentVariableRegexGlobal.lastIndex -
                simpleMatch[0].length +
                environmentMatch.length;
            }
            simpleMatch = this.simpleEnvironmentVariableRegexGlobal.exec(modifiedString);
        }

        let advancedMatch: RegExpExecArray | null = this.complexEnvironmentVariableRegexGlobal.exec(modifiedString);
        while (advancedMatch != null) {
            const environmentMatch = process.env[advancedMatch[1]];
            if (environmentMatch) {
                modifiedString = this.replaceRegexText(modifiedString, advancedMatch, environmentMatch);
                this.complexEnvironmentVariableRegexGlobal.lastIndex =
                this.complexEnvironmentVariableRegexGlobal.lastIndex -
                advancedMatch[0].length +
                environmentMatch.length;
            }
            advancedMatch = this.complexEnvironmentVariableRegexGlobal.exec(modifiedString);
        }

        return modifiedString;
    }

    /**
     * Replace the regex match with a string
     * @param text The text string to perform the operations on
     * @param regex The regex match
     * @param newValue The new string to replace the regex value
     * @returns The modified string
     */
    private static replaceRegexText(text: string, regex: RegExpExecArray, newValue: string): string {
        const before = text.slice(0, regex.index);
        const after = text.slice(regex.index + regex[0].length);
        return before + newValue + after;
    }
}