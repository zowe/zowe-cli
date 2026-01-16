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

    private static simpleEnvironmentVariableRegex = /\$([A-Za-z0-9_]*)/;
    private static simpleEnvironmentVariableRegexGlobal = new RegExp(this.simpleEnvironmentVariableRegex, 'g');
    private static complexEnvironmentVariableRegex = /\${([^}]*)}/;
    private static complexEnvironmentVariableRegexGlobal = new RegExp(this.complexEnvironmentVariableRegex, 'g');

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
            const envValues = process.env;
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

        let simpleMatch: RegExpMatchArray | null = modifiedString.match(this.simpleEnvironmentVariableRegex);
        while ( simpleMatch != null ) {
            modifiedString = modifiedString.replace(simpleMatch[0], process.env[simpleMatch[1]]);
            simpleMatch = modifiedString.match(this.simpleEnvironmentVariableRegex);
        }

        let advancedMatch: RegExpMatchArray | null = modifiedString.match(this.complexEnvironmentVariableRegex);
        while (advancedMatch != null) {
            modifiedString = modifiedString.replace(advancedMatch[0], process.env[advancedMatch[1]]);
            advancedMatch = modifiedString.match(this.complexEnvironmentVariableRegex);
        }

        return modifiedString;
    }
}