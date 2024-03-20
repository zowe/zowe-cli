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

import { ImperativeError } from "../../../error";
import { ImperativeConfig } from "../../../utilities";
import * as fs from "fs";
import { IProfile } from "../doc/definition/IProfile";
import { IMetaProfile } from "../doc/definition/IMetaProfile";
import * as pathPackage from "path";
import { IProfileTypeConfiguration } from "../doc/config/IProfileTypeConfiguration";

const readYaml = require("js-yaml");

/**
 * V1ProfileConversion methods for reading profiles from disk. The profile managers never invoke "fs" directly.
 * All "fs" calls are wrapped here and errors are transformed to ImperativeError for error handling/flow throughout
 * Imperative.
 *
 * @export
 * @class V1ProfileConversion
 */
export class V1ProfileConversion {
    /**
     * Read the profile meta file using Yaml "safeLoad" (ensures that no code executes, etc. during the load). The
     * meta profile file for a type contains the default profile specification. The meta profile is ALWAYS in YAML
     * format (controlled exclusively by the Imperative framework).
     * @static
     * @param {string} path - The path to the meta profile
     * @returns {IMetaProfile} - The meta profile
     * @memberof V1ProfileConversion
     */
    public static readMetaFile<T extends IProfileTypeConfiguration>(path: string): IMetaProfile<T> {
        V1ProfileConversion.crashInTeamConfigMode();

        let meta: IMetaProfile<T>;
        try {
            meta = readYaml.load(fs.readFileSync(path), "utf8");
        } catch (err) {
            throw new ImperativeError({
                msg: `Error reading profile file ("${path}"). Error Details: ${err.message}`,
                additionalDetails: err
            }, {tag: V1ProfileConversion.ERROR_ID});
        }
        return meta;
    }

    /**
     * Accepts the profiles root directory and returns all directories within. The directories within the root
     * directory are all assumed to be profile type directories (potentially containing a meta file and profiles
     * of that type).
     * @static
     * @param {string} profileRootDirectory - The profiles root directory to obtain all profiles from.
     * @returns {string[]} - The list of profiles returned or a blank array
     * @memberof V1ProfileConversion
     */
    public static getAllProfileDirectories(profileRootDirectory: string): string[] {
        V1ProfileConversion.crashInTeamConfigMode();

        let names: string[] = [];
        try {
            names = fs.readdirSync(profileRootDirectory);
            names = names.filter((name) => {
                // only return directories, not files
                const stats = fs.statSync(pathPackage.join(profileRootDirectory, name));
                return stats.isDirectory();
            });
        } catch (e) {
            throw new ImperativeError({
                msg: `An error occurred attempting to read all profile directories from "${profileRootDirectory}". ` +
                    `Error Details: ${e.message}`,
                additionalDetails: e
            }, {tag: V1ProfileConversion.ERROR_ID});
        }
        return names;
    }

    /**
     * Accepts the profile directory location for a type, reads all filenames, and returns a list of
     * profile names that are present within the directory (excluding the meta profile)
     * @static
     * @param {string} profileTypeDir - The directory for the type
     * @param {string} ext - the extension for the profile files (normally YAML)
     * @param {string} metaNameForType - the meta name for this type
     * @returns {string[]} - A list of all profile names (without path/ext)
     * @memberof V1ProfileConversion
     */
    public static getAllProfileNames(profileTypeDir: string, ext: string, metaNameForType: string): string[] {
        V1ProfileConversion.crashInTeamConfigMode();

        const names: string[] = [];
        try {
            let profileFiles = fs.readdirSync(profileTypeDir);
            profileFiles = profileFiles.filter((file) => {
                const fullFile = pathPackage.resolve(profileTypeDir, file);
                const isYamlFile = fullFile.length > ext.length && fullFile.substring(
                    fullFile.length - ext.length) === ext;
                return isYamlFile && V1ProfileConversion.fileToProfileName(fullFile, ext) !== metaNameForType;
            });
            for (const file of profileFiles) {
                names.push(V1ProfileConversion.fileToProfileName(file, ext));
            }
        } catch (e) {
            throw new ImperativeError({
                msg: `An error occurred attempting to read all profile names from "${profileTypeDir}". ` +
                    `Error Details: ${e.message}`,
                additionalDetails: e
            }, {tag: V1ProfileConversion.ERROR_ID});
        }
        return names;
    }

    /**
     * Read a profile from disk. Profiles are always assumed to be YAML (YAML "safeLoad" is invoked to perform the load).
     * @static
     * @param {string} filePath - Path to the profile.
     * @param {string} type - The profile type; used to populate the "type" in the profile object (type property not persisted on disk).
     * @returns {IProfile} - The profile object.
     * @memberof V1ProfileConversion
     */
    public static readProfileFile(filePath: string, type: string): IProfile {
        V1ProfileConversion.crashInTeamConfigMode();

        let profile: IProfile;
        try {
            profile = readYaml.load(fs.readFileSync(filePath, "utf8"));
        } catch (err) {
            throw new ImperativeError({
                msg: `Error reading profile file ("${filePath}"). Error Details: ${err.message}`,
                additionalDetails: err
            }, {tag: V1ProfileConversion.ERROR_ID});
        }
        return profile;
    }

    /**
     * Crash if we detect that we are running in team-config mode.
     * You should not be able to operate on old-school profiles
     * when you are in team-config mode. Give a meaningful
     * message as part of our crash.
     */
    private static crashInTeamConfigMode() {
        if (ImperativeConfig.instance.config?.exists) {
            try {
                throw new Error(
                    "Attempted to convert a Zowe V1 profile when a newer Zowe client configuration already exists."
                );
            } catch (err) {
                throw new ImperativeError({
                    msg: err.message,
                    additionalDetails: err.stack,
                }, {tag: V1ProfileConversion.ERROR_ID});
            }
        }
    }

    /**
     * Extracts the profile name from the file path/name
     * @static
     * @param {string} file - the file path to extract the profile name
     * @param {string} ext - the extension of the file
     * @returns {string} - the profile name
     * @memberof V1ProfileConversion
     */
    private static fileToProfileName(file: string, ext: string): string {
        file = pathPackage.basename(file);
        return file.substring(0, file.lastIndexOf(ext));
    }

    /**
     * Error IO tag for Imperative Errors
     * @private
     * @static
     * @type {string}
     * @memberof V1ProfileConversion
     */
    private static ERROR_ID: string = "V1ProfileConversion Read Error";
}
