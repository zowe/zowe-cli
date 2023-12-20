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
import * as os from "os";
import * as path from "path";
import * as url from "url";
import * as jsonfile from "jsonfile";
import * as lodash from "lodash";
import * as semver from "semver";

// for ProfileInfo structures
import { IProfArgAttrs } from "./doc/IProfArgAttrs";
import { IProfAttrs } from "./doc/IProfAttrs";
import { IArgTeamConfigLoc, IProfLoc, IProfLocOsLoc, IProfLocOsLocLayer, ProfLocType } from "./doc/IProfLoc";
import { IProfMergeArgOpts } from "./doc/IProfMergeArgOpts";
import { IProfMergedArg } from "./doc/IProfMergedArg";
import { IConfigSchema } from "./doc/IConfigSchema";
import { IProfOpts } from "./doc/IProfOpts";
import { ProfileCredentials } from "./ProfileCredentials";
import { ProfInfoErr } from "./ProfInfoErr";

// for team config functions
import { Config } from "./Config";
import { ConfigSchema } from "./ConfigSchema";
import { IConfigOpts } from "./doc/IConfigOpts";

// for old-school profile operations
import { AbstractProfileManager } from "../../profiles/src/abstract/AbstractProfileManager";
import { CliProfileManager, ICommandProfileProperty, ICommandArguments } from "../../cmd";
import { IProfileLoaded, IProfileSchema, ProfileIO } from "../../profiles";

// for imperative operations
import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import { LoggingConfigurer } from "../../imperative/src/LoggingConfigurer";
import { CliUtils, ImperativeConfig } from "../../utilities";
import { ImperativeExpect } from "../../expect";
import { Logger, LoggerUtils } from "../../logger";
import { LoggerManager } from "../../logger/src/LoggerManager";
import {
    IOptionsForAddConnProps, ISession, Session, SessConstants, ConnectionPropsForSessCfg
} from "../../rest";
import { IProfInfoUpdateKnownPropOpts, IProfInfoUpdatePropOpts } from "./doc/IProfInfoUpdatePropOpts";
import { ConfigAutoStore } from "./ConfigAutoStore";
import { IGetAllProfilesOptions } from "./doc/IProfInfoProps";
import { IConfig } from "./doc/IConfig";
import { IProfInfoRemoveKnownPropOpts } from "./doc/IProfInfoRemoveKnownPropOpts";
import { ConfigBuilder } from "./ConfigBuilder";

export type ExtenderJson = {
    profileTypes: Record<string, {
        from: string[];
        version?: string;
    }>;
};

export type AddProfToSchemaResult = {
    success: boolean;
    info: string;
};

/**
 * This class provides functions to retrieve profile-related information.
 * It can load the relevant configuration files, merge all possible
 * profile argument values using the Zowe order-of-precedence, and
 * access desired profile attributes from the Zowe configuration settings.
 *
 * Pseudocode examples:
 * <pre>
 *    // Construct a new object. Use it to read the profiles from disk.
 *    // ProfileInfo functions throw a ProfInfoErr exception for errors.
 *    // You can catch those errors and test the errorCode for known
 *    // values. We are only showing the try/catch on the function
 *    // below, but it applies to any ProfileInfo function.
 *    profInfo = new ProfileInfo("zowe");
 *    try {
 *        await profInfo.readProfilesFromDisk();
 *    } catch(err) {
 *        if (err instanceof ProfInfoErr) {
 *            if (err.errcode == ProfInfoErr.CANT_GET_SCHEMA_URL) {
 *                youTakeAnAlternateAction();
 *            } else {
 *                // report the error
 *            }
 *        } else {
 *            // handle other exceptions
 *        }
 *    }
 *
 *    // Maybe you want the list of all zosmf profiles
 *    let arrayOfProfiles = profInfo.getAllProfiles("zosmf");
 *    youDisplayTheListOfProfiles(arrayOfProfiles);
 *
 *    // Maybe you want the default zosmf profile
 *    let zosmfProfile = profInfo.getDefaultProfile("zosmf");
 *    youUseTheProfile(zosmfProfile);
 *
 *    // Maybe you want the arg values for the default JCLCheck profile
 *    let jckProfile = profInfo.getDefaultProfile("jclcheck");
 *    let jckMergedArgs = profInfo.mergeArgsForProfile(jckProfile);
 *    let jckFinalArgs = youPromptForMissingArgsAndCombineWithKnownArgs(
 *        jckMergedArgs.knownArgs, jckMergedArgs.missingArgs
 *    );
 *    youRunJclCheck(jckFinalArgs);
 *
 *    // Maybe no profile of type "zosmf" even exists.
 *    let zosmfProfiles = profInfo.getAllProfiles("zosmf");
 *    if (zosmfProfiles.length == 0) {
 *        // No zosmf profile exists
 *        // Merge any required arg values for the zosmf profile type
 *        let zosmfMergedArgs =
 *            profInfo.mergeArgsForProfileType("zosmf");
 *
 *        // Values of secure arguments must be loaded separately. You can
 *        // freely log the contents of zosmfMergedArgs without leaking secure
 *        // argument values, until they are loaded with the lines below.
 *        zosmfMergedArgs.knownArgs.forEach((arg) => {
 *            if (arg.secure) arg.argValue = profInfo.loadSecureArg(arg);
 *        });
 *
 *        let finalZosmfArgs =
 *            youPromptForMissingArgsAndCombineWithKnownArgs(
 *                zosmfMergedArgs.knownArgs,
 *                zosmfMergedArgs.missingArgs
 *            );
 *        youRunSomeZosmfCommand(finalZosmfArgs);
 *    }
 *
 *    // So you want to write to a config file? You must use your own
 *    // old-school techniques to write to old-school profiles.
 *    // You then use alternate logic for a team config.
 *    // You must use the Config API to write to a team configuration.
 *    // See the Config class documentation for functions to set
 *    // and save team config arguments.
 *
 *    // Let's save some zosmf arguments from the example above.
 *    let yourZosmfArgsToWrite: IProfArgAttrs =
 *        youSetValuesToOverwrite(
 *            zosmfMergedArgs.knownArgs, zosmfMergedArgs.missingArgs
 *        );
 *    if (profInfo.usingTeamConfig {
 *        let configObj: Config = profInfo.getTeamConfig();
 *        youWriteArgValuesUsingConfigObj(
 *            configObj, yourZosmfArgsToWrite
 *        );
 *    } else {
 *        youWriteOldSchoolProfiles(yourZosmfArgsToWrite);
 *    }
 * </pre>
 */
export class ProfileInfo {
    private mLoadedConfig: Config = null;
    private mUsingTeamConfig: boolean = false;
    private mAppName: string = null;
    private mImpLogger: Logger = null;
    private mOldSchoolProfileCache: IProfileLoaded[] = null;
    private mOldSchoolProfileRootDir: string = null;
    private mOldSchoolProfileDefaults: { [key: string]: string } = null;
    private mOldSchoolProfileTypes: string[];
    private mOverrideWithEnv: boolean = false;
    /**
     * Cache of profile schema objects mapped by profile type and config path
     * if applicable. Examples of map keys:
     *  - For team config: "/root/.zowe/zowe.config.json:zosmf"
     *  - For old profiles: "zosmf"
     */
    private mProfileSchemaCache: Map<string, IProfileSchema>;
    private mCredentials: ProfileCredentials;

    private mExtendersJson: ExtenderJson;

    // _______________________________________________________________________
    /**
     * Constructor for ProfileInfo class.
     *
     * @param appName
     *        The name of the application (like "zowe" in zowe.config.json)
     *        whose configuration you want to access.
     *
     * @param profInfoOpts
     *        Options that will control the behavior of ProfileInfo.
     */
    public constructor(appName: string, profInfoOpts?: IProfOpts) {
        this.mAppName = appName;

        // use any supplied environment override setting
        if (profInfoOpts?.overrideWithEnv) {
            this.mOverrideWithEnv = profInfoOpts.overrideWithEnv;
        }

        this.mCredentials = new ProfileCredentials(this, profInfoOpts?.requireKeytar ?? profInfoOpts);

        // do enough Imperative stuff to let imperative utilities work
        this.initImpUtils();
    }

    /**
     * Update a given property regardless of whether it's found in the config file or not
     * This function supports v1 profiles
     * @param options Set of options needed to update a given property
     */
    public async updateProperty(options: IProfInfoUpdatePropOpts): Promise<void> {
        this.ensureReadFromDisk();
        const desiredProfile = this.getAllProfiles(options.profileType).find(v => v.profName === options.profileName);
        if (desiredProfile == null) {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.PROF_NOT_FOUND,
                msg: `Failed to find profile ${options.profileName} of type ${options.profileType}`
            });
        }

        const mergedArgs = this.mergeArgsForProfile(desiredProfile, { getSecureVals: false });
        if (options.forceUpdate && this.usingTeamConfig) {
            const knownProperty = mergedArgs.knownArgs.find((v => v.argName === options.property));
            const profPath = this.getTeamConfig().api.profiles.getProfilePathFromName(options.profileName);
            if (!knownProperty?.argLoc.jsonLoc.startsWith(profPath)) {
                knownProperty.argLoc.jsonLoc = `${profPath}.properties.${options.property}`;
            }
        }
        if (!(await this.updateKnownProperty({ ...options, mergedArgs, osLocInfo: this.getOsLocInfo(desiredProfile)?.[0] }))) {
            if (this.usingTeamConfig) {
                // Check to see if loadedConfig already contains the schema for the specified profile type
                if (ImperativeConfig.instance.loadedConfig?.profiles?.find(p => p.type === options.profileType)?.schema == null ||
                    ImperativeConfig.instance.loadedConfig?.baseProfile?.schema == null) {

                    const loadedConfig = ImperativeConfig.instance.loadedConfig;
                    if (!loadedConfig.profiles) loadedConfig.profiles = [];
                    this.mProfileSchemaCache.forEach((value: IProfileSchema, key: string) => {
                        if (key.indexOf(":base") > 0 && loadedConfig.baseProfile == null) {
                            loadedConfig.baseProfile = { type: "base", schema: value };
                        } else if (key.indexOf(":base") < 0 && !loadedConfig.profiles.find(p => p.type === key.split(":")[1])) {
                            // Add the schema corresponding to the given profile type
                            loadedConfig.profiles.push({ type: key.split(":")[1], schema: value });
                        }
                    });
                    ImperativeConfig.instance.loadedConfig = loadedConfig;
                }

                await ConfigAutoStore._storeSessCfgProps({
                    config: this.mLoadedConfig,
                    defaultBaseProfileName: this.mLoadedConfig?.mProperties.defaults.base,
                    sessCfg: {
                        [options.property === "host" ? "hostname" : options.property]: options.value
                    },
                    propsToStore: [options.property],
                    profileName: options.profileName,
                    profileType: options.profileType,
                    setSecure: options.setSecure
                });
            } else {
                const profMgr = new CliProfileManager({ profileRootDirectory: this.mOldSchoolProfileRootDir, type: options.profileType });
                // Add new property
                await profMgr.update({ name: options.profileName, merge: true, profile: { [options.property]: options.value } });

                // Update mOldSchoolProfileCache to get mergedArgs updated
                this.mOldSchoolProfileCache.find(v => v.name === options.profileName).profile[options.property] = options.value;
            }
        }
    }

    /**
     * Update a given property with the value provided.
     * This function only works for properties that can be found in the config files (including secure arrays).
     * If the property cannot be found, this function will resolve to false
     * This function supports v1 profiles
     * @param options Set of options required to update a known property
     */
    public async updateKnownProperty(options: IProfInfoUpdateKnownPropOpts): Promise<boolean> {
        this.ensureReadFromDisk();
        const toUpdate = options.mergedArgs.knownArgs.find((v => v.argName === options.property)) ||
            options.mergedArgs.missingArgs.find((v => v.argName === options.property));

        if (toUpdate == null || (toUpdate.argLoc.locType === ProfLocType.TEAM_CONFIG && !this.getTeamConfig().mProperties.autoStore)) {
            return false;
        }

        switch (toUpdate.argLoc.locType) {
            case ProfLocType.OLD_PROFILE: {
                const filePath = toUpdate.argLoc.osLoc;
                const profileName = ProfileIO.fileToProfileName(filePath[0], "." + filePath[0].split(".").slice(-1)[0]);
                const profileType = filePath[0].substring(this.mOldSchoolProfileRootDir.length + 1).split(path.sep)[0];
                const profMgr = new CliProfileManager({ profileRootDirectory: this.mOldSchoolProfileRootDir, type: profileType });
                if (options.value !== undefined) {
                    await profMgr.update({ name: profileName, merge: true, profile: { [options.property]: options.value } });
                } else {
                    // Remove existing property (or don't do anything)
                    const oldProf = await profMgr.load({ name: profileName, failNotFound: false });
                    if (oldProf && oldProf.profile && oldProf.profile[options.property]) {
                        delete oldProf.profile[options.property];
                        await profMgr.save({ name: profileName, profile: oldProf.profile, overwrite: true, type: profileType });
                    }
                }

                // Update mOldSchoolProfileCache to get mergedArgs updated
                const profile = this.mOldSchoolProfileCache.find(v => v.name === profileName);
                if (profile != null) profile.profile[options.property] = options.value; // What should we do in the else case?
                break;
            }
            case ProfLocType.TEAM_CONFIG: {
                let oldLayer: IProfLocOsLocLayer;
                const layer = this.getTeamConfig().layerActive();
                const osLoc = options.osLocInfo ?? this.getOsLocInfo(
                    this.getAllProfiles().find(p => toUpdate.argLoc.jsonLoc.startsWith(p.profLoc.jsonLoc)))?.[0];
                if (osLoc && (layer.user !== osLoc.user || layer.global !== osLoc.global)) {
                    oldLayer = { user: layer.user, global: layer.global };
                    this.getTeamConfig().api.layers.activate(osLoc.user, osLoc.global);
                }

                this.getTeamConfig().set(toUpdate.argLoc.jsonLoc, options.value, { secure: options.setSecure });
                await this.getTeamConfig().save(false);

                if (oldLayer) {
                    this.getTeamConfig().api.layers.activate(oldLayer.user, oldLayer.global);
                }
                break;
            }
            case ProfLocType.ENV:
            case ProfLocType.DEFAULT:
                return false;
            default: {
                throw new ProfInfoErr({
                    errorCode: ProfInfoErr.INVALID_PROF_LOC_TYPE,
                    msg: "Invalid profile location type: " + toUpdate.argLoc.locType
                });
            }
        }
        return true;
    }

    /**
     * Remove a known property from the ProfileInfo class
     * This method will call the updateKnownProperty method with a value set to `undefined` and serves as a helper function
     * to make is easier to understand when a known property is removed.
     * @example
     * The example below describes how to remove a property
     * ```
     *     // Using the removeKnownProperty method
     *     profileInfo.removeKnownProperty({mergedArgs, property: "someProperty"});
     *     // Using the updateKnownProperty method
     *     profileInfo.updateKnownProperty({mergedArgs, property: "someProperty", value: undefined, isSecure: false});
     * ```
     * @param options Set of options required to remove a known property
     * @returns Returns a boolean indicating if the property has been removed
     */
    public removeKnownProperty(options: IProfInfoRemoveKnownPropOpts): Promise<boolean> {
        const updatePropertyOptions: IProfInfoUpdateKnownPropOpts = {
            mergedArgs: options.mergedArgs,
            property: options.property,
            value: undefined,
            setSecure: false,
            osLocInfo: options.osLocInfo
        };

        return this.updateKnownProperty(updatePropertyOptions);
    }

    // _______________________________________________________________________
    /**
     * Get all of the typed profiles in the configuration.
     *
     * @param profileType
     *        Limit selection to only profiles of the specified type.
     *        If not supplied, the names of all typed profiles are returned.
     *
     * @returns An array of profile attribute objects.
     *          In addition to the name, you get the profile type,
     *          an indicator of whether the profile is the default profile
     *          for that type, and the location of that profile.
     *
     *          If no profile exists for the specified type (or if
     *          no profiles of any kind exist), we return an empty array
     *          ie, length is zero.
     */
    public getAllProfiles(profileType?: string, options?: IGetAllProfilesOptions): IProfAttrs[] {
        this.ensureReadFromDisk();
        const profiles: IProfAttrs[] = [];

        // Do we have team config profiles?
        if (this.mUsingTeamConfig) {
            const teamConfigProfs = this.mLoadedConfig.layerMerge({ maskSecure: true, excludeGlobalLayer: options?.excludeHomeDir }).profiles;
            // Iterate over them
            for (const prof in teamConfigProfs) {
                // Check if the profile has a type
                if (teamConfigProfs[prof].type && (profileType == null || teamConfigProfs[prof].type === profileType)) {
                    const jsonLocation: string = "profiles." + prof;
                    const teamOsLocation: string[] = this.findTeamOsLocation(jsonLocation, options?.excludeHomeDir);
                    const profAttrs: IProfAttrs = {
                        profName: prof,
                        profType: teamConfigProfs[prof].type,
                        isDefaultProfile: this.isDefaultTeamProfile(prof, profileType),
                        profLoc: {
                            locType: ProfLocType.TEAM_CONFIG,
                            osLoc: teamOsLocation,
                            jsonLoc: jsonLocation
                        }
                    };
                    profiles.push(profAttrs);
                }
                // Check for subprofiles
                if (teamConfigProfs[prof].profiles) {
                    // Get the subprofiles and add to profiles list
                    const jsonPath = "profiles." + prof;
                    const subProfiles: IProfAttrs[] = this.getTeamSubProfiles(prof, jsonPath, teamConfigProfs[prof].profiles, profileType);
                    for (const subProfile of subProfiles) {
                        profiles.push(subProfile);
                    }
                }
            }
        } else {
            for (const loadedProfile of this.mOldSchoolProfileCache) {
                if (!profileType || profileType === loadedProfile.type) {
                    const typeDefaultProfile = this.getDefaultProfile(loadedProfile.type);
                    let defaultProfile = false;
                    if (typeDefaultProfile && typeDefaultProfile.profName === loadedProfile.name) { defaultProfile = true; }
                    profiles.push({
                        profName: loadedProfile.name,
                        profType: loadedProfile.type,
                        isDefaultProfile: defaultProfile,
                        profLoc: {
                            locType: ProfLocType.OLD_PROFILE,
                            osLoc: [this.oldProfileFilePath(loadedProfile.type, loadedProfile.name)],
                            jsonLoc: undefined
                        }
                    });
                }
            }
        }
        return profiles;
    }

    // _______________________________________________________________________
    /**
     * Get the default profile for the specified profile type.
     *
     * @param profileType
     *        The type of profile of interest.
     *
     * @returns The default profile. If no profile exists
     *          for the specified type, we return null;
     */
    public getDefaultProfile(profileType: string): IProfAttrs | null {
        this.ensureReadFromDisk();

        const defaultProfile: IProfAttrs = {
            profName: null,
            profType: profileType,
            isDefaultProfile: true,
            profLoc: {
                locType: null
            }
        };

        if (this.usingTeamConfig) {
            // get default profile name from the team config
            const configProperties = this.mLoadedConfig.mProperties;
            if (!Object.prototype.hasOwnProperty.call(configProperties.defaults, profileType)) {
                // no default exists for the requested type
                this.mImpLogger.warn("Found no profile of type '" +
                    profileType + "' in team config."
                );
                return null;
            }

            // extract info from the underlying team config
            const foundProfNm = configProperties.defaults[profileType];

            // for a team config, we use the last node of the jsonLoc as the name
            const foundJson = this.mLoadedConfig.api.profiles.getProfilePathFromName(foundProfNm);
            const teamOsLocation: string[] = this.findTeamOsLocation(foundJson);

            // assign the required poperties to defaultProfile
            defaultProfile.profName = foundProfNm;
            defaultProfile.profLoc = {
                locType: ProfLocType.TEAM_CONFIG,
                osLoc: teamOsLocation,
                jsonLoc: foundJson
            };
        } else {
            // get default profile from the old-school profiles
            // first, some validation
            if (!this.mOldSchoolProfileCache || this.mOldSchoolProfileCache.length === 0) {
                // No old school profiles in the cache - warn and return null
                this.mImpLogger.warn("Found no old-school profiles.");
                return null;
            }
            if (!this.mOldSchoolProfileDefaults || Object.keys(this.mOldSchoolProfileDefaults).length === 0) {
                // No old-school default profiles found - warn and return null
                this.mImpLogger.warn("Found no default old-school profiles.");
                return null;
            }

            const profName = this.mOldSchoolProfileDefaults[profileType];
            if (!profName) {
                // No old-school default profile of this type - warn and return null
                this.mImpLogger.warn("Found no old-school profile for type '" + profileType + "'.");
                return null;
            }

            const loadedProfile = this.mOldSchoolProfileCache.find(obj => {
                return obj.name === profName && obj.type === profileType;
            });
            if (!loadedProfile) {
                // Something really weird happened
                this.mImpLogger.warn(`Profile with name '${profName}' was defined as the default profile for type '${profileType}' but was missing ` +
                    `from the cache.`);
                return null;
            }

            ImperativeExpect.toBeEqual(loadedProfile.type, profileType);

            // assign the required properties to defaultProfile
            defaultProfile.profName = loadedProfile.name;
            defaultProfile.profLoc = {
                locType: ProfLocType.OLD_PROFILE,
                osLoc: [this.oldProfileFilePath(profileType, loadedProfile.name)]
            };
        }
        return defaultProfile;
    }

    // _______________________________________________________________________
    /**
     * Get the Config object used to manipulate the team configuration on disk.
     *
     * Our current market direction is to encourage customers to edit the
     * team configuration files in their favorite text editor.
     *
     * If you must ignore this recommended practice, you must use the Config
     * class to manipulate the team config files. This class has a more detailed
     * and therefore more complicated API, but it does contain functions to
     * write data to the team configuration files.
     *
     * You must call ProfileInfo.readProfilesFromDisk() before calling this function.
     *
     * @returns An instance of the Config class that can be used to manipulate
     *          the team configuration on disk.
     */
    public getTeamConfig(): Config {
        this.ensureReadFromDisk();
        return this.mLoadedConfig;
    }

    // _______________________________________________________________________
    /**
     * Helper function to identify if the existing config is secure or not
     * @returns true if the teamConfig is storing credentials securely, false otherwise
     */
    public isSecured(): boolean {
        return this.mCredentials?.isSecured ?? true;
    }

    // _______________________________________________________________________
    /**
     * Create a session from profile arguments that have been retrieved from
     * ProfileInfo functions.
     *
     * @param profArgs
     *      An array of profile arguments.
     *
     * @param connOpts
     *      Options that alter our actions. See IOptionsForAddConnProps.
     *      The connOpts parameter need not be supplied.
     *      Default properties may be added to any supplied connOpts.
     *      The only option values used by this function are:
     *          connOpts.requestToken
     *          connOpts.defaultTokenType
     *
     * @returns A session that can be used to connect to a remote host.
     */
    public static createSession(
        profArgs: IProfArgAttrs[],
        connOpts: IOptionsForAddConnProps = {}
    ): Session {
        // Initialize a session config with values from profile arguments
        const sessCfg: ISession = ProfileInfo.initSessCfg(profArgs,
            ["rejectUnauthorized", "basePath", "protocol"]);

        // Populate command arguments object with arguments to be resolved
        const cmdArgs: ICommandArguments = { $0: "", _: [] };
        for (const { argName, argValue } of profArgs) {
            cmdArgs[argName] = argValue;
        }

        // resolve the choices among various session config properties
        ConnectionPropsForSessCfg.resolveSessCfgProps(sessCfg, cmdArgs, connOpts);

        return new Session(sessCfg);
    }

    // _______________________________________________________________________
    /**
     * Merge all of the available values for arguments defined for the
     * specified profile. Values are retrieved from the following sources.
     * Each successive source will override the previous source.
     * - A default value for the argument that is defined in the profile definition.
     * - A value defined in the base profile.
     * - A value defined in the specified service profile.
     * - For a team configuration, both the base profile values and the
     *   service profile values will be overridden with values from a
     *   zowe.config.user.json file (if it exists).
     * - An environment variable for that argument (if environment overrides
     *   are enabled).
     *
     * @param profile
     *        The profile whose arguments are to be merged.
     *
     * @param mergeOpts
     *        Options to use when merging arguments.
     *        This parameter is not required. Defaults will be used.
     *
     * @returns An object that contains an array of known profile argument
     *          values and an array of required profile arguments which
     *          have no value assigned. Either of the two arrays could be
     *          of zero length, depending on the user's configuration and
     *          environment.
     *
     *          We will return null if the profile does not exist
     *          in the current Zowe configuration.
     */
    public mergeArgsForProfile(
        profile: IProfAttrs,
        mergeOpts: IProfMergeArgOpts = { getSecureVals: false }
    ): IProfMergedArg {
        this.ensureReadFromDisk();
        ImperativeExpect.toNotBeNullOrUndefined(profile, "Profile attributes must be defined");

        const mergedArgs: IProfMergedArg = {
            knownArgs: [],
            missingArgs: []
        };
        let configProperties: IConfig;

        const osLocInfo = this.getOsLocInfo(profile)?.[0];
        if (profile.profLoc.locType === ProfLocType.TEAM_CONFIG) {
            configProperties = this.mLoadedConfig.mProperties;
            if (profile.profName != null) {
                // Load args from service profile if one exists
                const serviceProfile = this.mLoadedConfig.api.profiles.get(profile.profName, false);
                for (const [propName, propVal] of Object.entries(serviceProfile)) {
                    const [argLoc, secure] = this.argTeamConfigLoc({ profileName: profile.profName, propName, osLocInfo, configProperties });
                    mergedArgs.knownArgs.push({
                        argName: CliUtils.getOptionFormat(propName).camelCase,
                        dataType: this.argDataType(typeof propVal),  // TODO Is using `typeof` bad for "null" values that may be int or bool?
                        argValue: propVal,
                        argLoc,
                        secure,
                        inSchema: false
                    });
                }
            }

            // if using global profile, make global base default for the operation below
            const osLoc = (this.getOsLocInfo(profile) ?? []).find(p => p.name === profile.profName);
            let baseProfile = this.mLoadedConfig.api.profiles.defaultGet("base");
            let realBaseProfileName: string;
            let layerProperties: IConfig;
            if (osLoc?.global) {
                layerProperties = this.mLoadedConfig.findLayer(osLoc.user, osLoc.global)?.properties;
                realBaseProfileName = layerProperties?.defaults.base;
                if (realBaseProfileName) baseProfile = this.mLoadedConfig.api.profiles.buildProfile(realBaseProfileName, layerProperties?.profiles);
                else baseProfile = null;
            }
            if (baseProfile != null) {
                // Load args from default base profile if one exists
                const baseProfileName = realBaseProfileName ?? configProperties.defaults.base;
                for (const [propName, propVal] of Object.entries(baseProfile)) {
                    const argName = CliUtils.getOptionFormat(propName).camelCase;
                    // Skip properties already loaded from service profile
                    if (!mergedArgs.knownArgs.find((arg) => arg.argName === argName)) {
                        const [argLoc, secure] = this.argTeamConfigLoc({
                            profileName: baseProfileName, propName, osLocInfo, configProperties: layerProperties ?? configProperties
                        });
                        mergedArgs.knownArgs.push({
                            argName,
                            dataType: this.argDataType(typeof propVal),
                            argValue: propVal,
                            argLoc,
                            secure,
                            inSchema: false
                        });
                    }
                }
            }
        } else if (profile.profLoc.locType === ProfLocType.OLD_PROFILE) {
            if (profile.profName != null) {
                const serviceProfile = this.mOldSchoolProfileCache.find(obj => {
                    return obj.name === profile.profName && obj.type === profile.profType;
                })?.profile;
                if (serviceProfile != null) {
                    // Load args from service profile if one exists
                    for (const [propName, propVal] of Object.entries(serviceProfile)) {
                        // Skip undefined properties because they don't meet criteria for known args
                        if (propVal === undefined) continue;
                        mergedArgs.knownArgs.push({
                            argName: CliUtils.getOptionFormat(propName).camelCase,
                            dataType: this.argDataType(typeof propVal),
                            argValue: propVal,
                            argLoc: this.argOldProfileLoc(profile.profName, profile.profType)
                        });
                    }
                }
            }

            const baseProfileName = this.mOldSchoolProfileDefaults.base;
            if (baseProfileName != null) {
                // Load args from default base profile if one exists
                const baseProfile = this.mOldSchoolProfileCache.find(obj => {
                    return obj.name === baseProfileName && obj.type === "base";
                })?.profile;
                if (baseProfile != null) {
                    for (const [propName, propVal] of Object.entries(baseProfile)) {
                        // Skip undefined properties because they don't meet criteria for known args
                        if (propVal === undefined) continue;
                        const argName = CliUtils.getOptionFormat(propName).camelCase;
                        // Skip properties already loaded from service profile
                        if (!mergedArgs.knownArgs.find((arg) => arg.argName === argName)) {
                            mergedArgs.knownArgs.push({
                                argName,
                                dataType: this.argDataType(typeof propVal),
                                argValue: propVal,
                                argLoc: this.argOldProfileLoc(baseProfileName, "base")
                            });
                        }
                    }
                }
            }
        } else {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.INVALID_PROF_LOC_TYPE,
                msg: "Invalid profile location type: " + ProfLocType[profile.profLoc.locType]
            });
        }

        // perform validation with profile schema if available
        const profSchema = this.loadSchema(profile);

        if (profSchema != null) {
            const missingRequired: string[] = [];

            for (const [propName, propInfoInSchema] of Object.entries(profSchema.properties || {})) {
                // Check if property in schema is missing from known args
                const knownArg = mergedArgs.knownArgs.find((arg) => arg.argName === propName);
                if (knownArg == null) {
                    let argFound = false;
                    if (profile.profLoc.locType === ProfLocType.TEAM_CONFIG) {
                        let [argLoc, foundInSecureArray]: [IProfLoc, boolean] = [null, false];
                        try {
                            [argLoc, foundInSecureArray] = this.argTeamConfigLoc({
                                profileName: profile.profName,
                                propName, osLocInfo, configProperties
                            });
                            argFound = true;
                        } catch (_argNotFoundInServiceProfile) {
                            if (configProperties.defaults.base != null) {
                                try {
                                    [argLoc, foundInSecureArray] = this.argTeamConfigLoc({
                                        profileName: configProperties.defaults.base, propName, osLocInfo, configProperties
                                    });
                                    argFound = true;
                                } catch (_argNotFoundInBaseProfile) {
                                    // Do nothing
                                }
                            }
                        }
                        if (argFound) {
                            const newArg: IProfArgAttrs = {
                                argName: propName,
                                dataType: this.argDataType(propInfoInSchema.type),
                                argValue: (propInfoInSchema as ICommandProfileProperty).optionDefinition?.defaultValue,
                                argLoc,
                                inSchema: true,
                                // See https://github.com/zowe/imperative/issues/739
                                secure: foundInSecureArray || propInfoInSchema.secure
                            };
                            try {
                                this.loadSecureArg({ argLoc, argName: propName } as any);
                                mergedArgs.knownArgs.push(newArg);
                            } catch (_secureValueNotFound) {
                                mergedArgs.missingArgs.push(newArg);
                            }
                        }
                    }
                    if (!argFound) {
                        mergedArgs.missingArgs.push({
                            argName: propName,
                            inSchema: true,
                            dataType: this.argDataType(propInfoInSchema.type),
                            argValue: (propInfoInSchema as ICommandProfileProperty).optionDefinition?.defaultValue,
                            argLoc: { locType: ProfLocType.DEFAULT },
                            secure: propInfoInSchema.secure
                        });
                    }
                } else {
                    knownArg.inSchema = true;
                    knownArg.secure = knownArg.secure ?? propInfoInSchema.secure;
                    if (knownArg.secure) {
                        delete knownArg.argValue;
                    }
                }
            }

            // overwrite with any values found in environment
            this.overrideWithEnv(mergedArgs, profSchema);

            for (const tempArg of mergedArgs.missingArgs || []) {
                // Check if missing property is required
                if (profSchema.required?.includes(tempArg.argName)) {
                    missingRequired.push(tempArg.argName);
                }
            }

            if (missingRequired.length > 0) {
                throw new ProfInfoErr({
                    errorCode: ProfInfoErr.MISSING_REQ_PROP,
                    msg: "Missing required properties: " + missingRequired.join(", ")
                });
            }
        } else {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.LOAD_SCHEMA_FAILED,
                msg: `Failed to load schema for profile type ${profile.profType}`
            });
        }

        // did our caller request the actual values of secure arguments?
        if (mergeOpts.getSecureVals) {
            mergedArgs.knownArgs.forEach((nextArg) => {
                try {
                    if (nextArg.secure) nextArg.argValue = this.loadSecureArg(nextArg);
                } catch (_argValueNotDefined) {
                    nextArg.argValue = undefined;
                }
            });
        }

        return mergedArgs;
    }

    // _______________________________________________________________________
    /**
     * Merge all of the available values for arguments defined for the
     * specified profile type. See mergeArgsForProfile() for details
     * about the merging algorithm.
     * The intended use is when no profile of a specific type exists.
     * The consumer app can prompt for values for missing arguments
     * and then perform the desired operation.
     *
     * @param profileType
     *        The type of profile of interest.
     *
     * @param mergeOpts
     *        Options to use when merging arguments.
     *        This parameter is not required. Defaults will be used.
     *
     * @returns The complete set of required properties;
     */
    public mergeArgsForProfileType(
        profileType: string,
        mergeOpts: IProfMergeArgOpts = { getSecureVals: false }
    ): IProfMergedArg {
        this.ensureReadFromDisk();
        return this.mergeArgsForProfile(
            {
                profName: null,
                profType: profileType,
                isDefaultProfile: false,
                profLoc: { locType: this.mUsingTeamConfig ? ProfLocType.TEAM_CONFIG : ProfLocType.OLD_PROFILE }
            },
            mergeOpts
        );
    }

    // _______________________________________________________________________
    /**
     * Convert an IProfAttrs object into an IProfileLoaded objects
     * This is a convenience function. IProfileLoaded was frequently passed
     * among functions. This conversion function allows existing code to
     * acquire values in the IProfAttrs structure but pass those values
     * around in the older IProfileLoaded structure. The IProfAttrs
     * properties will be copied as follows:
     *
     *      IProfileLoaded.name    <-- IProfAttrs.profName
     *      IProfileLoaded.type    <-- IProfAttrs.profType
     *      IProfileLoaded.profile <-- profAttrs
     *
     * @param profAttrs
     *      A profile attributes object.
     *
     * @param dfltProfLoadedVals
     *      A JSON object containing additional names from IProfileLoaded for
     *      which a value should be supplied. IProfileLoaded contains more
     *      properties than IProfAttrs. The items in this object will be
     *      placed into the resulting IProfileLoaded object.
     *      We use type "any" because all of the required properties of
     *      IProfileLoaded will not be supplied by dfltProfLoadedVals.
     *      If dfltProfLoadedVals is not supplied, only the following minimal
     *      set if hard-coded properties will be added to the IProfileLoaded object.
     *
     *      IProfileLoaded.message      <-- "" (an empty string)
     *      IProfileLoaded.failNotFound <-- false
     *
     * @returns An IProfileLoaded object;
     */
    public static profAttrsToProfLoaded(
        profAttrs: IProfAttrs,
        dfltProfLoadedVals?: any
    ): IProfileLoaded {
        const emptyProfLoaded: any = {};    // used to avoid lint complaints
        let profLoaded: IProfileLoaded = emptyProfLoaded;

        // set any supplied defaults
        if (dfltProfLoadedVals !== undefined) {
            profLoaded = lodash.cloneDeep(dfltProfLoadedVals);
        }

        // copy items from profAttrs
        profLoaded.name = profAttrs.profName;
        profLoaded.type = profAttrs.profType;
        profLoaded.profile = lodash.cloneDeep(profAttrs);

        // set hard-coded defaults
        if (!Object.prototype.hasOwnProperty.call(profLoaded, "message")) {
            profLoaded.message = "";
        }
        if (!Object.prototype.hasOwnProperty.call(profLoaded, "failNotFound")) {
            profLoaded.failNotFound = false;
        }

        return lodash.cloneDeep(profLoaded);
    }

    // _______________________________________________________________________
    /**
     * Read either the new team configuration files (if any exist) or
     * read the old-school profile files.
     *
     * @param teamCfgOpts
     *        The optional choices used when reading a team configuration.
     *        This parameter is ignored, if the end-user is using old-school
     *        profiles.
     */
    public async readProfilesFromDisk(teamCfgOpts?: IConfigOpts) {
        this.mLoadedConfig = await Config.load(this.mAppName, { homeDir: ImperativeConfig.instance.cliHome, ...teamCfgOpts });
        this.mUsingTeamConfig = this.mLoadedConfig.exists;

        try {
            if (this.mCredentials.isSecured) {
                await this.mCredentials.loadManager();
            }
        } catch (error) {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.LOAD_CRED_MGR_FAILED,
                msg: "Failed to initialize secure credential manager",
                causeErrors: error
            });
        }

        if (!this.mUsingTeamConfig) {
            // Clear out the values
            this.mOldSchoolProfileCache = [];
            this.mOldSchoolProfileDefaults = {};
            // Try to get profiles and types
            this.mOldSchoolProfileRootDir = path.join(ImperativeConfig.instance.cliHome, "profiles");
            this.mOldSchoolProfileTypes = fs.existsSync(this.mOldSchoolProfileRootDir) ?
                ProfileIO.getAllProfileDirectories(this.mOldSchoolProfileRootDir) : [];
            // Iterate over the types
            for (const profType of this.mOldSchoolProfileTypes) {
                // Set up the profile manager and list of profile names
                const profileManager = new CliProfileManager({ profileRootDirectory: this.mOldSchoolProfileRootDir, type: profType });
                const profileList = profileManager.getAllProfileNames();
                // Iterate over them all
                for (const prof of profileList) {
                    // Load and add to the list
                    try {
                        const loadedProfile = await profileManager.load({ name: prof });
                        this.mOldSchoolProfileCache.push(loadedProfile);
                    } catch (err) {
                        this.mImpLogger.warn(err.message);
                    }
                }

                try {
                    const defaultProfile = await profileManager.load({ loadDefault: true });
                    if (defaultProfile) { this.mOldSchoolProfileDefaults[profType] = defaultProfile.name; }
                } catch (err) {
                    this.mImpLogger.warn(err.message);
                }
            }
        }

        this.loadAllSchemas();
        this.readExtendersJsonFromDisk();
    }

    // _______________________________________________________________________
    /**
     * Returns an indicator of whether we are using a team configuration or
     * old-school profiles.
     *
     * You must call ProfileInfo.readProfilesFromDisk() before calling this function.
     *
     * @returns True when we are using a team config. False means old-school profiles.
     */
    public get usingTeamConfig(): boolean {
        this.ensureReadFromDisk();
        return this.mUsingTeamConfig;
    }

    /**
     * Gather information about the paths in osLoc
     * @param profile Profile attributes gathered from getAllProfiles
     */
    public getOsLocInfo(profile: IProfAttrs): IProfLocOsLoc[] {
        this.ensureReadFromDisk();
        const osLoc = profile?.profLoc?.osLoc;
        if (!osLoc?.length) return undefined;
        if (profile.profLoc.locType === ProfLocType.TEAM_CONFIG) {
            const ret: IProfLocOsLoc[] = [];
            for (const loc of osLoc) {
                for (const layer of this.mLoadedConfig.mLayers) {
                    if (layer.path === loc) {
                        // we found the config layer matching osLoc
                        ret.push({ name: profile.profName, path: loc, user: layer.user, global: layer.global });
                    }
                }
            }
            return ret;
        }
        return [{ name: profile.profName, path: profile.profLoc.osLoc[0], user: undefined, global: undefined }];
    }

    /**
     * Load value of secure argument from the vault.
     * @param arg Secure argument object
     */
    public loadSecureArg(arg: IProfArgAttrs): any {
        this.ensureReadFromDisk();
        let argValue;

        switch (arg.argLoc.locType) {
            case ProfLocType.TEAM_CONFIG:
                if (arg.argLoc.osLoc?.length > 0 && arg.argLoc.jsonLoc != null) {
                    for (const layer of this.mLoadedConfig.mLayers) {
                        if (layer.path === arg.argLoc.osLoc[0]) {
                            // we found the config layer matching arg.osLoc
                            argValue = lodash.get(layer.properties, arg.argLoc.jsonLoc);
                            break;
                        }
                    }
                }
                break;
            case ProfLocType.OLD_PROFILE:
                if (arg.argLoc.osLoc?.length > 0) {
                    for (const loadedProfile of this.mOldSchoolProfileCache) {
                        const profilePath = this.oldProfileFilePath(loadedProfile.type, loadedProfile.name);
                        if (profilePath === arg.argLoc.osLoc[0]) {
                            // we found the loaded profile matching arg.osLoc
                            argValue = loadedProfile.profile[arg.argName];
                            break;
                        }
                    }
                }
                break;
            default:  // not stored securely if location is ENV or DEFAULT
                argValue = arg.argValue;
        }

        if (argValue === undefined) {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.UNKNOWN_PROP_LOCATION,
                msg: `Failed to locate the property ${arg.argName}`
            });
        }

        return argValue;
    }

    // _______________________________________________________________________
    /**
     * Initialize a session configuration object with the arguments
     * from profArgs
     *
     * @param profArgs
     *      An array of profile argument attributes.
     * @param argNames
     *      An array of argument names to load from the profile. Defaults to
     *      all arguments that have an associated ISession property.
     *
     * @returns A session containing all of the supplied profile argument
     *          attributes that are relevant to a session.
     */
    public static initSessCfg(profArgs: IProfArgAttrs[], argNames?: string[]): ISession {
        const sessCfg: any = {};

        // the set of names of arguments in IProfArgAttrs used in ISession
        const profArgNames = argNames ?? [
            "host", "port", "user", "password", "rejectUnauthorized",
            "protocol", "basePath", "tokenType", "tokenValue"
        ];

        for (const profArgNm of profArgNames) {
            // map profile argument name into a sess config property name
            let sessCfgNm: string;
            if (profArgNm === "host") {
                sessCfgNm = "hostname";
            } else {
                sessCfgNm = profArgNm;
            }

            // for each profile argument found, place its value into sessCfg
            const profArg = lodash.find(profArgs, { "argName": profArgNm });
            if (profArg === undefined) {
                // we have a default for protocol
                if (sessCfgNm === "protocol") {
                    sessCfg[sessCfgNm] = SessConstants.HTTPS_PROTOCOL;
                }
            } else {
                sessCfg[sessCfgNm] = profArg.argValue;
            }
        }

        return sessCfg;
    }

    // _______________________________________________________________________
    /**
     * Ensures that ProfileInfo.readProfilesFromDisk() is called before
     * an operation that requires that information.
     */
    private ensureReadFromDisk() {
        if (this.mLoadedConfig == null) {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.MUST_READ_FROM_DISK,
                msg: "You must first call ProfileInfo.readProfilesFromDisk()."
            });
        }
    }

    // _______________________________________________________________________
    /**
     * Perform a rudimentary initialization of some Imperative utilities.
     * We must do this because VSCode apps do not typically call imperative.init.
     */
    private initImpUtils() {
        // create a rudimentary ImperativeConfig if it has not been initialized
        if (ImperativeConfig.instance.loadedConfig == null) {
            let homeDir: string = null;
            const envVarPrefix = this.mAppName.toUpperCase();
            const envVarNm = envVarPrefix + EnvironmentalVariableSettings.CLI_HOME_SUFFIX;
            if (process.env[envVarNm] === undefined) {
                // use OS home directory
                homeDir = path.join(os.homedir(), "." + this.mAppName.toLowerCase());
            } else {
                // use the available environment variable
                homeDir = path.normalize(process.env[envVarNm]);
            }
            ImperativeConfig.instance.loadedConfig = {
                name: this.mAppName,
                defaultHome: homeDir,
                envVariablePrefix: envVarPrefix
            };
            ImperativeConfig.instance.rootCommandName = this.mAppName;
        }

        // initialize logging
        if (LoggerManager.instance.isLoggerInit === false) {
            const loggingConfig = LoggingConfigurer.configureLogger(
                ImperativeConfig.instance.cliHome, ImperativeConfig.instance.loadedConfig
            );
            Logger.initLogger(loggingConfig);
        }
        this.mImpLogger = Logger.getImperativeLogger();
    }

    /**
     * Load any profile schema objects found on disk and cache them. For team
     * config, we check each config layer and load its schema JSON if there is
     * one associated. For old school profiles, we load the meta YAML file for
     * each profile type if it exists in the profile root directory.
     */
    private loadAllSchemas(): void {
        this.mProfileSchemaCache = new Map();
        if (this.mUsingTeamConfig) {
            // Load profile schemas for all layers
            let lastSchema: { path: string, json: any } = { path: null, json: null };
            for (const layer of this.getTeamConfig().mLayers) {
                if (layer.properties.$schema == null) continue;
                const schemaUri = new url.URL(layer.properties.$schema, url.pathToFileURL(layer.path));
                if (schemaUri.protocol !== "file:") {
                    throw new ProfInfoErr({
                        errorCode: ProfInfoErr.CANT_GET_SCHEMA_URL,
                        msg: `Failed to load schema for config file ${layer.path}: web URLs are not supported by ProfileInfo API`
                    });
                }
                const schemaPath = url.fileURLToPath(schemaUri);
                if (fs.existsSync(schemaPath)) {
                    try {
                        let schemaJson;
                        if (schemaPath !== lastSchema.path) {
                            schemaJson = jsonfile.readFileSync(schemaPath);
                            lastSchema = { path: schemaPath, json: schemaJson };
                        } else {
                            schemaJson = lastSchema.json;
                        }
                        for (const { type, schema } of ConfigSchema.loadSchema(schemaJson)) {
                            this.mProfileSchemaCache.set(`${layer.path}:${type}`, schema);
                        }
                    } catch (error) {
                        throw new ProfInfoErr({
                            errorCode: ProfInfoErr.LOAD_SCHEMA_FAILED,
                            msg: `Failed to load schema for config file ${layer.path}: invalid schema file`,
                            causeErrors: error
                        });
                    }
                }
            }
        } else {
            // Load profile schemas from meta files in profile root dir
            for (const type of this.mOldSchoolProfileTypes) {
                const metaPath = this.oldProfileFilePath(type, type + AbstractProfileManager.META_FILE_SUFFIX);
                if (fs.existsSync(metaPath)) {
                    try {
                        const metaProfile = ProfileIO.readMetaFile(metaPath);
                        this.mProfileSchemaCache.set(type, metaProfile.configuration.schema);
                    } catch (error) {
                        throw new ProfInfoErr({
                            errorCode: ProfInfoErr.LOAD_SCHEMA_FAILED,
                            msg: `Failed to load schema for profile type ${type}: invalid meta file`,
                            causeErrors: error
                        });
                    }
                }
            }
        }
        LoggerUtils.setProfileSchemas(this.mProfileSchemaCache);
    }

    /**
     * Reads the `extenders.json` file from the CLI home directory.
     * Called once in `readProfilesFromDisk` and cached to minimize I/O operations.
     */
    private readExtendersJsonFromDisk(): void {
        const extenderJsonPath = path.join(ImperativeConfig.instance.cliHome, "extenders.json");
        if (!fs.existsSync(extenderJsonPath)) {
            jsonfile.writeFileSync(extenderJsonPath, {
                profileTypes: {}
            }, { spaces: 4 });
        } else {
            this.mExtendersJson = jsonfile.readFileSync(extenderJsonPath);
        }
    }

    /**
     * Adds a profile type to the loaded Zowe config.
     * The profile type must first be added to the schema using `addProfileTypeToSchema`.
     *
     * @param {string} profileType The profile type to add
     * @param [layerPath] A dot-separated path that points to a layer in the config (default: top-most layer)
     * Example: “outer.prod” would add a profile into the “prod” layer (which is contained in “outer” layer)
     * @returns {boolean} `true` if added to the loaded config; `false` otherwise
     */
    public addProfileToConfig(profileType: string, layerPath?: string): boolean {
        const profileSchema = [...this.getTeamConfig().mLayers].reverse()
            .reduce((prev: IProfileSchema, layer) => {
                const [, desiredSchema] = [...this.mProfileSchemaCache.entries()]
                    .filter(([typeWithPath, schema]) => typeWithPath.includes(`:${profileType}`))[0];
                return desiredSchema;
            }, {} as IProfileSchema);

        this.getTeamConfig().api.profiles.set(layerPath ? `${layerPath}.${profileType}` : profileType,
            ConfigBuilder.buildDefaultProfile(this.mLoadedConfig.mProperties, { type: profileType, schema: profileSchema }));
        return true;
    }

    private writeExtendersJson(): boolean {
        try {
            const extenderJsonPath = path.join(ImperativeConfig.instance.cliHome, "extenders.json");
            jsonfile.writeFileSync(extenderJsonPath, this.mExtendersJson, { spaces: 4 });
        } catch (err) {
            if (err.code === "EACCES" || err.code === "EPERM") {
                return false;
            }
        }

        return true;
    }

    /**
     * Adds a profile type to the schema, and tracks its contribution in extenders.json.
     *
     * @param {IProfileSchema} typeSchema The schema to add for the profile type
     * @returns {boolean} `true` if added to the schema; `false` otherwise
     */
    public addProfileTypeToSchema(profileType: string, typeInfo:
    { sourceApp: string; schema: IProfileSchema; version?: string }): AddProfToSchemaResult {
        if (this.mLoadedConfig == null) {
            return {
                success: false,
                info: "No config layers are available (none found, or method was called before readProfilesFromDisk)"
            };
        }

        const oldExtendersJson = lodash.cloneDeep(this.mExtendersJson);
        let successMsg = "";

        if (profileType in this.mExtendersJson.profileTypes) {
            // Profile type was already contributed, determine whether its metadata should be updated
            const typeMetadata = this.mExtendersJson.profileTypes[profileType];
            if (semver.valid(typeInfo.version) != null) {
                const prevTypeVersion = typeMetadata.version;
                if (prevTypeVersion != null) {
                    // Update the schema version for this profile type if newer than the installed version
                    if (semver.gt(typeInfo.version, prevTypeVersion)) {
                        this.mExtendersJson.profileTypes[profileType] = {
                            version: typeInfo.version,
                            from: typeMetadata.from.filter((src) => src !== typeInfo.sourceApp).concat([typeInfo.sourceApp])
                        };
                        this.mProfileSchemaCache.set(profileType, typeInfo.schema);
                        if (semver.major(typeInfo.version) != semver.major(prevTypeVersion)) {
                            successMsg =
                            `Profile type ${profileType} was updated from schema version ${prevTypeVersion} to ${typeInfo.version}.\n`.concat(
                                `The following applications may be affected: ${typeMetadata.from.filter((src) => src !== typeInfo.sourceApp)}`
                            );
                        }
                    } else if (semver.major(prevTypeVersion) > semver.major(typeInfo.version)) {
                        // Warn user if we are expecting a newer major schema version than the one they are providing
                        return {
                            success: false,
                            info: `Profile type ${profileType} expects a newer schema version than provided by ${typeInfo.sourceApp}\n`.concat(
                                `(expected: v${typeInfo.version}, installed: v${prevTypeVersion})`)
                        };
                    }
                } else {
                    // There wasn't a previous version, so we can update the schema
                    this.mExtendersJson.profileTypes[profileType] = {
                        version: typeInfo.version,
                        from: typeMetadata.from.filter((src) => src !== typeInfo.sourceApp).concat([typeInfo.sourceApp])
                    };
                    this.mProfileSchemaCache.set(profileType, typeInfo.schema);
                }
            } else if (typeInfo.version != null) {
                return {
                    success: false,
                    info: `New schema type for profile type ${profileType} is not SemVer-compliant; schema was not updated.`
                }
            }
        } else {
            // Track the newly-contributed profile type in extenders.json
            this.mExtendersJson.profileTypes[profileType] = {
                version: typeInfo.version,
                from: [typeInfo.sourceApp]
            };
            this.mProfileSchemaCache.set(`${this.mLoadedConfig.layerActive().path}:${profileType}`, typeInfo.schema);
        }

        // Update contents of extenders.json
        if (!lodash.isEqual(oldExtendersJson, this.mExtendersJson)) {
            if (!this.writeExtendersJson()) {
                return {
                    success: true,
                    // Even if we failed to update extenders.json, it was technically added to the schema cache.
                    // Warn the user that the new type may not persist if the schema is regenerated elsewhere.
                    info: "Failed to update extenders.json: insufficient permissions or read-only file.\n".concat(
                        `Profile type ${profileType} may not persist if the schema is updated.`)
                };
            }
        }

        return {
            success: true,
            info: successMsg
        };
    }

    /**
     * Builds the entire schema based on the available profile types and application sources.
     *
     * @param [sources] Include profile types contributed by these sources when building the schema
     *   - Source applications are tracked in the “from” list for each profile type in extenders.json
     * @returns {IConfigSchema} A config schema containing all applicable profile types
     */
    public buildSchema(sources?: string[]): IConfigSchema {
        const finalSchema: Record<string, IProfileSchema> = {};
        const teamConfigLayers = this.getTeamConfig().mLayers;

        for (let i = teamConfigLayers.length; i > 0; i--) {
            // Grab types from each layer, starting with the highest-priority layer
            const layer = teamConfigLayers[i];
            if (layer.properties.$schema == null) continue;
            const schemaUri = new url.URL(layer.properties.$schema, url.pathToFileURL(layer.path));
            const schemaPath = url.fileURLToPath(schemaUri);

            if (!fs.existsSync(schemaPath)) continue;

            const profileTypesInLayer = [...this.mProfileSchemaCache.entries()]
                .filter(([type, schema]) => type.includes(`${layer.path}:`));
            for (const [typeWithPath, schema] of profileTypesInLayer) {
                const type = typeWithPath.split(":").pop();
                if (type == null) {
                    continue;
                }
                if (type in this.mExtendersJson.profileTypes) {
                    if (sources?.length > 0) {
                        // If a list of sources were provided, ensure the type is contributed at least one of these sources
                        if (sources.some((val) => this.mExtendersJson.profileTypes[type].from.includes(val))) {
                            finalSchema[type] = schema;
                        }
                    } else {
                        finalSchema[type] = schema;
                    }
                }
            }
        }

        return ConfigSchema.buildSchema(Object.entries(finalSchema).map(([type, schema]) => ({
            type,
            schema
        })));
    }

    /**
     * Returns a list of all available profile types
     * @param [sources] Include all available types from given source applications
     */
    public getProfileTypes(sources?: string[]): string[] {
        const filteredBySource = sources?.length > 0;
        const profileTypes = new Set<string>();
        for (const layer of this.getTeamConfig().mLayers) {
            if (layer.properties.$schema == null) continue;
            const schemaUri = new url.URL(layer.properties.$schema, url.pathToFileURL(layer.path));
            const schemaPath = url.fileURLToPath(schemaUri);
            if (!fs.existsSync(schemaPath)) continue;

            const profileTypesInLayer = [...this.mProfileSchemaCache.keys()].filter((key) => key.includes(`${layer.path}:`));
            for (const typeWithPath of profileTypesInLayer) {
                const type = typeWithPath.split(":").pop();
                if (type == null) {
                    continue;
                }
                // if (type in this.mExtendersJson.profileTypes) {
                    if (filteredBySource) {
                        // Only consider types contributed by at least one of these sources
                        if (sources.some((val) => this.mExtendersJson.profileTypes[type].from.includes(val))) {
                            profileTypes.add(type);
                        }
                    } else {
                        profileTypes.add(type);
                    }
                //}
            }
        }

        // Include all profile types from extenders.json if we are not filtering by source
        if (!filteredBySource) {
            for (const type of Object.keys(this.mExtendersJson.profileTypes)) {
                profileTypes.add(type);
            }
        }

        return [...profileTypes].sort();
    }

    /**
     * Returns the schema object belonging to the specified profile type.
     *
     * @param {string} profileType The profile type to retrieve the schema from
     * @returns {IProfileSchema} The schema object provided by the specified profile type
     */
    public getSchemaForType(profileType: string): IProfileSchema {
        let finalSchema: IProfileSchema = null;
        for (let i = this.getTeamConfig().mLayers.length; i > 0; i--) {
            const layer = this.getTeamConfig().mLayers[i];
            const profileTypesFromLayer = [...this.mProfileSchemaCache.entries()].filter(([key, value]) => key.includes(`${layer.path}:`));
            for (const [layerType, schema] of profileTypesFromLayer) {
                const type = layerType.split(":").pop();
                if (type == null) {
                    continue;
                }
                if (type === profileType) {
                    finalSchema = schema[1];
                }
            }
        }

        return finalSchema;
    }

    // _______________________________________________________________________
    /**
     * Get all of the subprofiles in the configuration.
     *
     * @param path
     *          The short form profile name dotted path
     * @param jsonPath
     *          The long form profile dotted path
     * @param profObj
     *          The profiles object from the parent profile.
     *          Contains the subprofiles to search through.
     * @param profileType
     *          Limit selection to only profiles of the specified type.
     *          If not supplied, the names of all typed profiles are returned.
     *
     * @returns An array of profile attribute objects.
     *          In addition to the name, you get the profile type,
     *          an indicator of whether the profile is the default profile
     *          for that type, and the location of that profile.
     *
     *          If no profile exists for the specified type (or if
     *          no profiles of any kind exist), we return an empty array
     *          ie, length is zero.
     */
    private getTeamSubProfiles(path: string, jsonPath: string, profObj: { [key: string]: any }, profileType?: string): IProfAttrs[] {
        const profiles: IProfAttrs[] = [];
        for (const prof in profObj) {
            const newJsonPath = jsonPath + ".profiles." + prof;
            const newProfName = path + "." + prof;
            if (profObj[prof].type && (profileType == null || profObj[prof].type === profileType)) {
                const profAttrs: IProfAttrs = {
                    profName: newProfName,
                    profType: profObj[prof].type,
                    isDefaultProfile: this.isDefaultTeamProfile(newProfName, profileType),
                    profLoc: {
                        locType: ProfLocType.TEAM_CONFIG,
                        osLoc: this.findTeamOsLocation(newJsonPath),
                        jsonLoc: newJsonPath
                    }
                };
                profiles.push(profAttrs);
            }
            // Check for subprofiles
            if (profObj[prof].profiles) {
                // Get the subprofiles and add to profiles list
                const subProfiles: IProfAttrs[] = this.getTeamSubProfiles(newProfName, newJsonPath, profObj[prof].profiles, profileType);
                for (const subProfile of subProfiles) {
                    profiles.push(subProfile);
                }
            }
        }
        return profiles;
    }

    /**
     *
     * @param path
     *              The short form profile name dotted path
     * @param profileType
     *              Limit selection to profiles of the specified type
     * @returns A boolean true if the profile is a default profile,
     *          and a boolean false if the profile is not a default profile
     */
    private isDefaultTeamProfile(path: string, profileType?: string): boolean {
        const configProperties = this.mLoadedConfig.mProperties;

        // Is it defined for a particular profile type?
        if (profileType) {
            if (configProperties.defaults[profileType] === path) return true;
            else return false;
        }

        // Iterate over defaults to see if it's a default profile
        for (const def in configProperties.defaults) {
            if (configProperties.defaults[def] === path) {
                return true;
            }
        }

        return false;
    }

    /**
     *
     * @param jsonPath The long form JSON path of the profile we are searching for.
     * @param excludeHomeDir The long form JSON path of the profile we are searching for.
     * @returns A string array containing the location of all files containing the specified team profile
     */
    private findTeamOsLocation(jsonPath: string, excludeHomeDir?: boolean): string[] {
        const files: string[] = [];
        const layers = this.mLoadedConfig.mLayers;
        for (const layer of layers) {
            if (excludeHomeDir && layer.global) continue;
            if (lodash.get(layer.properties, jsonPath) !== undefined && !files.includes(layer.path)) {
                files.push(layer.path);
            }
        }
        return files;
    }

    /**
     * Get arg data type from a "typeof" string. Arg data types can be basic
     * types like string, number, and boolean. If they are any other type or a
     * union of types, their type will be represented simply as object.
     * @param propType The type of a profile property
     */
    private argDataType(propType: string | string[]): "string" | "number" | "boolean" | "array" | "object" {
        switch (propType) {
            case "string":
            case "number":
            case "boolean":
            case "array":
                return propType;
            default:
                return "object";
        }
    }

    /**
     * Given a profile name and property name, compute the profile location
     * object containing OS and JSON locations.
     * @param opts Set of options that allow this method to get the profile location
     */
    private argTeamConfigLoc(opts: IArgTeamConfigLoc): [IProfLoc, boolean] {
        const segments = this.mLoadedConfig.api.profiles.getProfilePathFromName(opts.profileName).split(".profiles.");
        let osLocInfo: IProfLocOsLocLayer;
        if (opts.osLocInfo?.user != null || opts.osLocInfo?.global != null)
            osLocInfo = { user: opts.osLocInfo?.user, global: opts.osLocInfo?.global };
        const secFields = this.getTeamConfig().api.secure.secureFields(osLocInfo);
        const buildPath = (ps: string[], p: string) => `${ps.join(".profiles.")}.properties.${p}`;
        while (segments.length > 0 &&
            lodash.get(opts.configProperties ?? this.mLoadedConfig.mProperties, buildPath(segments, opts.propName)) === undefined &&
            secFields.indexOf(buildPath(segments, opts.propName)) === -1) {
            // Drop segment from end of path if property not found
            segments.pop();
        }
        const jsonPath = (segments.length > 0) ? buildPath(segments, opts.propName) : undefined;
        if (jsonPath == null) {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.PROP_NOT_IN_PROFILE,
                msg: `Failed to find property ${opts.propName} in the profile ${opts.profileName}`
            });
        }

        const foundInSecureArray = secFields.indexOf(buildPath(segments, opts.propName)) >= 0;
        const _isPropInLayer = (properties: IConfig) => {
            return properties && (lodash.get(properties, jsonPath) !== undefined ||
                (foundInSecureArray && lodash.get(properties, jsonPath.split(`.properties.${opts.propName}`)[0]) !== undefined));
        };

        let filePath: string;
        if (_isPropInLayer(opts.configProperties) && opts.osLocInfo) {
            filePath = opts.osLocInfo.path;
        } else {
            for (const layer of this.mLoadedConfig.mLayers) {
                // Find the first layer that includes the JSON path
                if (_isPropInLayer(layer.properties)) {
                    filePath = layer.path;
                    break;
                }
            }
        }

        return [{
            locType: ProfLocType.TEAM_CONFIG,
            osLoc: [filePath],
            jsonLoc: jsonPath
        }, foundInSecureArray];
    }

    /**
     * Given a profile name and type, compute the profile location object
     * containing OS location.
     * @param profileName Name of an old school profile (e.g., LPAR1)
     * @param profileType Type of an old school profile (e.g., zosmf)
     */
    private argOldProfileLoc(profileName: string, profileType: string): IProfLoc {
        return {
            locType: ProfLocType.OLD_PROFILE,
            osLoc: [this.oldProfileFilePath(profileType, profileName)]
        };
    }

    /**
     * Given a profile name and type, return the OS location of the associated
     * YAML file.
     * @param profileName Name of an old school profile (e.g., LPAR1)
     * @param profileType Type of an old school profile (e.g., zosmf)
     */
    private oldProfileFilePath(profileType: string, profileName: string) {
        return path.join(this.mOldSchoolProfileRootDir, profileType, profileName + AbstractProfileManager.PROFILE_EXTENSION);
    }

    /**
     * Load the cached schema object for a profile type. Returns null if
     * schema is not found in the cache.
     * @param profile Profile attributes object
     */
    private loadSchema(profile: IProfAttrs): IProfileSchema | null {
        let schemaMapKey: string;

        if (profile.profLoc.locType === ProfLocType.TEAM_CONFIG) {
            if (profile.profLoc.osLoc != null) {
                // the profile exists, so use schema associated with its config JSON file
                schemaMapKey = `${profile.profLoc.osLoc[0]}:${profile.profType}`;
            } else {
                // no profile exists, so loop through layers and use the first schema found
                for (const layer of this.mLoadedConfig.mLayers) {
                    const tempKey = `${layer.path}:${profile.profType}`;
                    if (this.mProfileSchemaCache.has(tempKey)) {
                        schemaMapKey = tempKey;
                        break;
                    }
                }
            }
        } else if (profile.profLoc.locType === ProfLocType.OLD_PROFILE) {
            // for old school profiles, there is only one schema per profile type
            schemaMapKey = profile.profType;
        }
        if (schemaMapKey != null && this.mProfileSchemaCache.has(schemaMapKey)) {
            return this.mProfileSchemaCache.get(schemaMapKey);
        }

        return null;
    }

    // _______________________________________________________________________
    /**
     * Override values in a merged argument object with values found in
     * environment variables. The choice to override enviroment variables is
     * controlled by an option on the ProfileInfo constructor.
     *
     * @param mergedArgs
     *      On input, this must be an object containing merged arguments
     *      obtained from configuration settings. This function will override
     *      values in mergedArgs.knownArgs with values found in environment
     *      variables. It will also move arguments from mergedArgs.missingArgs
     *      into mergedArgs.knownArgs if a value is found in an environment
     *      variable for any missingArgs.
     */
    private overrideWithEnv(mergedArgs: IProfMergedArg, profSchema?: IProfileSchema) {
        if (!this.mOverrideWithEnv) return; // Don't do anything

        // Populate any missing options
        const envPrefix = ImperativeConfig.instance.loadedConfig.envVariablePrefix;
        const envStart = envPrefix + "_OPT_";
        for (const key in process.env) {
            if (key.startsWith(envStart)) {
                let argValue: any = process.env[key];
                let dataType: any = typeof argValue;
                const argName: string = CliUtils.getOptionFormat(key.substring(envStart.length).replace(/_/g, "-").toLowerCase()).camelCase;

                let argNameFound = false;
                if (profSchema != null) {
                    for (const [propName, propObj] of Object.entries(profSchema.properties || {})) {
                        if (argName === propName) {
                            dataType = this.argDataType(propObj.type);
                            argNameFound = true;
                        }
                    }
                }

                if (profSchema == null || !argNameFound) {
                    if (argValue.toUpperCase() === "TRUE" || argValue.toUpperCase() === "FALSE") {
                        dataType = "boolean";
                    } else if (!isNaN(+(argValue))) {
                        dataType = "number";
                    }
                    // TODO: Look for option definition for argName to check if it's an array
                }

                if (dataType === "boolean") {
                    argValue = argValue.toUpperCase() === "TRUE";
                } else if (dataType === "number") {
                    argValue = +(argValue);
                } else if (dataType === "array") {
                    argValue = CliUtils.extractArrayFromEnvValue(argValue);
                }

                const tempArg: IProfArgAttrs = {
                    argName,
                    argValue,
                    dataType,
                    argLoc: { locType: ProfLocType.ENV }
                };

                const missingArgsIndex = mergedArgs.missingArgs.findIndex((arg) => arg.argName === argName);
                const knownArgsIndex = mergedArgs.knownArgs.findIndex((arg) => arg.argName === argName);
                if (argNameFound || missingArgsIndex >= 0) {
                    if (knownArgsIndex < 0) {
                        mergedArgs.knownArgs.push(tempArg);
                    }
                    if (missingArgsIndex >= 0) mergedArgs.missingArgs.splice(missingArgsIndex, 1);
                }
            }
        }
    }
}
