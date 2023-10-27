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

import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { ImperativeError } from "../../error/src/ImperativeError";
import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import * as JSONC from "comment-json";

/**
 * Utility to load environment JSON files and set variables
 * @export
 * @class EnvFileUtils
 */
export class EnvFileUtils {

    /**
     * This variable holds a cached version of the EnvFileJson.
     */
    private static environmentJSON: any = {};

    /**
     * Check and read in an environment file from the user home directory using the app name
     * If the file is valid, set the environment variables
     * If the file is not valid, display an error and continue
     * @param {string} appName - The application name
     * @param {boolean} checkCliHomeVariableFirst - Check inside of *_CLI_HOME first if it is defined
     * @param {string} envPrefix - The environment variable prefix
     * @returns {void}
     * @throws {ImperativeError}
     */
    public static setEnvironmentForApp(appName: string, checkCliHomeVariableFirst = false, envPrefix?: string): void {
        const expectedFileLocation = this.getEnvironmentFilePath(appName, checkCliHomeVariableFirst, envPrefix);
        if (expectedFileLocation) {
            try {
                const fileContents = readFileSync(expectedFileLocation).toString(); // Read the file in
                const fileContentsJSON = JSONC.parse(fileContents);
                this.environmentJSON = fileContentsJSON;
                this.resetEnvironmentForApp();
            } catch (err) {
                let errorMessage = "Failed to set up environment variables from the environment file.\n" +
                    "Environment variables will not be available.\nFile: " + expectedFileLocation;

                if (err.line != null && err.column != null) {
                    errorMessage += "\nLine: " + err.line.toString() + "\nColumn: " + err.column.toString();
                }

                throw new ImperativeError({msg: errorMessage, causeErrors: err});
            }
        }
    }

    /**
     * Reapply environment variables that were applied before
     * @returns {void}
     * @throws {ImperativeError}
     */
    public static resetEnvironmentForApp(): void {
        Object.keys(this.environmentJSON).forEach( key => {
            process.env[key] = this.environmentJSON[key];
        });
    }

    /**
     * Get the expected path for the user's environment variable file
     * @param {string} appName - The application name
     * @param {boolean} checkCliHomeVariableFirst - Check inside of *_CLI_HOME first if it is defined
     * @param {string} envPrefix - environment variable prefix
     * @returns {string} - Returns the path string if it exists, or null if it does not
     */
    public static getEnvironmentFilePath(appName: string, checkCliHomeVariableFirst = false, envPrefix?: string): string {
        if (checkCliHomeVariableFirst) {
            const cliHome = this.getCliHomeEnvironmentFilePath(appName, envPrefix);
            if (cliHome) {
                return cliHome;
            }
        }
        return this.getUserHomeEnvironmentFilePath(appName);
    }

    /**
     * Get the expected path for the user's environment variable file
     * @param {string} appName - The application name
     * @returns {string} - Returns the path string if it exists, or null if it does not
     */
    public static getUserHomeEnvironmentFilePath(appName: string): string {
        const expectedBasename = "." + appName + ".env.json";
        const path = join(homedir(), expectedBasename);
        if (existsSync(path)) {
            return path;
        }
        return null;
    }

    /**
     * Get the expected path for the user's environment variable file
     * @param {string} appName - The application name
     * @param {string} envPrefix - The environment variable prefix
     * @returns {string} - Returns the path string if it exists, or null if it does not
     */
    public static getCliHomeEnvironmentFilePath(appName: string, envPrefix?: string): string {
        const environmentVariable = (envPrefix ? envPrefix : appName.toUpperCase()) + EnvironmentalVariableSettings.CLI_HOME_SUFFIX;
        const expectedBasename = "." + appName + ".env.json";
        const expectedDirectory = process.env[environmentVariable];
        if (expectedDirectory) {
            const path = join(expectedDirectory, expectedBasename);
            if (existsSync(path)) {
                return path;
            }
        }
        return null;
    }
}