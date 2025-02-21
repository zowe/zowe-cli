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
import * as url from "url";
import * as jsonfile from "jsonfile";
import * as lodash from "lodash";
import * as semver from "semver";

// for ProfileInfo structures
import { IProfArgAttrs, IProfDataType } from "./doc/IProfArgAttrs";
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

import { ICommandProfileProperty, ICommandArguments } from "../../cmd";
import { IProfileLoaded, IProfileProperty, IProfileSchema } from "../../profiles";

// for imperative operations
import { CliUtils, ImperativeConfig } from "../../utilities";
import { ImperativeExpect } from "../../expect";
import { Logger } from "../../logger";
import {
    IOptionsForAddConnProps, ISession, Session, SessConstants, ConnectionPropsForSessCfg
} from "../../rest";
import { IProfInfoUpdateKnownPropOpts, IProfInfoUpdatePropOpts } from "./doc/IProfInfoUpdatePropOpts";
import { ConfigAutoStore } from "./ConfigAutoStore";
import { IGetAllProfilesOptions } from "./doc/IProfInfoProps";
import { IConfig } from "./doc/IConfig";
import { IProfInfoRemoveKnownPropOpts } from "./doc/IProfInfoRemoveKnownPropOpts";
import { ConfigUtils } from "./ConfigUtils";
import { ConfigBuilder } from "./ConfigBuilder";
import { IAddProfTypeResult, IExtenderTypeInfo, IExtendersJsonOpts } from "./doc/IExtenderOpts";
import { IConfigLayer } from "..";
import { Constants } from "../../constants";
import { Censor } from "../../censor";

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
 *    // So you want to write to a config file?
 *    // You must use the Config API to write to a team configuration.
 *    // See the Config class documentation for functions to set
 *    // and save team config arguments.
 *
 *    // Let's save some zosmf arguments from the example above.
 *    let yourZosmfArgsToWrite: IProfArgAttrs =
 *        youSetValuesToOverwrite(
 *            zosmfMergedArgs.knownArgs, zosmfMergedArgs.missingArgs
 *        );
 *
 *    let configObj: Config = profInfo.getTeamConfig();
 *    youWriteArgValuesUsingConfigObj(
 *        configObj, yourZosmfArgsToWrite
 *    );
 * </pre>
 */
export class ProfileInfo {
    private mLoadedConfig: Config = null;
    private mAppName: string = null;
    private mImpLogger: Logger = null;
    private mOverrideWithEnv: boolean = false;

    private mHasValidSchema: boolean = false;
    /**
     * Cache of profile schema objects mapped by profile type and config path
     * if applicable. Example of map keys:
     *  - For team config: "/root/.zowe/zowe.config.json:zosmf"
     */
    private mProfileSchemaCache: Map<string, IProfileSchema>;
    private mCredentials: ProfileCredentials;

    private mExtendersJson: IExtendersJsonOpts;

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

        this.mCredentials = new ProfileCredentials(this, profInfoOpts);

        // do enough Imperative stuff to let imperative utilities work
        this.mImpLogger = ConfigUtils.initImpUtils(this.mAppName);
    }

    /**
     * Checks if a JSON web token is used for authenticating the given profile
     * name. If so, it will decode the token to determine whether it has
     * expired.
     *
     * @param {string | IProfileLoaded} profile
     *     The name of the profile or the profile object to check the JSON web
     *     token for
     * @returns {boolean}
     *     Whether the token has expired for the given profile. Returns `false`
     *     if a token value is not set or the token type is LTPA2.
     */
    public hasTokenExpiredForProfile(profile: string | IProfileLoaded): boolean {
        const profName = typeof profile === "string" ? profile : profile.name;
        const profAttrs = this.getAllProfiles().find((prof) => prof.profName === profName);
        const knownProps = this.mergeArgsForProfile(profAttrs, { getSecureVals: true }).knownArgs;
        const tokenValueProp = knownProps.find((arg) => arg.argName === "tokenValue" && arg.argValue != null);

        // Ignore if tokenValue is not a prop
        if (tokenValueProp == null) {
            return false;
        }

        const tokenTypeProp = knownProps.find((arg) => arg.argName === "tokenType");
        // Cannot decode LTPA tokens without private key
        if (tokenTypeProp?.argValue == "LtpaToken2") {
            return false;
        }

        const fullToken = tokenValueProp.argValue.toString();
        return ConfigUtils.hasTokenExpired(fullToken);
    }

    /**
     * Update a given property in the config file.
     * @param options Set of options needed to update a given property
     */
    public async updateProperty(options: IProfInfoUpdatePropOpts): Promise<void> {
        this.ensureReadFromDisk();
        const desiredProfile = options.profileType != null ?
            this.getAllProfiles(options.profileType).find(v => v.profName === options.profileName) : null;
        let updated = false;
        if (desiredProfile != null) {
            const mergedArgs = this.mergeArgsForProfile(desiredProfile, { getSecureVals: false });
            if (options.forceUpdate) {
                const knownProperty = mergedArgs.knownArgs.find(v => v.argName === options.property);
                if (knownProperty != null) {
                    const profPath = this.getTeamConfig().api.profiles.getProfilePathFromName(options.profileName);
                    if (!ConfigUtils.jsonPathMatches(knownProperty.argLoc.jsonLoc, profPath)) {
                        knownProperty.argLoc.jsonLoc = `${profPath}.properties.${options.property}`;
                    }
                }
            }
            updated = await this.updateKnownProperty({ ...options, mergedArgs, osLocInfo: this.getOsLocInfo(desiredProfile)?.[0] });
        } else if (!(options.profileType == null && (options.forceUpdate || this.getTeamConfig().api.profiles.exists(options.profileName)))) {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.PROF_NOT_FOUND,
                msg: `Failed to find profile ${options.profileName} of type ${options.profileType}`
            });
        }

        if (!updated) {
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
        }
    }

    /**
     * Update a given property with the value provided.
     * This function only works for properties that can be found in the config files (including secure arrays).
     * If the property cannot be found, this function will resolve to false
     * @param options Set of options required to update a known property
     */
    public async updateKnownProperty(options: IProfInfoUpdateKnownPropOpts): Promise<boolean> {
        this.ensureReadFromDisk();
        const toUpdate = options.mergedArgs.knownArgs.find(v => v.argName === options.property) ||
            options.mergedArgs.missingArgs.find(v => v.argName === options.property);

        if (toUpdate == null || toUpdate.argLoc.locType === ProfLocType.TEAM_CONFIG && !this.getTeamConfig().mProperties.autoStore) {
            return false;
        }

        switch (toUpdate.argLoc.locType) {
            case ProfLocType.TEAM_CONFIG: {
                let oldLayer: IProfLocOsLocLayer;
                const layer = this.getTeamConfig().layerActive();
                const osLoc = options.osLocInfo ?? this.getOsLocInfo(
                    this.getAllProfiles().find(p => ConfigUtils.jsonPathMatches(toUpdate.argLoc.jsonLoc, p.profLoc.jsonLoc)))?.[0];
                if (osLoc && (layer.user !== osLoc.user || layer.global !== osLoc.global)) {
                    oldLayer = { user: layer.user, global: layer.global };
                    this.getTeamConfig().api.layers.activate(osLoc.user, osLoc.global);
                }

                const updateVaultOnly = options.setSecure && this.getTeamConfig().api.secure.secureFields().includes(toUpdate.argLoc.jsonLoc);
                this.getTeamConfig().set(toUpdate.argLoc.jsonLoc, options.value, { secure: options.setSecure });
                if (!updateVaultOnly) {
                    await this.getTeamConfig().save(false);
                } else {
                    await this.getTeamConfig().api.secure.save(false);
                }

                if (oldLayer) {
                    this.getTeamConfig().api.layers.activate(oldLayer.user, oldLayer.global);
                }
                break;
            }
            case ProfLocType.ENV:
            case ProfLocType.DEFAULT:
                return false;
            default: {
                let msgText = "Invalid profile location type: ";
                if (toUpdate.argLoc.locType == ProfLocType.OLD_PROFILE) {
                    msgText = "You can no longer write to V1 profiles. Location type = ";
                }
                throw new ProfInfoErr({
                    errorCode: ProfInfoErr.INVALID_PROF_LOC_TYPE,
                    msg: msgText + toUpdate.argLoc.locType
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

        // get default profile name from the team config
        const configProperties = this.mLoadedConfig.mProperties;
        if (!Object.prototype.hasOwnProperty.call(configProperties.defaults, profileType)) {
            // no default exists for the requested type
            this.mImpLogger.warn("Found no profile of type '" +
                profileType + "' in Zowe client configuration."
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
                if (!realBaseProfileName && osLoc.user) {
                    layerProperties = this.mLoadedConfig.findLayer(false, osLoc.global)?.properties;
                    realBaseProfileName = layerProperties?.defaults.base;
                }
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
                profLoc: { locType: ProfLocType.TEAM_CONFIG }
            },
            mergeOpts
        );
    }

    /**
     * Retrieves the Zowe CLI home directory. In the situation Imperative has
     * not initialized it we use a default value.
     * @returns {string} - Returns the Zowe home directory
     * @deprecated Use ConfigUtils.getZoweDir()
     */
    public static getZoweDir(): string {
        return ConfigUtils.getZoweDir();
    }

    /**
     * Returns an indicator that the user has no team configuration, but we
     * detected the existence of old-school V1 profiles. We will not work with the
     * V1 profiles. This function can let you tell a user that they are incorrectly
     * trying to use V1 profiles.
     * @deprecated Use non-static method instead to detect V2 profiles
     * @returns {boolean} `true` if a V1 profile exists, and `false` otherwise.
     */
    public static get onlyV1ProfilesExist(): boolean {
        return ConfigUtils.onlyV1ProfilesExist;
    }

    /**
     * Returns an indicator that the user has no team configuration, but we
     * detected the existence of old-school V1 profiles. We will not work with the
     * V1 profiles. This function can let you tell a user that they are incorrectly
     * trying to use V1 profiles.
     *
     * @returns True - Means there is *NO* team config *AND* we detected that a V1 profile exists.
     *          False otherwise.
     */
    public get onlyV1ProfilesExist(): boolean {
        return !this.getTeamConfig().exists && ConfigUtils.onlyV1ProfilesExist;
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
     * Read the team configuration files (if any exist).
     *
     * @param teamCfgOpts
     *        The optional choices related to reading a team configuration.
     */
    public async readProfilesFromDisk(teamCfgOpts?: IConfigOpts) {
        this.mLoadedConfig = await Config.load(this.mAppName, { homeDir: ImperativeConfig.instance.cliHome, ...teamCfgOpts });

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

        this.mExtendersJson = ConfigUtils.readExtendersJson();
        this.loadAllSchemas();
    }

    //_________________________________________________________________________
    /**
     * Checks whether the credential manager will load successfully.
     * @returns
     *     True if it loaded successfully, or there is no credential manager
     *     configured in Imperative settings.json
     */
    public async profileManagerWillLoad(): Promise<boolean> {
        if (this.mCredentials.isCredentialManagerInAppSettings()) {
            try {
                await this.mCredentials.activateCredMgrOverride();
                return true;
            } catch (err) {
                this.mImpLogger.warn("Failed to initialize secure credential manager: " + err.message);
                return false;
            }
        } else {
            return true;
        }
    }

    /**
     * Returns whether a valid schema was found (works for v1 and v2 configs)
     */
    public get hasValidSchema(): boolean {
        return this.mHasValidSchema;
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

    /**
     * Load any profile schema objects found on disk and cache them. For team
     * config, we check each config layer and load its schema JSON if there is
     * one associated.
     */
    private loadAllSchemas(): void {
        this.mProfileSchemaCache = new Map();

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
                    const loadedSchemas = ConfigSchema.loadSchema(schemaJson);
                    Censor.setProfileSchemas(loadedSchemas);
                    for (const { type, schema } of loadedSchemas) {
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

        this.mHasValidSchema = lastSchema.path != null;
    }

    /**
     * Reads the `extenders.json` file from the CLI home directory.
     * Called once in `readProfilesFromDisk` and cached to minimize I/O operations.
     * @internal
     * @deprecated Please use `ConfigUtils.readExtendersJson` instead
     */
    public static readExtendersJsonFromDisk(): IExtendersJsonOpts {
        return ConfigUtils.readExtendersJson();
    }

    /**
     * Attempts to write to the `extenders.json` file in the CLI home directory.
     * @returns `true` if written successfully; `false` otherwise
     * @internal
     * @deprecated Please use `ConfigUtils.writeExtendersJson` instead
     */
    public static writeExtendersJson(obj: IExtendersJsonOpts): boolean {
        return ConfigUtils.writeExtendersJson(obj);
    }

    /**
     * Adds a profile type to the loaded Zowe config.
     * The profile type must first be added to the schema using `addProfileTypeToSchema`.
     *
     * @param {string} profileType The profile type to add
     * @param [layerPath] A dot-separated path that points to a layer in the config (default: top-most layer)
     *
     * Example: “outer.prod” would add a profile into the “prod” layer (which is contained in “outer” layer)
     * @returns {boolean} `true` if added to the loaded config; `false` otherwise
     */
    public addProfileToConfig(profileType: string, layerPath?: string): boolean {
        // Find the schema in the cache, starting with the highest-priority layer and working up
        const profileSchema = [...this.getTeamConfig().mLayers].reverse()
            .reduce((prev: IProfileSchema, cfgLayer) => {
                const cachedSchema = [...this.mProfileSchemaCache.entries()]
                    .filter(([typeWithPath, _schema]) => typeWithPath.includes(`${cfgLayer.path}:${profileType}`))[0];
                if (cachedSchema != null) {
                    prev = cachedSchema[1];
                }
                return prev;
            }, undefined);

        // Skip adding to config if the schema was not found
        if (profileSchema == null) {
            return false;
        }

        this.getTeamConfig().api.profiles.set(layerPath ? `${layerPath}.${profileType}` : profileType,
            ConfigBuilder.buildDefaultProfile({ type: profileType, schema: profileSchema }, { populateProperties: true }));
        return true;
    }

    /**
     * Updates the schema of the provided config layer to contain the new profile type.
     *
     * @param {string} profileType The profile type to add into the schema
     * @param {IProfileSchema} typeSchema The schema for the profile type
     * @param {IConfigLayer} layer The config layer that matches the schema to update
     * @param [versionChanged] Whether the version has changed for the schema (optional)
     * @returns {boolean} `true` if added to the schema; `false` otherwise
     */
    private updateSchemaAtLayer(profileType: string, schema: IProfileSchema, layer: IConfigLayer, versionChanged?: boolean): boolean {
        if (layer == null || !layer.exists) {
            this.mImpLogger.trace("ProfileInfo.updateSchemaAtLayer returned false: config layer does not exist.");
            return false;
        }
        const cacheKey = `${layer.path}:${profileType}`;

        const transformedSchemaProps = this.omitCmdPropsFromSchema(schema.properties);
        const transformedCacheProps = this.mProfileSchemaCache.has(cacheKey) ?
            this.omitCmdPropsFromSchema(this.mProfileSchemaCache.get(cacheKey)) : {};

        const sameSchemaExists = this.mProfileSchemaCache.has(cacheKey) && lodash.isEqual(transformedSchemaProps, transformedCacheProps);
        // Update the cache with the newest schema for this profile type
        this.mProfileSchemaCache.set(cacheKey, schema);
        const schemaUri = new url.URL(layer.properties.$schema, url.pathToFileURL(layer.path));
        const schemaPath = url.fileURLToPath(schemaUri);

        if (!fs.existsSync(schemaPath)) {
            this.mImpLogger.trace(
                "ProfileInfo.updateSchemaAtLayer returned false: the schema does not exist on disk for this layer."
            );
            return false;
        }

        // if profile type schema has changed or if it doesn't exist on-disk, rebuild schema and write to disk
        if (versionChanged || !sameSchemaExists) {
            jsonfile.writeFileSync(schemaPath, this.buildSchema([], layer), { spaces: 4 });
        }

        return true;
    }

    /**
     * This helper function removes all command-related properties from the given schema properties object and returns it.
     * This is so we can easily compare schemas from disk with those that are registered with type ICommandProfileSchema.
     * It's also been added to avoid a breaking change (as we currently allow ICommandProfileSchema objects to be registered).
     * @param obj The properties object from the schema
     * @returns The properties object, but with all of the command-related properties removed
     */
    private omitCmdPropsFromSchema(obj: Record<string, any>): Record<string, IProfileProperty> {
        const result: Record<string, any> = lodash.omit(obj, Constants.COMMAND_PROF_TYPE_PROPS);
        Object.keys(result).forEach((key) => {
            if (lodash.isObject(result[key])) {
                result[key] = this.omitCmdPropsFromSchema(result[key]);
            }
        });

        return result;
    }

    private addToGlobalSchema(profileType: string, typeInfo: IExtenderTypeInfo): IAddProfTypeResult {
        const layer = this.getTeamConfig().mLayers.find((layer) => layer.global && layer.exists);
        if (layer == null) {
            return {
                success: false,
                info: "No global config layer was found."
            };
        }

        let addedToSchema = false;
        let infoMsg = "";
        if (profileType in this.mExtendersJson.profileTypes) {
            // Profile type was already contributed, determine whether its metadata should be updated
            const typeMetadata = this.mExtendersJson.profileTypes[profileType];

            if (semver.valid(typeInfo.schema.version) != null) {
                // The provided version is SemVer-compliant; compare against previous version (if exists)
                const prevTypeVersion = typeMetadata.version;
                if (prevTypeVersion != null) {
                    if (semver.gt(typeInfo.schema.version, prevTypeVersion)) {
                        // Update the schema for this profile type, as its newer than the installed version
                        this.mExtendersJson.profileTypes[profileType] = {
                            version: typeInfo.schema.version,
                            from: typeMetadata.from.filter((src) => src !== typeInfo.sourceApp).concat([typeInfo.sourceApp]),
                            latestFrom: typeInfo.sourceApp
                        };

                        addedToSchema = this.updateSchemaAtLayer(profileType, typeInfo.schema, layer, true);

                        if (semver.major(typeInfo.schema.version) != semver.major(prevTypeVersion)) {
                            // Warn user if new major schema version is specified
                            infoMsg =
                                `Profile type ${profileType} was updated from schema version ${prevTypeVersion} to ${typeInfo.schema.version}.\n` +
                                `The following applications may be affected: ${typeMetadata.from.filter((src) => src !== typeInfo.sourceApp)}`;
                        }
                    } else if (semver.major(prevTypeVersion) > semver.major(typeInfo.schema.version)) {
                        // Warn user if previous schema version is a newer major version
                        return {
                            success: false,
                            info: `Profile type ${profileType} expects a newer schema version than provided by ${typeInfo.sourceApp}\n` +
                                `(expected: v${typeInfo.schema.version}, installed: v${prevTypeVersion})`
                        };
                    }
                } else {
                    // No schema version specified previously; update the schema
                    this.mExtendersJson.profileTypes[profileType] = {
                        version: typeInfo.schema.version,
                        from: typeMetadata.from.filter((src) => src !== typeInfo.sourceApp).concat([typeInfo.sourceApp]),
                        latestFrom: typeInfo.sourceApp
                    };
                    addedToSchema = this.updateSchemaAtLayer(profileType, typeInfo.schema, layer, true);
                }
            } else {
                if (typeInfo.schema.version != null) {
                    // Warn user if this schema does not provide a valid version number
                    return {
                        success: false,
                        info: `New schema type for profile type ${profileType} is not SemVer-compliant; schema was not updated`
                    };
                }

                const schemaProps = this.omitCmdPropsFromSchema(typeInfo.schema.properties);
                const cachedSchemaProps = this.omitCmdPropsFromSchema(this.getSchemaForType(profileType)?.properties || {});

                // If the old schema doesn't have a tracked version and its different from the one passed into this function, warn the user
                if (this.mExtendersJson.profileTypes[profileType].version == null &&
                    !lodash.isEqual(schemaProps, cachedSchemaProps)) {
                    return {
                        success: false,
                        info: `Both the old and new schemas are unversioned for ${profileType}, but the schemas are different. ` +
                            "The new schema was not written to disk, but will still be accessible in-memory."
                    };
                }
            }
        } else {
            // Newly-contributed profile type; track in extenders.json
            this.mExtendersJson.profileTypes[profileType] = {
                version: typeInfo.schema.version,
                from: [typeInfo.sourceApp],
                latestFrom: typeInfo.schema.version ? typeInfo.sourceApp : undefined
            };
            addedToSchema = this.updateSchemaAtLayer(profileType, typeInfo.schema, layer);
        }

        return { success: addedToSchema, info: infoMsg };
    }

    /**
     * Adds a profile type to the schema, and tracks its contribution in extenders.json.
     *
     * NOTE: `readProfilesFromDisk` must be called at least once before adding new profile types.
     *
     * @param {string} profileType The new profile type to add to the schema
     * @param {IExtenderTypeInfo} typeInfo Type metadata for the profile type (schema, source app., optional version)
     * @param [updateProjectSchema] Automatically update a project-level schema if one exists.
     * @returns {IAddProfTypeResult} the result of adding the profile type to the schema
     */
    public addProfileTypeToSchema(profileType: string, typeInfo: IExtenderTypeInfo, updateProjectSchema?: boolean): IAddProfTypeResult {
        // Get the active team config layer
        const activeLayer = this.getTeamConfig()?.layerActive();
        if (activeLayer == null) {
            return {
                success: false,
                info: "This function only supports team configurations."
            };
        }

        // copy last value for `extenders.json` to compare against updated object
        const oldExtendersJson = lodash.cloneDeep(this.mExtendersJson);
        let result: IAddProfTypeResult = {
            success: false,
            info: ""
        };

        let wasGlobalUpdated = false;

        if (!activeLayer.global) {
            if (updateProjectSchema) {
                result.success = this.updateSchemaAtLayer(profileType, typeInfo.schema, activeLayer);
            }
            wasGlobalUpdated = this.addToGlobalSchema(profileType, typeInfo).success;
        } else {
            result = this.addToGlobalSchema(profileType, typeInfo);
            wasGlobalUpdated = result.success;
        }

        // Update contents of extenders.json if it has changed
        if (wasGlobalUpdated && !lodash.isEqual(oldExtendersJson, this.mExtendersJson)) {
            if (!ConfigUtils.writeExtendersJson(this.mExtendersJson)) {
                return {
                    success: true,
                    // Even if we failed to update extenders.json, it was technically added to the schema cache.
                    // Warn the user that the new type may not persist if the schema is regenerated elsewhere.
                    info: "Failed to update extenders.json: insufficient permissions or read-only file.\n".concat(
                        `Profile type ${profileType} may not persist if the schema is updated.`)
                };
            }
        }

        return result;
    }

    /**
     * Builds the entire schema based on the available profile types and application sources.
     *
     * @param [sources] Include profile types contributed by these sources when building the schema
     *   - Source applications are tracked in the “from” list for each profile type in extenders.json
     * @param [layer] The config layer to build a schema for
     *   - If a layer is not specified, `buildSchema` will use the active layer.
     * @returns {IConfigSchema} A config schema containing all applicable profile types
     */
    public buildSchema(sources?: string[], layer?: IConfigLayer): IConfigSchema {
        const finalSchema: Record<string, IProfileSchema> = {};
        const desiredLayer = layer ?? this.getTeamConfig().layerActive();

        const profileTypesInLayer = [...this.mProfileSchemaCache.entries()]
            .filter(([type, _schema]) => type.includes(`${desiredLayer.path}:`));
        for (const [typeWithPath, schema] of profileTypesInLayer) {
            const type = typeWithPath.split(":").pop();
            if (type == null) {
                continue;
            }

            finalSchema[type] = schema;
        }

        let schemaEntries = Object.entries(finalSchema);
        if (sources?.length > 0) {
            schemaEntries = schemaEntries.filter(([typ, _sch]) => {
                if (!(typ in this.mExtendersJson.profileTypes)) {
                    return false;
                }

                // If a list of sources were provided, ensure the type is contributed by at least one of these sources
                if (sources.some((val) => this.mExtendersJson.profileTypes[typ].from.includes(val))) {
                    return true;
                }

                return false;
            });
        }

        return ConfigSchema.buildSchema(schemaEntries.map(([type, schema]) => ({
            type,
            schema
        })));
    }

    /**
     * @param [sources] (optional) Only include available types from the given list of sources
     * @returns a list of all available profile types
    */
    public getProfileTypes(sources?: string[]): string[] {
        const filteredBySource = sources?.length > 0;
        const profileTypes = new Set<string>();
        for (const layer of this.getTeamConfig().mLayers) {
            if (layer.properties.$schema == null) continue;
            const schemaUri = new url.URL(layer.properties.$schema, url.pathToFileURL(layer.path));
            if (schemaUri.protocol !== "file:") continue;
            const schemaPath = url.fileURLToPath(schemaUri);
            if (!fs.existsSync(schemaPath)) continue;

            const profileTypesInLayer = [...this.mProfileSchemaCache.keys()].filter((key) => key.includes(`${layer.path}:`));
            for (const typeWithPath of profileTypesInLayer) {
                const type = typeWithPath.split(":").pop();
                if (type == null) {
                    continue;
                }

                profileTypes.add(type);
            }
        }

        // Include all profile types from extenders.json if we are not filtering by source
        if (filteredBySource) {
            return [...profileTypes].filter((t) => {
                if (!(t in this.mExtendersJson.profileTypes)) {
                    return false;
                }

                return this.mExtendersJson.profileTypes[t].from.some((src) => sources.includes(src));
            }).sort((a, b) => a.localeCompare(b));
        }

        return [...profileTypes].sort((a, b) => a.localeCompare(b));
    }

    /**
     * Returns the schema object belonging to the specified profile type.
     *
     * @param {string} profileType The profile type to retrieve the schema from
     * @returns {IProfileSchema} The schema object provided by the specified profile type
     */
    public getSchemaForType(profileType: string): IProfileSchema {
        let finalSchema: IProfileSchema = undefined;
        for (let i = this.getTeamConfig().mLayers.length - 1; i > 0; i--) {
            const layer = this.getTeamConfig().mLayers[i];
            const profileTypesFromLayer = [...this.mProfileSchemaCache.entries()].filter(([key, _value]) => key.includes(`${layer.path}:`));
            for (const [layerType, schema] of profileTypesFromLayer) {
                const type = layerType.split(":").pop();
                if (type !== profileType) {
                    continue;
                }
                finalSchema = schema;
            }
        }

        return finalSchema;
    }

    // _______________________________________________________________________
    /**
     * List of secure properties with more details, like value, location, and type
     *
     * @param opts The user and global flags that specify one of the four
     *             config files (aka layers).
     * @returns Array of secure property details
     */
    public secureFieldsWithDetails(opts?: { user: boolean; global: boolean }): IProfArgAttrs[] {
        const config = this.getTeamConfig();
        const layer = opts ? config.findLayer(opts.user, opts.global) : config.layerActive();
        const fields = config.api.secure.findSecure(layer.properties.profiles, "profiles");
        const vault = config.api.secure.securePropsForLayer(layer.path);

        const response: IProfArgAttrs[] = [];

        // Search the vault for each secure field
        if (vault) {
            fields.forEach(fieldPath => {
                // Search inside the secure fields for this layer
                Object.entries(vault).map(([propPath, propValue]) => {
                    if (propPath === fieldPath) {
                        const dataType = ConfigSchema.findPropertyType(fieldPath, layer.properties, this.buildSchema([], layer)) as IProfDataType;

                        response.push({
                            argName: fieldPath.split(".properties.")[1],
                            dataType: dataType ?? this.argDataType(typeof propValue),
                            argValue: propValue as IProfDataType,
                            argLoc: {
                                locType: ProfLocType.TEAM_CONFIG,
                                osLoc: [layer.path],
                                jsonLoc: fieldPath
                            },
                        });
                    }
                });
            });
        }

        fields.forEach(fieldPath => {
            if (response.find(details => details.argLoc.jsonLoc === fieldPath) == null) {
                const dataType = ConfigSchema.findPropertyType(fieldPath, layer.properties, this.buildSchema([], layer)) as IProfDataType ?? null;
                response.push({
                    argName: fieldPath.split(".properties.")[1],
                    dataType,
                    argValue: undefined,
                    argLoc: {
                        locType: ProfLocType.TEAM_CONFIG,
                        osLoc: [layer.path],
                        jsonLoc: fieldPath
                    }
                });
            }
        });

        return response;
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
        const jsonPath = segments.length > 0 ? buildPath(segments, opts.propName) : undefined;
        if (jsonPath == null) {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.PROP_NOT_IN_PROFILE,
                msg: `Failed to find property ${opts.propName} in the profile ${opts.profileName}`
            });
        }

        const foundInSecureArray = secFields.indexOf(buildPath(segments, opts.propName)) >= 0;
        const _isPropInLayer = (properties: IConfig) => {
            return properties && (lodash.get(properties, jsonPath) !== undefined ||
                foundInSecureArray && lodash.get(properties, jsonPath.split(`.properties.${opts.propName}`)[0]) !== undefined);
        };

        let filePath: string;
        for (const layer of this.mLoadedConfig.mLayers) {
            // Find the first layer that includes the JSON path
            if (_isPropInLayer(layer.properties)) {
                filePath = layer.path;
                break;
            }
        }

        return [{
            locType: ProfLocType.TEAM_CONFIG,
            osLoc: [filePath],
            jsonLoc: jsonPath
        }, foundInSecureArray];
    }

    /**
     * Load the cached schema object for a profile type. Returns null if
     * schema is not found in the cache.
     * @param profile Profile attributes object
     */
    private loadSchema(profile: IProfAttrs): IProfileSchema | null {
        let schemaMapKey: string;

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

        if (schemaMapKey != null && this.mProfileSchemaCache.has(schemaMapKey)) {
            return this.mProfileSchemaCache.get(schemaMapKey);
        }

        return null;
    }

    // _______________________________________________________________________
    /**
     * Override values in a merged argument object with values found in
     * environment variables. The choice to override environment variables is
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

        const envPrefix = this.mAppName.toUpperCase();
        // Do we expect to always read "ZOWE_OPT_" environmental variables or "APPNAME_OPT_"?

        // Populate any missing options
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
                    } else if (!isNaN(+argValue)) {
                        dataType = "number";
                    }
                    // TODO: Look for option definition for argName to check if it's an array
                }

                if (dataType === "boolean") {
                    argValue = argValue.toUpperCase() === "TRUE";
                } else if (dataType === "number") {
                    argValue = +argValue;
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
