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
import * as pathPackage from "path";

import { ImperativeError } from "../../error/ImperativeError";
import { ImperativeConfig } from "../../utils/ImperativeConfig";
import { IProfile } from "../doc/definition/IProfile";
import { IMetaProfile } from "../doc/definition/IMetaProfile";
import { IO } from "../../io/IO";
import { IProfileTypeConfiguration } from "../doc/config/IProfileTypeConfiguration";

const readYaml = require("js-yaml");
const writeYaml = require("yamljs");

/**
 * Profile IO methods for writing/reading profiles to disk. The profile managers never invoke "fs" directly.
 * All "fs" calls are wrapped here and errors are transformed to ImperativeError for error handling/flow throughout
 * Imperative.
 *
 * @export
 * @class ProfileIO
 */
export class ProfileIO {
    /**
     * The yamljs package requires you to indicate the depth for conversion to yaml. Set to max of 9999.
     * @static
     * @type {number}
     * @memberof ProfileIO
     */
    public static readonly MAX_YAML_DEPTH: number = 9999;

    /**
     * Creates the full set of directories indicated by the path. Used to create the profile root directory and
     * type directories.
     * @static
     * @param {string} path - The directory path to create - creates all necessary subdirectories.
     * @memberof ProfileIO
     */
    public static createProfileDirs(path: string) {
        ProfileIO.crashInTeamConfigMode();
        try {
            IO.createDirsSync(path);
        } catch (err) {
            throw new ImperativeError({
                msg: `An error occurred creating profile directory: "${path}". ` +
                    `Error Details: ${err.message}`,
                additionalDetails: err
            }, {tag: ProfileIO.ERROR_ID});
        }
    }

    /**
     * Read the profile meta file using Yaml "safeLoad" (ensures that no code executes, etc. during the load). The
     * meta profile file for a type contains the default profile specification. The meta profile is ALWAYS in YAML
     * format (controlled exclusively by the Imperative framework).
     * @static
     * @param {string} path - The path to the meta profile
     * @returns {IMetaProfile} - The meta profile
     * @memberof ProfileIO
     */
    public static readMetaFile<T extends IProfileTypeConfiguration>(path: string): IMetaProfile<T> {
        ProfileIO.crashInTeamConfigMode();

        let meta: IMetaProfile<T>;
        try {
            meta = readYaml.load(fs.readFileSync(path), "utf8");
        } catch (err) {
            throw new ImperativeError({
                msg: `Error reading profile file ("${path}"). Error Details: ${err.message}`,
                additionalDetails: err
            }, {tag: ProfileIO.ERROR_ID});
        }
        return meta;
    }

    /**
     * Accepts a profile object and writes the profile to the specified location (and optionally converts
     * the profile to YAML format - the default for Imperative profiles).
     * @static
     * @param {string} fullFilePath - the fully qualified profile path, file, & extension.
     * @param {IProfile} profile - the profile object to write to disk.
     * @memberof ProfileIO
     */
    public static writeProfile(fullFilePath: string, profile: IProfile): void {
        ProfileIO.crashInTeamConfigMode();

        try {
            /**
             * Write the YAML file - clone the object first and remove the name. Imperative will not persist the
             * name within the profile (but needs it when loading/using).
             */
            const profileCopy = JSON.parse(JSON.stringify(profile));
            delete profileCopy.name;

            /**
             * If yaml = true, we will attempt to convert to yaml format before persisting.
             */
            const writeProfile: any = writeYaml.stringify(profileCopy, ProfileIO.MAX_YAML_DEPTH);

            /**
             * Attempt to write the profile - always encoded in utf-8
             */
            fs.writeFileSync(fullFilePath, writeProfile, {encoding: "utf8"});
        } catch (err) {
            throw new ImperativeError({
                msg: `Profile IO Error: Error creating profile file ("${fullFilePath}"). Error Details: ${err.message}`,
                additionalDetails: err.message
            });
        }
    }

    /**
     * Delete the profile and ensure it is gone.
     * @static
     * @param {string} name - the profile object - really only used for error messages
     * @param {string} fullFilePath - the full file path to delete
     * @memberof ProfileIO
     */
    public static deleteProfile(name: string, fullFilePath: string) {
        ProfileIO.crashInTeamConfigMode();

        try {
            /**
             * Attempt to remove the file and ensure that it was removed successfully
             */
            fs.unlinkSync(fullFilePath);
            if (fs.existsSync(fullFilePath)) {
                const errorMsg: string = `The profile ${name} was unable to be deleted. ` +
                    `Please check the path indicated here and try to remove the profile manually: ${fullFilePath}`;
                throw new ImperativeError({
                    msg: errorMsg
                }, {tag: ProfileIO.ERROR_ID});
            }
        } catch (deleteErr) {
            /**
             * If an error occurred, rethrow if already instance of ImperativeError OR transform and throw
             */
            if (deleteErr instanceof ImperativeError) {
                throw deleteErr;
            } else {
                throw new ImperativeError({
                    msg: `An unexpected profile delete error occurred for profile "${name}". ` +
                        `Error Details: ${deleteErr.message}.`,
                    additionalDetails: deleteErr
                }, {tag: ProfileIO.ERROR_ID});
            }
        }
    }

    /**
     * Checks if the file specified exists.
     * @static
     * @param {string} path - The file path
     * @returns {string} - the path to the existing file or undefined if not found
     * @memberof ProfileIO
     */
    public static exists(path: string): string {
        ProfileIO.crashInTeamConfigMode();

        let found: string;
        try {
            found = (fs.existsSync(path)) ? path : undefined;
        } catch (e) {
            throw new ImperativeError({
                msg: `An error occurred checking for the existance of "${path}". Error Details: ${e.message}`,
                additionalDetails: e
            }, {tag: ProfileIO.ERROR_ID});
        }
        return found;
    }

    /**
     * Converts the meta to yaml and writes to disk
     * @static
     * @param {IMetaProfile} meta - The meta profile contents to write to disk
     * @param {string} path - The path to the meta profile
     * @memberof ProfileIO
     */
    public static writeMetaFile(meta: IMetaProfile<IProfileTypeConfiguration>, path: string) {
        ProfileIO.crashInTeamConfigMode();

        try {
            const yamlString: any = writeYaml.stringify(meta, ProfileIO.MAX_YAML_DEPTH);
            fs.writeFileSync(path, yamlString, {encoding: "utf8"});
        } catch (e) {
            throw new ImperativeError({
                msg: `An error occurred converting and writing the meta profile to "${path}". ` +
                    `Error Details: ${e.message}`,
                additionalDetails: e
            }, {tag: ProfileIO.ERROR_ID});
        }
    }

    /**
     * Extracts the profile name from the file path/name
     * @static
     * @param {string} file - the file path to extract the profile name
     * @param {string} ext - the extension of the file
     * @returns {string} - the profile name
     * @memberof ProfileIO
     */
    public static fileToProfileName(file: string, ext: string): string {
        ProfileIO.crashInTeamConfigMode();

        file = pathPackage.basename(file);
        return file.substring(0, file.lastIndexOf(ext));
    }

    /**
     * Accepts the profiles root directory and returns all directories within. The directories within the root
     * directory are all assumed to be profile type directories (potentially containing a meta file and profiles
     * of that type).
     * @static
     * @param {string} profileRootDirectory - The profiles root directory to obtain all profiles from.
     * @returns {string[]} - The list of profiles returned or a blank array
     * @memberof ProfileIO
     */
    public static getAllProfileDirectories(profileRootDirectory: string): string[] {
        ProfileIO.crashInTeamConfigMode();

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
            }, {tag: ProfileIO.ERROR_ID});
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
     * @memberof ProfileIO
     */
    public static getAllProfileNames(profileTypeDir: string, ext: string, metaNameForType: string): string[] {
        ProfileIO.crashInTeamConfigMode();

        const names: string[] = [];
        try {
            let profileFiles = fs.readdirSync(profileTypeDir);
            profileFiles = profileFiles.filter((file) => {
                const fullFile = pathPackage.resolve(profileTypeDir, file);
                const isYamlFile = fullFile.length > ext.length && fullFile.substring(
                    fullFile.length - ext.length) === ext;
                return isYamlFile && ProfileIO.fileToProfileName(fullFile, ext) !== metaNameForType;
            });
            for (const file of profileFiles) {
                names.push(ProfileIO.fileToProfileName(file, ext));
            }
        } catch (e) {
            throw new ImperativeError({
                msg: `An error occurred attempting to read all profile names from "${profileTypeDir}". ` +
                    `Error Details: ${e.message}`,
                additionalDetails: e
            }, {tag: ProfileIO.ERROR_ID});
        }
        return names;
    }

    /**
     * Read a profile from disk. Profiles are always assumed to be YAML (YAML "safeLoad" is invoked to perform the load).
     * @static
     * @param {string} filePath - Path to the profile.
     * @param {string} type - The profile type; used to populate the "type" in the profile object (type property not persisted on disk).
     * @returns {IProfile} - The profile object.
     * @memberof ProfileIO
     */
    public static readProfileFile(filePath: string, type: string): IProfile {
        ProfileIO.crashInTeamConfigMode();

        let profile: IProfile;
        try {
            profile = readYaml.load(fs.readFileSync(filePath, "utf8"));
        } catch (err) {
            throw new ImperativeError({
                msg: `Error reading profile file ("${filePath}"). Error Details: ${err.message}`,
                additionalDetails: err
            }, {tag: ProfileIO.ERROR_ID});
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
                throw new Error("A Zowe V1 profile operation was attempted with a Zowe V2 configuration in use.");
            } catch (err) {
                throw new ImperativeError({
                    msg: err.message,
                    additionalDetails: err.stack,
                }, {tag: ProfileIO.ERROR_ID});
            }
        }
    }

    /**
     * Error IO tag for Imperative Errors
     * @private
     * @static
     * @type {string}
     * @memberof ProfileIO
     */
    private static ERROR_ID: string = "Profile IO Error";
}
