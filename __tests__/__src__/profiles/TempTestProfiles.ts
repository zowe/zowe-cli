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
import { ITestEnvironment } from "../environment/doc/response/ITestEnvironment";
import { ImperativeError, IO } from "@zowe/imperative";
import { runCliScript } from "../TestUtils";
import { Constants } from "../../../packages/Constants";
import * as fs from "fs";

const uuidv4 = require("uuid");

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
    public static GLOBAL_INSTALL_NOTE: string = "\n\nNote: Make sure you have the current version of " +
        Constants.DISPLAY_NAME + " installed or linked globally so that " +
        "'" + Constants.BINARY_NAME + "' can be issued to create profiles and issue other commands.";

    /**
     * Create profiles for tests from data in the properties yaml file
     * @param {ITestEnvironment} testEnvironment - with working directory and test properties loaded
     * @param {string[]} profileTypes - array of types of profiles to create
     *                                  from test properties
     * @returns {Promise<{ [key: string]: string }>} promise that resolves when profiles are created to
     *                          an array of profile names. Resolves to a key:value object that can be used
     *                          later to clean up profiles
     * @throws errors if any of the profile creations fail or if requested to create an unknown profile type
     */
    public static async createProfiles(testEnvironment: ITestEnvironment, profileTypes: string[] = []) {
        const profileNames: { [key: string]: string[] } = {zosmf: [], tso: [], ssh: [], base: []};
        this.log(testEnvironment, "Creating the following profileTypes: " + profileTypes);
        for (const type of profileTypes) {
            if (type === "zosmf") {
                profileNames.zosmf.push(await TempTestProfiles.createZosmfProfile(testEnvironment));
            } else if (type === "tso") {
                profileNames.tso.push(await TempTestProfiles.createTsoProfile(testEnvironment));
            } else if (type === "ssh") {
                profileNames.ssh.push(await TempTestProfiles.createSshProfile(testEnvironment));
            } else if (type === "base") {
                profileNames.base.push(await TempTestProfiles.createBaseProfile(testEnvironment));
            } else {
                throw new ImperativeError({msg: "asked to create unknown profile type '" + type + "'"});
            }
        }
        return profileNames;
    }

    /**
     *  Delete temporary profiles that were create earlier
     * @param {ITestEnvironment} testEnvironment -  with working directory and test properties loaded
     * @param {{[key: string]: string[]}} profiles - temporary profiles created earlier to delete.
     * @throws errors if any of the profile deletions fail
     */
    public static async deleteProfiles(testEnvironment: ITestEnvironment) {
        // the temporary profiles created earlier.
        const profiles = testEnvironment.tempProfiles;
        this.log(testEnvironment, "Deleting the following profiles:\n" + JSON.stringify(profiles));
        for (const profileType of Object.keys(profiles)) {
            for (const profileName of profiles[profileType]) {
                await this.deleteProfile(testEnvironment, profileType, profileName);
            }
        }
    }

    /**
     * Shebang to generated start script files with
     * @type {string}
     */
    private static SHEBANG = "#!/bin/bash\n\n";

    /**
     * We don't need a full UUID, so we'll substring the UUID for shorter file
     * names if something goes wrong
     * @type {number}
     */
    private static MAX_UUID_LENGTH = 20;

    /**
     * Helper to create a zosmf profile from test properties
     * @param {ITestEnvironment} testEnvironment - the test environment with env and working directory to use for output
     * @returns {Promise<string>} promise that resolves to the name of the created profile on success
     * @throws errors if the profile creation fails
     */
    private static async createZosmfProfile(testEnvironment: ITestEnvironment): Promise<string> {
        const profileName: string = uuidv4().substring(0, TempTestProfiles.MAX_UUID_LENGTH) + "_tmp_zosmf";
        const zosmfProperties = testEnvironment.systemTestProperties.zosmf;
        let createProfileScript = this.SHEBANG +
            `${Constants.BINARY_NAME} profiles create zosmf ${profileName} --user ${zosmfProperties.user} --pw ` +
            `${zosmfProperties.pass} --ru ${zosmfProperties.rejectUnauthorized}` +
            ` --host ${zosmfProperties.host} --port ${zosmfProperties.port}`;
        // if basePath has been entered in custom_properties, add it to the
        // create zosmf profile arguments
        if (zosmfProperties.basePath != null) {
            createProfileScript += ` --base-path ${zosmfProperties.basePath}`;
        }
        const scriptPath = testEnvironment.workingDir + "_create_profile_" + profileName;
        await IO.writeFileAsync(scriptPath, createProfileScript);
        const output = runCliScript(scriptPath, testEnvironment, []);
        if (output.status !== 0 || output.stderr.toString().trim().length > 0) {
            throw new ImperativeError({
                msg: "Creation of zosmf profile '" + profileName + "' failed! You should delete the script: '" + scriptPath + "' " +
                    "after reviewing it to check for possible errors. Stderr of the profile create command:\n" + output.stderr.toString() +
                    TempTestProfiles.GLOBAL_INSTALL_NOTE
            });
        }
        IO.deleteFile(scriptPath);
        this.log(testEnvironment, `Created zosmf profile '${profileName}'. Stdout from creation:\n${output.stdout.toString()}`);
        return profileName;
    }

    /**
     * Helper to create a tso profile from test properties
     * @param {ITestEnvironment} testEnvironment - the test environment with env and working directory to use for output
     * @returns {Promise<string>} promise that resolves to the name of the created profile on success
     * @throws errors if the profile creation fails
     */
    private static async createTsoProfile(testEnvironment: ITestEnvironment): Promise<string> {
        const profileName: string = uuidv4().substring(0, TempTestProfiles.MAX_UUID_LENGTH) + "_tmp_tso";
        const tsoProperties = testEnvironment.systemTestProperties.tso;
        const createProfileScript = this.SHEBANG + `${Constants.BINARY_NAME} profiles create tso ${profileName} -a ${tsoProperties.account}`;
        const scriptPath = testEnvironment.workingDir + "_create_profile_" + profileName;
        await IO.writeFileAsync(scriptPath, createProfileScript);
        const output = runCliScript(scriptPath, testEnvironment, []);
        if (output.status !== 0 || output.stderr.toString().trim().length > 0) {
            throw new ImperativeError({
                msg: "Creation of tso profile '" + profileName + "' failed! You should delete the script: '" + scriptPath + "' " +
                    "after reviewing it to check for possible errors. Stderr of the profile create command:\n" + output.stderr.toString()
                    + TempTestProfiles.GLOBAL_INSTALL_NOTE
            });
        }
        this.log(testEnvironment, `Created tso profile '${profileName}'. Stdout from creation:\n${output.stdout.toString()}`);

        IO.deleteFile(scriptPath);
        return profileName;
    }

    /**
     * Helper to create a ssh profile from test properties
     * @param {ITestEnvironment} testEnvironment - the test environment with env and working directory to use for output
     * @returns {Promise<string>} promise that resolves to the name of the created profile on success
     * @throws errors if the profile creation fails
     */
    private static async createSshProfile(testEnvironment: ITestEnvironment): Promise<string> {
        const profileName: string = uuidv4().substring(0, TempTestProfiles.MAX_UUID_LENGTH) + "_tmp_ssh";
        const sshProperties = testEnvironment.systemTestProperties.ssh;
        let createProfileScript = this.SHEBANG +
            `${Constants.BINARY_NAME} profiles create ssh ${profileName} --user ${sshProperties.user} --pass ` +
            `${sshProperties.password} --host ${sshProperties.host} --port ${sshProperties.port}`;
        if (sshProperties.privateKey) {
            createProfileScript += ` --privateKey ${sshProperties.privateKey}`;
        }
        if (sshProperties.keyPassphrase) {
            createProfileScript += ` --keyPassphrase ${sshProperties.keyPassphrase}`;
        }
        if (sshProperties.handshakeTimeout) {
            createProfileScript += ` --handshakeTimeout ${sshProperties.handshakeTimeout}`;
        }

        const scriptPath = testEnvironment.workingDir + "_create_profile_" + profileName;
        await IO.writeFileAsync(scriptPath, createProfileScript);
        const output = runCliScript(scriptPath, testEnvironment, []);
        if (output.status !== 0 || output.stderr.toString().trim().length > 0) {
            throw new ImperativeError({
                msg: "Creation of ssh profile '" + profileName + "' failed! You should delete the script: '" + scriptPath + "' " +
                    "after reviewing it to check for possible errors. Stderr of the profile create command:\n" + output.stderr.toString() +
                    TempTestProfiles.GLOBAL_INSTALL_NOTE
            });
        }
        IO.deleteFile(scriptPath);
        this.log(testEnvironment, `Created ssh profile '${profileName}'. Stdout from creation:\n${output.stdout.toString()}`);
        return profileName;
    }

    /**
     * Helper to create a base profile from test properties
     * @param {ITestEnvironment} testEnvironment - the test environment with env and working directory to use for output
     * @returns {Promise<string>} promise that resolves to the name of the created profile on success
     * @throws errors if the profile creation fails
     */
    private static async createBaseProfile(testEnvironment: ITestEnvironment): Promise<string> {
        const profileName: string = uuidv4().substring(0, TempTestProfiles.MAX_UUID_LENGTH) + "_tmp_base";
        const baseProperties = testEnvironment.systemTestProperties.base;
        let createProfileScript = this.SHEBANG +
            `${Constants.BINARY_NAME} profiles create base ${profileName} --user ${baseProperties.user} --pw ` +
            `${baseProperties.pass} --ru ${baseProperties.rejectUnauthorized}` +
            ` --host ${baseProperties.host} --port ${baseProperties.port}`;
        // if basePath has been entered in custom_properties, add it to the
        // create zosmf profile arguments
        if (baseProperties.basePath != null) {
            createProfileScript += ` --base-path ${baseProperties.basePath}`;
        }
        if (baseProperties.tokenType != null) {
            createProfileScript += ` --token-type ${baseProperties.tokenType}`;
        }
        if (baseProperties.tokenValue != null) {
            createProfileScript += ` --token-value ${baseProperties.tokenValue}`;
        }
        const scriptPath = testEnvironment.workingDir + "_create_profile_" + profileName;
        await IO.writeFileAsync(scriptPath, createProfileScript);
        const output = runCliScript(scriptPath, testEnvironment, []);
        if (output.status !== 0 || output.stderr.toString().trim().length > 0) {
            throw new ImperativeError({
                msg: "Creation of base profile '" + profileName + "' failed! You should delete the script: '" + scriptPath + "' " +
                    "after reviewing it to check for possible errors. Stderr of the profile create command:\n" + output.stderr.toString() +
                    TempTestProfiles.GLOBAL_INSTALL_NOTE
            });
        }
        IO.deleteFile(scriptPath);
        this.log(testEnvironment, `Created base profile '${profileName}'. Stdout from creation:\n${output.stdout.toString()}`);
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
    private static async deleteProfile(testEnvironment: ITestEnvironment, profileType: string, profileName: string): Promise<string> {
        const deleteProfileScript = this.SHEBANG + `${Constants.BINARY_NAME} profiles delete ${profileType} ${profileName} --force`;
        const scriptPath = testEnvironment.workingDir + "_delete_profile_" + profileName;
        await IO.writeFileAsync(scriptPath, deleteProfileScript);
        const output = runCliScript(scriptPath, testEnvironment, []);
        if (output.status !== 0 || output.stderr.toString().trim().length > 0) {
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
    private static log(testEnvironment: ITestEnvironment, message: string) {
        fs.appendFileSync(testEnvironment.workingDir + "/" + TempTestProfiles.LOG_FILE_NAME, message + "\n");
    }

}
