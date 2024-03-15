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
import * as path from "path";
import * as lodash from "lodash";
import { removeSync } from "fs-extra";
import stripAnsi = require("strip-ansi");
import { V1ProfileConversion, ProfilesConstants, ProfileUtils } from "../../profiles";
import { IImperativeConfig } from "../../imperative";
import { Config } from "./Config";
import { IConfig } from "./doc/IConfig";
import { IConfigBuilderOpts } from "./doc/IConfigBuilderOpts";
import { CredentialManagerFactory } from "../../security";
import { IConfigConvertOpts, ConvertMsg, ConvertMsgFmt, IConfigConvertResult } from "./doc/IConfigConvert";
import { ICommandProfileTypeConfiguration } from "../../cmd";
import { IImperativeOverrides } from "../../imperative/src/doc/IImperativeOverrides";
import { keyring } from "@zowe/secrets-for-zowe-sdk";
import { AppSettings } from "../../settings";
import { ImperativeConfig } from "../../utilities";
import { PluginIssues } from "../../imperative/src/plugins/utilities/PluginIssues";
import { uninstall as uninstallPlugin } from "../../imperative/src/plugins/utilities/npm-interface";
import { CredentialManagerOverride } from "../../security/src/CredentialManagerOverride";
import { OverridesLoader } from "../../imperative/src/OverridesLoader";
import { ConfigSchema } from "./ConfigSchema";
import { Logger } from "../../logger";

interface IOldPluginInfo {
    /**
     * List of CLI plug-ins to uninstall
     */
    plugins: string[];
    /**
     * List of overrides to remove from app settings
     */
    overrides: (keyof IImperativeOverrides)[];
}

export class ConfigBuilder {
    private static convertResult: IConfigConvertResult = null;
    private static profilesRootDir: string = "NotYetSet";
    private static oldProfilesDir: string = "NotYetSet";
    private static zoweKeyRing: typeof keyring = undefined;

    /**
     * Build a new Config object from an Imperative CLI app configuration.
     * @param impConfig The Imperative CLI app configuration.
     * @param opts Options to control aspects of the builder.
     */
    public static async build(impConfig: IImperativeConfig, opts?: IConfigBuilderOpts): Promise<IConfig> {
        opts = opts || {};
        const builtConfig: IConfig = Config.empty();

        for (const profile of impConfig.profiles) {
            const defaultProfile = ConfigBuilder.buildDefaultProfile(profile, opts);

            // Add the profile to config and set it as default
            lodash.set(builtConfig, `profiles.${profile.type}`, defaultProfile);

            if (opts.populateProperties) {
                builtConfig.defaults[profile.type] = profile.type;
            }
        }

        // Prompt for properties missing from base profile
        if (impConfig.baseProfile != null && opts.getValueBack != null) {
            for (const [k, v] of Object.entries(impConfig.baseProfile.schema.properties)) {
                if (v.includeInTemplate && v.optionDefinition?.defaultValue == null) {
                    const propValue = await opts.getValueBack(k, v);
                    if (propValue != null) {
                        lodash.set(builtConfig, `profiles.${impConfig.baseProfile.type}.properties.${k}`, propValue);
                    }
                }
            }
        }

        return { ...builtConfig, autoStore: true };
    }

    public static buildDefaultProfile(profile: ICommandProfileTypeConfiguration, opts?: IConfigBuilderOpts): {
        type: string;
        properties: Record<string, any>;
        secure: string[]
    } {
        const properties: { [key: string]: any } = {};
        const secureProps: string[] = [];
        for (const [k, v] of Object.entries(profile.schema.properties)) {
            if (opts.populateProperties && v.includeInTemplate) {
                if (v.secure) {
                    secureProps.push(k);
                } else {
                    if (v.optionDefinition != null) {
                        // Use default value of ICommandOptionDefinition if present
                        properties[k] = v.optionDefinition.defaultValue;
                    }
                    if (properties[k] === undefined) {
                        // Fall back to an empty value
                        properties[k] = this.getDefaultValue(v.type);
                    }
                }
            }
        }

        return {
            type: profile.type,
            properties,
            secure: secureProps
        };
    }

    /**
     * Convert V1 profiles into a current zowe client config.
     *      Remove old credential manager overrides.
     *      Uninstall old SCS plugin.
     *      Delete old V1 profiles if requested.
     *
     * Calling this function after having already converted, will not attempt to
     * convert again. However it will still delete the old profiles if requested.
     *
     * @param convertOpts Options that will control the conversion proecess.
     * @returns Result object into which messages and stats are stored.
     */
    public static async convertV1Profiles(convertOpts: IConfigConvertOpts): Promise<IConfigConvertResult> {
        // initialize our result, which will be used by our utility functions, and returned by us
        ConfigBuilder.convertResult = {
            msgs: [],
            numProfilesFound: 0,
            profilesConverted: {},
            profilesFailed: []
        };
        try {
            ConfigBuilder.profilesRootDir = ProfileUtils.constructProfilesRootDirectory(ImperativeConfig.instance.cliHome);
            ConfigBuilder.oldProfilesDir = `${ConfigBuilder.profilesRootDir.replace(/[\\/]$/, "")}-old`;
            let newCfgFilePathNm: string;

            if (ConfigBuilder.isConversionNeeded()) {
                newCfgFilePathNm = await ConfigBuilder.moveV1ProfilesToConfigFile();
                ConfigBuilder.removeOldOverrides();
            }

            if (convertOpts.deleteV1Profs){
                await ConfigBuilder.deleteV1Profiles();
            } else {
                ConfigBuilder.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE,
                    `Your old V1 profiles have been moved to ${ConfigBuilder.oldProfilesDir}.` +
                    `Delete them by re-running this operation and requesting deletion.`
                );

                ConfigBuilder.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
                    `If you want to restore your V1 profiles to convert them again, ` +
                    `rename the 'profiles-old' directory to 'profiles' and delete the new config file ` +
                    `located at ${newCfgFilePathNm}.`
                );
            }
        } catch (error) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                "Encountered the following error while trying to convert V1 profiles."
            );

            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                stripAnsi(error.message)
            );
        }

        return ConfigBuilder.convertResult;
    }

    /**
     * Detect whether we must convert any V1 profiles to a zowe client configuration.
     * @returns True means we must do a conversion. False otherwise.
     */
    private static isConversionNeeded(): boolean {
        ConfigBuilder.convertResult.numProfilesFound = 0;
        let doConversion: boolean = false;

        if (ImperativeConfig.instance.config?.exists) {
            // We do not convert if we already have an existing zowe client config
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE,
                "A current Zowe client configuration was detected. V1 profiles will not be converted."
            );
        } else {
            // with no client config, the existence of old V1 profiles dictates if we will convert
            ConfigBuilder.convertResult.numProfilesFound = ConfigBuilder.getOldProfileCount(ConfigBuilder.profilesRootDir);
            if (ConfigBuilder.convertResult.numProfilesFound === 0) {
                ConfigBuilder.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE,
                    "Found no old V1 profiles to convert to a current Zowe client configuration."
                );
            } else {
                doConversion = true;
            }
        }

        return doConversion;
    }

    /**
     * Move the contents of existing v1 profiles to a zowe client config file.
     *
     * @returns The path name to the new zowe client config file (null upon failure).
     */
    private static async moveV1ProfilesToConfigFile(): Promise<string> {
        const convertedConfig: IConfig = Config.empty();

        /* Only the convert-profiles command is able to disable the credential manager
         * and reload it. For all other commands, the credential manager is loaded in
         * `Imperative.init` and frozen with `Object.freeze` so cannot be modified later on.
         *
         * Todo: Determine how we can also reload credMgr when called from ZE.
         */
        await OverridesLoader.ensureCredentialManagerLoaded();

        for (const profileType of V1ProfileConversion.getAllProfileDirectories(ConfigBuilder.profilesRootDir)) {
            const profileTypeDir = path.join(ConfigBuilder.profilesRootDir, profileType);
            const profileNames = V1ProfileConversion.getAllProfileNames(profileTypeDir, ".yaml", `${profileType}_meta`);
            if (profileNames.length === 0) {
                continue;
            }

            for (const profileName of profileNames) {
                try {
                    const profileFilePath = path.join(profileTypeDir, `${profileName}.yaml`);
                    const profileProps = V1ProfileConversion.readProfileFile(profileFilePath, profileType);
                    const secureProps = [];

                    for (const [key, value] of Object.entries(profileProps)) {
                        if (value.toString().startsWith(ProfilesConstants.PROFILES_OPTION_SECURELY_STORED)) {
                            const secureValue = await CredentialManagerFactory.manager.load(
                                ProfileUtils.getProfilePropertyKey(profileType, profileName, key), true);
                            if (secureValue != null) {
                                profileProps[key] = JSON.parse(secureValue);
                                secureProps.push(key);
                            } else {
                                delete profileProps[key];
                            }
                        }
                    }

                    convertedConfig.profiles[ProfileUtils.getProfileMapKey(profileType, profileName)] = {
                        type: profileType,
                        properties: profileProps,
                        secure: secureProps
                    };

                    ConfigBuilder.convertResult.profilesConverted[profileType] = [
                        ...(ConfigBuilder.convertResult.profilesConverted[profileType] || []), profileName
                    ];
                } catch (error) {
                    ConfigBuilder.convertResult.profilesFailed.push({ name: profileName, type: profileType, error });
                }
            }

            try {
                const metaFilePath = path.join(profileTypeDir, `${profileType}_meta.yaml`);
                const profileMetaFile = V1ProfileConversion.readMetaFile(metaFilePath);
                if (profileMetaFile.defaultProfile != null) {
                    convertedConfig.defaults[profileType] = ProfileUtils.getProfileMapKey(profileType, profileMetaFile.defaultProfile);
                }
            } catch (error) {
                ConfigBuilder.convertResult.profilesFailed.push({ type: profileType, error });
            }
        }

        // convert profile property names that were changed starting in V2
        ConfigBuilder.convertPropNames(convertedConfig);
        convertedConfig.autoStore = true;

        // report the successfully converted profiles
        for (const [k, v] of Object.entries(ConfigBuilder.convertResult.profilesConverted)) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE,
                `Converted ${k} profiles: ${v.join(", ")}`
            );
        }

        // report the profiles that we failed to convert
        if (ConfigBuilder.convertResult.profilesFailed.length > 0) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                `Failed to convert ${ConfigBuilder.convertResult.profilesFailed.length} profile(s). See details below:`
            );
            for (const { name, type, error } of ConfigBuilder.convertResult.profilesFailed) {
                if (name != null) {
                    ConfigBuilder.addToConvertMsgs(
                        ConvertMsgFmt.ERROR_LINE,
                        `Failed to load ${ type } profile "${name}"`
                    );
                } else {
                    ConfigBuilder.addToConvertMsgs(
                        ConvertMsgFmt.ERROR_LINE,
                        `Failed to find default ${type} profile.`
                    );
                }
                ConfigBuilder.addToConvertMsgs(
                    ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                    stripAnsi(error.message)
                );
            }
        }

        return await ConfigBuilder.createNewConfigFile(convertedConfig);
    }

    /**
     * Create a new zowe client config file from an IConfig object.
     *
     * @param convertedConfig IConfig object created as a result of V1 profile conversion.
     * @returns string - Path name to the newly created config file.
     */
    private static async createNewConfigFile(convertedConfig: IConfig): Promise<string> {
        const newConfig = ImperativeConfig.instance.config;
        newConfig.api.layers.activate(false, true);
        newConfig.api.layers.merge(convertedConfig);
        ConfigSchema.updateSchema();
        await newConfig.save();

        let newParaChoice: number = ConvertMsgFmt.PARAGRAPH;
        try {
            fs.renameSync(ConfigBuilder.profilesRootDir, ConfigBuilder.oldProfilesDir);
        } catch (error) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | newParaChoice,
                `Failed to rename profiles directory to ${ConfigBuilder.oldProfilesDir}:`
            );
            newParaChoice = 0;

            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                error.message
            );
        }

        let newCfgFilePathNm: string = null;
        try {
            newCfgFilePathNm = newConfig.layerActive().path;
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE | newParaChoice,
                `Your new profiles have been saved to ${newCfgFilePathNm}.`
            );

            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE,
                "To make changes, edit that file in an editor of your choice."
            );
        } catch (error) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | newParaChoice,
                "Failed to retrieve the path to the new config file."
            );

            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                error.message
            );

            newCfgFilePathNm = null;
        }

        if (newCfgFilePathNm === null) {
            newCfgFilePathNm = "UnableToGetPathToNewConfigFile";
        }

        return newCfgFilePathNm;
    }

    /**
     * Delete the V1 profiles that have been converted.
     * We also delete the secure credentials stored for those V1 profiles.
     */
    private static async deleteV1Profiles(): Promise<void> {
        // Delete the profiles directory
        try {
            removeSync(ConfigBuilder.oldProfilesDir);
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
                `Deleted the profiles directory '${ConfigBuilder.oldProfilesDir}'.`
            );
        } catch (error) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                `Failed to delete the profiles directory '${ConfigBuilder.oldProfilesDir}'`
            );

            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                error.message
            );
        }

        // Delete the securely stored credentials
        const isZoweKeyRingAvailable = await ConfigBuilder.checkZoweKeyRingAvailable();
        if (isZoweKeyRingAvailable) {
            const knownServices = ["@brightside/core", "@zowe/cli", "Zowe-Plugin", "Broadcom-Plugin", "Zowe"];
            for (const service of knownServices) {
                const accounts = await ConfigBuilder.findOldSecureProps(service);
                for (const account of accounts) {
                    if (!account.includes("secure_config_props")) {
                        const success = await ConfigBuilder.deleteOldSecureProps(service, account);
                        const errMsgTrailer = `secure value for "${service}/${account}".`;
                        if (success) {
                            ConfigBuilder.addToConvertMsgs(
                                ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
                                `Deleted ${errMsgTrailer}.`
                            );
                        } else {
                            ConfigBuilder.addToConvertMsgs(
                                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                                `Failed to delete ${errMsgTrailer}.`
                            );
                        }
                    }
                }
            }
        } else {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                "Zowe keyring or the credential vault are unavailable. Unable to delete old secure values."
            );
        }
    }

    /**
     * Remove any old credential manager overrides.
     */
    private static removeOldOverrides(): void {
        /* Replace any detected oldCredMgr override entry in settings.json with the Zowe embedded credMgr.
         * Only the convert-profiles command is able to disable the credential manager
         * and reload it. For all other commands, the credential manager is loaded in
         * `Imperative.init` and frozen with `Object.freeze` so cannot be modified later on.
         *
         * Todo: Determine how we can also set and reload credMgr when called from ZE.
         */
        const oldPluginInfo = ConfigBuilder.getOldPluginInfo();
        for (const override of oldPluginInfo.overrides) {
            if (override === "CredentialManager") {
                try {
                    AppSettings.instance.set("overrides", "CredentialManager", CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);
                    if (ImperativeConfig.instance.loadedConfig.overrides.CredentialManager != null) {
                        delete ImperativeConfig.instance.loadedConfig.overrides.CredentialManager;
                    }
                } catch (error) {
                    ConfigBuilder.addToConvertMsgs(
                        ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                        "Failed to replace credential manager override setting."
                    );

                    ConfigBuilder.addToConvertMsgs(
                        ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                        stripAnsi(error.message)
                    );
                }
            }
        }

        // Report any plugin that we will uninstall
        if (oldPluginInfo.plugins.length > 0) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE,
                "The following plug-ins will be removed because they are now part of the core CLI and are no longer needed:"
            );

            for (const nextPlugin of oldPluginInfo.plugins) {
                ConfigBuilder.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE,
                    nextPlugin
                );
            }
        }

        // Uninstall all detected override plugins. We never implemented anything but a CredMgr override.
        let lineCount: number = 1;
        let firstLineNewPara: number = ConvertMsgFmt.PARAGRAPH;
        for (const pluginName of oldPluginInfo.plugins) {
            if (lineCount > 1) {
                firstLineNewPara = 0;
            }
            try {
                uninstallPlugin(pluginName);
                ConfigBuilder.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE | firstLineNewPara,
                    `Uninstalled plug-in: ${pluginName}`
                );
            } catch (error) {
                ConfigBuilder.addToConvertMsgs(
                    ConvertMsgFmt.ERROR_LINE | firstLineNewPara,
                    `Failed to uninstall plug-in "${pluginName}"`
                );

                ConfigBuilder.addToConvertMsgs(
                    ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                    stripAnsi(error.message)
                );
            }
            lineCount++;
        }
    }

    /**
     * Convert a set of known property names to their new names
     * for V2 conformance (and later releases).
     *
     * @param convertedConfig The converted client configuration in which we shall
     *      rename obsolete property names to their conformant names.
     */
    private static convertPropNames(convertedConfig: IConfig): void {
        const nameConversions = [
            ["hostname", "host"],
            ["username", "user"],
            ["pass", "password"]
        ];

        // iterate through all of the recorded profiles
        for (const currProfNm of Object.keys(convertedConfig.profiles)) {
            // iterate through the non-secure properties of the current profile
            const profPropsToConvert = [];
            const currProps = convertedConfig.profiles[currProfNm].properties;
            for (const [currPropName, currPropVal] of Object.entries(currProps)) {
                // iterate through the set of names that we must convert
                for (const [oldPropName, newPropName] of nameConversions) {
                    if (currPropName === oldPropName) {
                        /* Store the property conversion info for later replacement.
                         * We do not want to add and delete properties while
                         * we are iterating the properties.
                         */
                        const propToConvert = [oldPropName, newPropName, currPropVal];
                        profPropsToConvert.push(propToConvert);

                        /* We recorded the replacement for this property name.
                         * No need to look for more name conversions on this name.
                         */
                        break;
                    }
                }
            } // end for all properties

            // convert the non-secure property names for the current profile
            for (const [oldPropName, newPropName, propValue] of profPropsToConvert) {
                delete currProps[oldPropName];
                currProps[newPropName] = propValue;
            }

            // iterate through the secure property names of the current profile
            const currSecProps = convertedConfig.profiles[currProfNm].secure;
            for (let secInx = 0; secInx < currSecProps.length; secInx++) {
                // iterate through the set of names that we must convert
                for (const [oldPropName, newPropName] of nameConversions) {
                    if (currSecProps[secInx] === oldPropName) {
                        currSecProps[secInx] = newPropName;

                        /* We replaced this secure property name.
                         * No need to look for more name conversions on this name.
                         */
                        break;
                    }
                }
            }
        } // end for all profiles
    } // end convertPropNames

    /**
     * Returns empty value that is appropriate for the property type.
     * @param propType The type of profile property
     * @returns Null or empty object
     */
    private static getDefaultValue(propType: string | string[]): any {
        // TODO How to handle profile property with multiple types
        if (Array.isArray(propType)) {
            propType = propType[0];
        }
        switch (propType) {
            case "string":  return "";
            case "number":  return 0;
            case "object":  return {};
            case "array":   return [];
            case "boolean": return false;
            default:        return null;
        }
    }

    /**
     * Retrieve info about old plug-ins and their overrides.
     * @returns IOldPluginInfo
     *          plugins   - List of CLI plug-ins to uninstall
     *          overrides - List of overrides to replace in app settings
     */
    private static getOldPluginInfo(): IOldPluginInfo {
        const oldScsPluginNm = "@zowe/secure-credential-store-for-zowe-cli";
        const pluginInfo: IOldPluginInfo = {
            plugins: [],
            overrides: []
        };

        // if the old SCS plugin is our credential manager, record that it should be replaced
        const credMgrKey = "CredentialManager";
        let currCredMgr;
        try {
            currCredMgr = AppSettings.instance.get("overrides", credMgrKey);
        } catch(error) {
            currCredMgr = null;
        }
        if (currCredMgr != null) {
            // we leave the 'false' indicator to use no credMgr in place
            if (currCredMgr !== false) {
                // if any of the old SCS credMgr names are found, record that we want to replace the credMgr
                const oldScsOverrideNames = [oldScsPluginNm, "Zowe-Plugin", "Broadcom-Plugin"];
                for (const oldOverrideName of oldScsOverrideNames) {
                    if (currCredMgr.includes(oldOverrideName)) {
                        pluginInfo.overrides.push(credMgrKey);
                        break;
                    }
                }
            }
        }

        try {
            // Only record the need to uninstall the SCS plug-in if it is currently installed
            if (oldScsPluginNm in PluginIssues.instance.getInstalledPlugins()) {
                pluginInfo.plugins.push(oldScsPluginNm);
            }
        } catch (error) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                error.message
            );
        }

        return pluginInfo;
    }

    /**
     * Get the number of old profiles present in the CLI home dir.
     * @param profilesRootDir Root profiles directory
     * @returns Number of old profiles found
     */
    private static getOldProfileCount(profilesRootDir: string): number {
        const profileTypes = V1ProfileConversion.getAllProfileDirectories(profilesRootDir);
        let oldProfileCount = 0;
        for (const profileType of profileTypes) {
            const profileTypeDir = path.join(profilesRootDir, profileType);
            const profileNames = V1ProfileConversion.getAllProfileNames(profileTypeDir, ".yaml", `${profileType}_meta`);
            oldProfileCount += profileNames.length;
        }
        return oldProfileCount;
    }

    /**
     * Lazy load zoweKeyRing, and verify that the credential vault is able to be accessed,
     * or whether there is a problem.
     * @returns true if credential vault is available, false if it is not
     */
    private static async checkZoweKeyRingAvailable(): Promise<boolean> {
        let success: boolean = false;
        const requireOpts: any = {};
        if (process.mainModule?.filename != null) {
            requireOpts.paths = [process.mainModule.filename];
        }
        try {
            const zoweSecretsPath = require.resolve("@zowe/secrets-for-zowe-sdk", requireOpts);
            ConfigBuilder.zoweKeyRing = (await import(zoweSecretsPath)).keyring;
            await ConfigBuilder.zoweKeyRing.findCredentials(CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);
            success = true;
        } catch (err) {
            success = false;
        }
        return success;
    }

    /**
     * Locate the names of secured properties stored under an account in the operating
     * system's credential vault.
     * @param acct The account to search for in the credential store
     * @param convertMsgs The set of conversion messages to which we can add new messages
     * @returns a list of secured properties stored under the specified account
     */
    private static async findOldSecureProps(acct: string): Promise<string[]> {
        const oldSecurePropNames: string[] = [];
        try {
            const credentialsArray = await ConfigBuilder.zoweKeyRing.findCredentials(acct);
            for (const element of credentialsArray) {
                oldSecurePropNames.push(element.account);
            }
        } catch (error) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE,
                `Encountered an error while gathering profiles for service '${acct}':`
            );

            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                error.message
            );
        }
        return oldSecurePropNames;
    }

    /**
     * Delete the secure property specified from the operating system credential vault.
     * @param acct The account the property is stored under
     * @param propName The name of the property to delete
     * @param convertMsgs The set of conversion messages to which we can add new messages
     * @returns true if the property was deleted successfully
     */
    private static async deleteOldSecureProps(acct: string, propName: string): Promise<boolean> {
        let success = false;
        try {
            success = await ConfigBuilder.zoweKeyRing.deletePassword(acct, propName);
        } catch (error) {
            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE,
                `Encountered an error while deleting secure data for service '${acct}/${propName}':`
            );

            ConfigBuilder.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                error.message
            );
            success = false;
        }
        return success;
    }

    /**
     * Add a new message to the V1 profile conversion messages.
     * @param msgFormat Formatting clues for the message.
     * @param msgText Unformatted text of the message.
     */
    private static addToConvertMsgs(msgFormat: number, msgText: string): void {
        if (msgFormat && ConvertMsgFmt.ERROR_LINE) {
            Logger.getImperativeLogger().error(msgText);
        }
        const newMsg = new ConvertMsg(msgFormat, msgText);
        ConfigBuilder.convertResult.msgs.push(newMsg);

    }
}
