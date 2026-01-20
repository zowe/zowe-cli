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

export class ConfigEnvironmentVariables {

    private static simpleEnvironmentVariableRegexGlobal = /\$([A-Za-z0-9_]+)/g;
    private static complexEnvironmentVariableRegexGlobal = /\${([^}]+)}/g;

    /**
     * Find all environment variables in a given string and return the variable names
     * @internal
     * @param candidate The string to search for enviornment variables
     * @returns {Set<string>} A set of strings if environment variables are found, an empty set otherwise
     */
    public static findEnvironmentVariables(candidate: string): Set<string> {
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
     * @internal
     * @param candidate The string to replace environment variables in
     * @returns {string} The string with the environment variables replaced with their values
     */
    public static replaceEnvironmentVariablesInString(candidate: string): string {
        let modifiedString = candidate;

        let simpleMatch: RegExpExecArray | null = this.simpleEnvironmentVariableRegexGlobal.exec(modifiedString);
        while ( simpleMatch != null ) {
            const environmentMatch = process.env[simpleMatch[1]];
            if (environmentMatch) {
                modifiedString = this.sliceText(modifiedString, simpleMatch.index, simpleMatch[0].length, environmentMatch);
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
                modifiedString = this.sliceText(modifiedString, advancedMatch.index, advancedMatch[0].length, environmentMatch);
                this.complexEnvironmentVariableRegexGlobal.lastIndex =
                this.complexEnvironmentVariableRegexGlobal.lastIndex -
                advancedMatch[0].length +
                environmentMatch.length;
            }
            advancedMatch = this.complexEnvironmentVariableRegexGlobal.exec(modifiedString);
        }

        return modifiedString;
    }

    private static sliceText(text: string, index: number, chars: number, newValue: string): string {
        const before = text.slice(0, index);
        const after = text.slice(index + chars);
        return before + newValue + after;
    }
}