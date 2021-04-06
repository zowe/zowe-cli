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

/**
 * Test utility for creating and deleting
 */

import * as fs from "fs";

import { v4 as uuidv4 } from "uuid";
import { ImperativeError, IO } from "@zowe/imperative";

import { ITestEnvironment } from "./doc/response/ITestEnvironment";
import { Constants } from "./Constants";
import { runCliScript } from "../TestUtils";

/**
 * Utilities for creating and cleaning up temporary profiles for tests
 */
export class TempTestProfiles {
    /**
     * The log name for output from the create profiles commands
     * @static
     * @type {string}
     * @memberof TempTestProfiles
     */
    public static LOG_FILE_NAME: string = "TempTestProfiles.log";

    /**
     * Note reminding the user that failed profile creation may be the result of not installing brightside
     * globally
     * @type {string}
     * @memberof TempTestProfiles
     */
    public static GLOBAL_INSTALL_NOTE: string = `\n\nNote: Make sure you have the current version of Zowe CLI ` +
        `installed or linked globally so that '${Constants.BINARY_NAME}' can be issued to create profiles and issue ` +
        `other commands.`;

    /**
     * Create profiles for tests from data in the properties yaml file
     * @param {ITestEnvironment} testEnvironment - with working directory and test properties loaded
     * @param {string[]} profileTypes - array of types of profiles to create
     *                                  from test properties
     * @returns {Promise<{ [key: string]: string[] }>} promise that resolves when profiles are created to
     *                          an array of profile names. Resolves to a key:value object that can be used
     *                          later to clean up profiles
     * @throws errors if any of the profile creations fail or if requested to create an unknown profile type
     */
    public static async createProfiles(testEnvironment: ITestEnvironment<any>, profileTypes: string[] = []) {
        const profileNames: { [key: string]: string[] } = {};
        this.log(testEnvironment, "Creating the following profileTypes: " + profileTypes);
        for (const type of profileTypes) {
            profileNames[type] = [await TempTestProfiles.createProfileForType(testEnvironment, type)];
        }
        return profileNames;
    }

    /**
     *  Delete temporary profiles that were create earlier
     * @param {ITestEnvironment} testEnvironment -  with working directory and test properties loaded
     * @param {{[key: string]: string[]}} profiles - temporary profiles created earlier to delete.
     * @throws errors if any of the profile deletions fail
     */
    public static async deleteProfiles(testEnvironment: ITestEnvironment<any>) {
        // the temporary profiles created earlier.
        const profiles = testEnvironment.tempProfiles || {};
        this.log(testEnvironment, "Deleting the following profiles:\n" + JSON.stringify(profiles));
        for (const profileType of Object.keys(profiles)) {
            for (const profileName of profiles[profileType]) {
                await this.deleteProfile(testEnvironment, profileType, profileName);
            }
        }
    }

    /**
     * We don't need a full UUID, so we'll substring the UUID for shorter file
     * names if something goes wrong
     * @type {number}
     */
    private static MAX_UUID_LENGTH = 20;

    /**
     * Helper to create a temporary old school profile from test properties
     * @param {ITestEnvironment} testEnvironment - the test environment with env and working directory to use for output
     * @returns {Promise<string>} promise that resolves to the name of the created profile on success
     * @throws errors if the profile creation fails
     */
    private static async createProfileForType(testEnvironment: ITestEnvironment<any>, profileType: string): Promise<string> {
        const profileName: string = uuidv4().substring(0, TempTestProfiles.MAX_UUID_LENGTH) + "_tmp_" + profileType;
        let createProfileScript = Constants.SHEBANG +
            `${Constants.BINARY_NAME} profiles create ${profileType} ${profileName}`;
        for (const [k, v] of Object.entries(testEnvironment.systemTestProperties[profileType])) {
            createProfileScript += ` ${(k.length > 1) ? "--" : "-"}${k} ${v}`;
        }
        const scriptPath = testEnvironment.workingDir + "_create_profile_" + profileName;
        await IO.writeFileAsync(scriptPath, createProfileScript);
        const output = runCliScript(scriptPath, testEnvironment, []);
        if (output.status !== 0 || !this.isStderrEmpty(output.stderr)) {
            throw new ImperativeError({
                msg: `Creation of ${profileType} profile '${profileName}' failed! You should delete the script: ` +
                    `'${scriptPath}' after reviewing it to check for possible errors. Stderr of the profile create ` +
                    `command:\n` + output.stderr.toString() + TempTestProfiles.GLOBAL_INSTALL_NOTE
            });
        }
        IO.deleteFile(scriptPath);
        this.log(testEnvironment, `Created ${profileType} profile '${profileName}'. Stdout from creation:\n${output.stdout.toString()}`);
        return profileName;
    }

    /**
     * Helper to delete a temporary profile
     * @param {ITestEnvironment} testEnvironment - the test environment with env and working directory to use for output
     * @param {string} profileType - the type of profile e.g. zosmf to
     * @param {string} profileName - the name of the profile to delete
     * @returns {Promise<string>} promise that resolves to the name of the created profile on success
     * @throws errors if the profile delete fails
     */
    private static async deleteProfile(testEnvironment: ITestEnvironment<any>, profileType: string, profileName: string): Promise<string> {
        const deleteProfileScript = Constants.SHEBANG + `${Constants.BINARY_NAME} profiles delete ${profileType} ${profileName} --force`;
        const scriptPath = testEnvironment.workingDir + "_delete_profile_" + profileName;
        await IO.writeFileAsync(scriptPath, deleteProfileScript);
        const output = runCliScript(scriptPath, testEnvironment, []);
        if (output.status !== 0 || !this.isStderrEmpty(output.stderr)) {
            throw new ImperativeError({
                msg: "Deletion of " + profileType + " profile '" + profileName + "' failed! You should delete the script: '" + scriptPath + "' " +
                    "after reviewing it to check for possible errors. Stderr of the profile create command:\n" + output.stderr.toString()
                    + TempTestProfiles.GLOBAL_INSTALL_NOTE
            });
        }
        this.log(testEnvironment, `Deleted ${profileType} profile '${profileName}'. Stdout from deletion:\n${output.stdout.toString()}`);
        IO.deleteFile(scriptPath);
        return profileName;
    }

    /**
     * log a message to a file in the working directory
     */
    private static log(testEnvironment: ITestEnvironment<any>, message: string) {
        fs.appendFileSync(testEnvironment.workingDir + "/" + TempTestProfiles.LOG_FILE_NAME, message + "\n");
    }

    /**
     * Check if stderr output is empty for profile command. Ignores any message
     * about profiles being deprecated.
     */
    private static isStderrEmpty(output: Buffer): boolean {
        return output.toString()
                     .replace(/Warning: The command 'profiles [a-z]+' is deprecated\./, "")
                     .replace(/Recommended replacement: The 'config [a-z]+' command/, "")
                     .replace(/Recommended replacement: Edit your Zowe V2 configuration\s+zowe\.config\.json/, "")
                     .trim().length === 0;
    }
}
