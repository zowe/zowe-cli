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
import { readFileSync } from "jsonfile";
import { removeSync } from "fs-extra";
import stripAnsi = require("strip-ansi");
import { V1ProfileRead, ProfilesConstants, ProfileUtils } from "../../profiles";
import { Config } from "./Config";
import { IConfig } from "./doc/IConfig";
import { CredentialManagerFactory } from "../../security";
import { IConvertV1ProfOpts, ConvertMsg, ConvertMsgFmt, IConvertV1ProfResult } from "./doc/IConvertV1Profiles";
import { IImperativeOverrides } from "../../imperative/src/doc/IImperativeOverrides";
import { keyring } from "@zowe/secrets-for-zowe-sdk";
import { AppSettings } from "../../settings";
import { ISettingsFile } from "../../settings/src/doc/ISettingsFile";
import { ImperativeConfig } from "../../utilities";
import { CredentialManagerOverride } from "../../security/src/CredentialManagerOverride";
import { OverridesLoader } from "../../imperative/src/OverridesLoader";
import { ConfigSchema } from "./ConfigSchema";
import { ProfileInfo } from "./ProfileInfo";
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

export class ConvertV1Profiles {
    private static readonly noCfgFilePathNm: string = "CouldNotGetPathToConfigFile";
    private static readonly credMgrKey: string = "CredentialManager";
    private static readonly oldScsPluginNm = "@zowe/secure-credential-store-for-zowe-cli";
    private static readonly builtInCredMgrNm: string = "@zowe/cli";

    private static profileInfo: ProfileInfo = null;
    private static oldScsPluginWasConfigured: boolean = false;
    private static convertOpts: IConvertV1ProfOpts = null;
    private static convertResult: IConvertV1ProfResult = null;
    private static profilesRootDir: string = "NotYetSet";
    private static oldProfilesDir: string = "NotYetSet";
    private static zoweKeyRing: typeof keyring = undefined;

    /**
     * Convert V1 profiles into a zowe.config.json file.
     *
     * It will also do the following:
     *    Create a zowe.schema.json file.
     *    Migrate V1 secure properties into the current consolidated Zowe client secure properties.
     *    Replace old SCS-plugin credential manager override with the Zowe embedded SCS.
     *    Delete old V1 profiles (and old V1 secure properties) if requested.
     *
     * Calling this function after having already converted, will not attempt to
     * convert again. However it will still delete the old profiles if requested.
     *
     * You should **NOT** initialize the secure credential manager before calling this function.
     * The CredMgr can only be initialized once. If the old V1 SCS-plugin happens to be configured
     * as the CredMgr when this function is called, the old V1 SCS-plugin CredMgr is unable
     * to create the current consolidated Zowe client secure properties. Users will have to
     * re-enter all of their credentials.
     *
     * @param convertOpts Options that will control the conversion process.
     * @returns Result object into which messages and stats are stored.
     */
    public static async convert(convertOpts: IConvertV1ProfOpts): Promise<IConvertV1ProfResult> {
        ConvertV1Profiles.profileInfo = convertOpts.profileInfo;

        // initialize our result, which will be used by our utility functions, and returned by us
        ConvertV1Profiles.convertResult = {
            msgs: [],
            v1ScsPluginName: null,
            credsWereMigrated: true,
            cfgFilePathNm: ConvertV1Profiles.noCfgFilePathNm,
            numProfilesFound: 0,
            profilesConverted: {},
            profilesFailed: []
        };

        // record our conversion options so that our utility functions can access them
        ConvertV1Profiles.convertOpts = convertOpts;

        try {
            ConvertV1Profiles.profilesRootDir = ProfileUtils.constructProfilesRootDirectory(ImperativeConfig.instance.cliHome);
            ConvertV1Profiles.oldProfilesDir = `${ConvertV1Profiles.profilesRootDir.replace(/[\\/]$/, "")}-old`;

            if (await ConvertV1Profiles.isConversionNeeded()) {
                ConvertV1Profiles.replaceOldCredMgrOverride();
                await ConvertV1Profiles.initCredMgr();
                await ConvertV1Profiles.moveV1ProfilesToConfigFile();
            }

            if (convertOpts.deleteV1Profs) {
                await ConvertV1Profiles.deleteV1Profiles();
            }

            // Report if the old SCS plugin should be uninstalled
            if (ConvertV1Profiles.convertResult.v1ScsPluginName != null) {
                let verb = "will";
                if (ConvertV1Profiles.profileInfo) {
                    verb = "should";
                }
                let uninstallMsg: string = `The obsolete plug-in ${ConvertV1Profiles.convertResult.v1ScsPluginName} ` +
                    `${verb} be uninstalled because the SCS is now embedded within the Zowe clients.`;

                if (ConvertV1Profiles.profileInfo) {
                    uninstallMsg += ` Zowe CLI plugins can only be uninstalled by the CLI. Use the command ` +
                        `'zowe plugins uninstall ${ConvertV1Profiles.convertResult.v1ScsPluginName}'.`;
                }
                ConvertV1Profiles.addToConvertMsgs(ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH, uninstallMsg);
            }
        } catch (error) {
            ConvertV1Profiles.addExceptionToConvertMsgs("Encountered the following error while trying to convert V1 profiles:", error);
        }

        return ConvertV1Profiles.convertResult;
    }

    /**
     * Detect whether we must convert any V1 profiles to a zowe client configuration.
     * @returns True means we must do a conversion. False otherwise.
     */
    private static async isConversionNeeded(): Promise<boolean> {
        ConvertV1Profiles.convertResult.numProfilesFound = 0;

        if (ImperativeConfig.instance.config == null) {
            // Initialization for VSCode extensions does not create the config property, so create it now.
            ImperativeConfig.instance.config = await Config.load(
                ImperativeConfig.instance.loadedConfig.name,
                {
                    homeDir: ImperativeConfig.instance.loadedConfig.defaultHome
                }
            );
        }

        if (ImperativeConfig.instance.config?.exists) {
            // We do not convert if we already have an existing zowe client config
            ConvertV1Profiles.putCfgFileNmInResult(ImperativeConfig.instance.config);
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE,
                `Did not convert any V1 profiles because a current Zowe client configuration ` +
                `was found at ${ConvertV1Profiles.convertResult.cfgFilePathNm}.`
            );
        } else {
            // with no client config, the existence of old V1 profiles dictates if we will convert
            const noProfilesMsg = `Did not convert any V1 profiles because no V1 profiles were found at ` +
                `${ConvertV1Profiles.profilesRootDir}.`;
            try {
                ConvertV1Profiles.convertResult.numProfilesFound =
                    ConvertV1Profiles.getOldProfileCount(ConvertV1Profiles.profilesRootDir);
                if (ConvertV1Profiles.convertResult.numProfilesFound === 0) {
                    ConvertV1Profiles.addToConvertMsgs(ConvertMsgFmt.REPORT_LINE, noProfilesMsg);
                }
            } catch (error) {
                // did the profiles directory not exist?
                if (error?.additionalDetails?.code === "ENOENT") {
                    ConvertV1Profiles.addToConvertMsgs(ConvertMsgFmt.REPORT_LINE, noProfilesMsg);
                } else {
                    // must have been some sort of I/O error
                    ConvertV1Profiles.addExceptionToConvertMsgs(
                        `Failed to get V1 profiles in ${ConvertV1Profiles.profilesRootDir}.`, error
                    );
                }
            }
        }
        return ConvertV1Profiles.convertResult.numProfilesFound > 0;
    }

    /**
     * Replace any detected oldCredMgr override entry in settings.json with the Zowe embedded credMgr.
     *
     * After the replacement of the credential manager override, we can then initialize
     * credential manager later in this class.
     */
    private static replaceOldCredMgrOverride(): void {
        const oldPluginInfo = ConvertV1Profiles.getOldPluginInfo();
        for (const override of oldPluginInfo.overrides) {
            if (override === ConvertV1Profiles.credMgrKey) {
                try {
                    AppSettings.instance.set("overrides", ConvertV1Profiles.credMgrKey, CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);
                    if (ImperativeConfig.instance.loadedConfig.overrides?.CredentialManager != null) {
                        delete ImperativeConfig.instance.loadedConfig.overrides.CredentialManager;
                    }
                } catch (error) {
                    ConvertV1Profiles.convertResult.credsWereMigrated = false;
                    ConvertV1Profiles.addExceptionToConvertMsgs("Failed to replace credential manager override setting.", error);
                }
            }
        }

        /* We only had one override in V1 - the old SCS plugin.
         * So, despite the array for multiple plugins, we just report
         * the first plugin name in the array as the plugin that our
         * caller should uninstall.
         */
        ConvertV1Profiles.convertResult.v1ScsPluginName =
            oldPluginInfo.plugins.length > 0 ? oldPluginInfo.plugins[0] : null;
    }

    /**
     * Initialize credential manager so that we can migrate the secure properties that are
     * stored for V1 profiles to new secure properties for the converted config that we will create.
     *
     * For all CLI commands other than convert-profiles, the credential manager is loaded in
     * Imperative.init and frozen with Object.freeze so it cannot be modified later on.
     * Because convert-profiles cannot create new secure properties for the converted config
     * (if the old SCS plugin credMgr is already loaded), Imperative.init does not load the
     * credential manager for the convert-profiles command.
     *
     * VSCode extensions must also avoid initializing the Credential Manager before calling
     * ConvertV1Profiles.convert.
     *
     * If we encounter an error when trying to initialize the credential manager, we report (through
     * ConvertV1Profiles.convertResult.credsWereMigrated) that creds were not migrated.
     */
    private static async initCredMgr(): Promise<void> {
        if (CredentialManagerFactory.initialized) {
            if (ConvertV1Profiles.oldScsPluginWasConfigured) {
                Logger.getImperativeLogger().error(
                    `Credential manager has already been initialized with the old SCS plugin ` +
                    `${ConvertV1Profiles.oldScsPluginNm}. Old credentials cannot be migrated.`
                );
            }
        } else {
            // we must initialize credMgr to get and store credentials
            try {
                if (ConvertV1Profiles.profileInfo) {
                    // Initialize CredMgr using the profileInfo object supplied by a VS Code extension
                    await ConvertV1Profiles.profileInfo.readProfilesFromDisk();
                } else {
                    // Initialize CredMgr using CLI techniques.
                    await OverridesLoader.load(ImperativeConfig.instance.loadedConfig,
                        ImperativeConfig.instance.callerPackageJson
                    );
                }
            } catch (error) {
                ConvertV1Profiles.convertResult.credsWereMigrated = false;
                ConvertV1Profiles.addExceptionToConvertMsgs("Failed to initialize CredentialManager", error);
            }
        }
    }

    /**
     * Move the contents of existing v1 profiles to a zowe client config file.
     *
     * @returns The path name to the new zowe client config file (null upon failure).
     */
    private static async moveV1ProfilesToConfigFile(): Promise<void> {
        const convertedConfig: IConfig = Config.empty();

        for (const profileType of V1ProfileRead.getAllProfileDirectories(ConvertV1Profiles.profilesRootDir)) {
            const profileTypeDir = path.join(ConvertV1Profiles.profilesRootDir, profileType);
            const profileNames = V1ProfileRead.getAllProfileNames(profileTypeDir, ".yaml", `${profileType}_meta`);
            if (profileNames.length === 0) {
                continue;
            }

            for (const profileName of profileNames) {
                try {
                    const profileFilePath = path.join(profileTypeDir, `${profileName}.yaml`);
                    const profileProps = V1ProfileRead.readProfileFile(profileFilePath, profileType);
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

                    ConvertV1Profiles.convertResult.profilesConverted[profileType] = [
                        ...ConvertV1Profiles.convertResult.profilesConverted[profileType] || [], profileName
                    ];
                } catch (error) {
                    ConvertV1Profiles.convertResult.credsWereMigrated = false;
                    ConvertV1Profiles.convertResult.profilesFailed.push({ name: profileName, type: profileType, error });
                    ConvertV1Profiles.addExceptionToConvertMsgs(
                        `Failed to read '${profileType}' profile named '${profileName}'`, error
                    );
                }
            }

            try {
                const metaFilePath = path.join(profileTypeDir, `${profileType}_meta.yaml`);
                const profileMetaFile = V1ProfileRead.readMetaFile(metaFilePath);
                if (profileMetaFile.defaultProfile != null) {
                    convertedConfig.defaults[profileType] = ProfileUtils.getProfileMapKey(profileType, profileMetaFile.defaultProfile);
                }
            } catch (error) {
                ConvertV1Profiles.convertResult.profilesFailed.push({ type: profileType, error });
                ConvertV1Profiles.addExceptionToConvertMsgs(`Failed to find default '${profileType}' profile.`, error);
            }
        }

        // convert profile property names that were changed starting in V2
        ConvertV1Profiles.convertPropNames(convertedConfig);
        convertedConfig.autoStore = true;

        // report the successfully converted profiles
        for (const [k, v] of Object.entries(ConvertV1Profiles.convertResult.profilesConverted)) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE,
                `Converted ${k} profiles: ${v.join(", ")}`
            );
        }

        // report the profiles that we failed to convert
        if (ConvertV1Profiles.convertResult.profilesFailed.length > 0) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                `Unable to convert ${ConvertV1Profiles.convertResult.profilesFailed.length} profile(s).`
            );
        }

        await ConvertV1Profiles.createNewConfigFile(convertedConfig);
    }

    /**
     * Create a new zowe client config file from an IConfig object.
     * Store the name of the new config file in our convertResult object.
     *
     * @param convertedConfig IConfig object created as a result of V1 profile conversion.
     * @returns string - Path name to the newly created config file.
     */
    private static async createNewConfigFile(convertedConfig: IConfig): Promise<void> {
        if (typeof ImperativeConfig.instance.config.mVault === "undefined" ||
            ImperativeConfig.instance.config.mVault === null ||
            Object.keys(ImperativeConfig.instance.config.mVault).length == 0
        ) {
            // Either the vault does not exist or it is empty. So create a vault.
            ImperativeConfig.instance.config.mVault = {
                load: (key: string): Promise<string> => {
                    return CredentialManagerFactory.manager.load(key, true);
                },
                save: (key: string, value: any): Promise<void> => {
                    return CredentialManagerFactory.manager.save(key, value);
                }
            };
        }

        const newConfig = ImperativeConfig.instance.config;
        newConfig.api.layers.activate(false, true);
        newConfig.api.layers.merge(convertedConfig);
        ConvertV1Profiles.loadV1Schemas();
        ConfigSchema.updateSchema();
        await newConfig.save();
        ConvertV1Profiles.putCfgFileNmInResult(newConfig);

        try {
            fs.renameSync(ConvertV1Profiles.profilesRootDir, ConvertV1Profiles.oldProfilesDir);

            // Only tell the user about moving the V1 profiles if we are NOT going to delete them
            if (!ConvertV1Profiles.convertOpts.deleteV1Profs) {
                ConvertV1Profiles.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
                    `Your old V1 profiles have been moved to ${ConvertV1Profiles.oldProfilesDir}. ` +
                    `Delete them by re-running this operation and requesting deletion.`
                );
            }
        } catch (error) {
            ConvertV1Profiles.addExceptionToConvertMsgs(
                `Failed to rename profiles directory to ${ConvertV1Profiles.oldProfilesDir}:`, error
            );
        }

        ConvertV1Profiles.addToConvertMsgs(
            ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
            `Your new profiles have been saved to ${ConvertV1Profiles.convertResult.cfgFilePathNm}. ` +
            `To change your configuration, update that file in your text editor.`
        );
    }

    /**
     * Load V1 profile schemas, which will not have been loaded for VSCode extensions.
     */
    private static loadV1Schemas(): void {
        if (!Object.hasOwn(ImperativeConfig.instance.loadedConfig, "profiles")) {
            // since no schemas are loaded, we read them from the V1 profiles directory
            ImperativeConfig.instance.loadedConfig.profiles = [];
            const v1ProfileTypes = fs.existsSync(ConvertV1Profiles.profilesRootDir) ?
                V1ProfileRead.getAllProfileDirectories(ConvertV1Profiles.profilesRootDir) : [];

            for (const profType of v1ProfileTypes) {
                const schemaFileNm = path.join(ConvertV1Profiles.profilesRootDir, profType, profType + "_meta.yaml");
                if (fs.existsSync(schemaFileNm)) {
                    try {
                        const schemaContent = V1ProfileRead.readMetaFile(schemaFileNm);
                        ImperativeConfig.instance.loadedConfig.profiles.push(schemaContent.configuration);
                    } catch (error) {
                        ConvertV1Profiles.addExceptionToConvertMsgs(
                            `Failed to load schema for profile type ${profType} from file ${schemaFileNm}`, error
                        );
                    }
                }
            }
        }
    }

    /**
     * Put the path name to the config file, obtained from the supplied Config object,
     * into our result object.
     *
     * @param configForPath The config object from which we will extract the path.
     */
    private static putCfgFileNmInResult(configForPath: Config): void {
        try {
            ConvertV1Profiles.convertResult.cfgFilePathNm = configForPath?.layerActive().path;
        } catch (error) {
            ConvertV1Profiles.addExceptionToConvertMsgs("Failed to retrieve the path to the config file.", error);
        }
        if (!ConvertV1Profiles.convertResult.cfgFilePathNm) {
            ConvertV1Profiles.convertResult.cfgFilePathNm = ConvertV1Profiles.noCfgFilePathNm;
        }
    }

    /**
     * Delete the V1 profiles that have been converted.
     * We also delete the secure credentials stored for those V1 profiles.
     */
    private static async deleteV1Profiles(): Promise<void> {
        // Delete the profiles directory
        try {
            if (fs.existsSync(ConvertV1Profiles.oldProfilesDir)) {
                removeSync(ConvertV1Profiles.oldProfilesDir);
                ConvertV1Profiles.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
                    `Deleted the old profiles directory ${ConvertV1Profiles.oldProfilesDir}.`
                );
            } else {
                ConvertV1Profiles.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
                    `The old profiles directory ${ConvertV1Profiles.oldProfilesDir} did not exist.`
                );
            }
        } catch (error) {
            ConvertV1Profiles.addExceptionToConvertMsgs(
                `Failed to delete the profiles directory ${ConvertV1Profiles.oldProfilesDir}`, error
            );
        }

        // Delete the securely stored credentials
        if (await ConvertV1Profiles.isZoweKeyRingAvailable()) {
            let deleteMsgFormat: any = ConvertMsgFmt.PARAGRAPH;
            const knownServices = [ConvertV1Profiles.builtInCredMgrNm, "@brightside/core", "Zowe-Plugin", "Broadcom-Plugin", "Zowe"];
            for (const service of knownServices) {
                const accounts = await ConvertV1Profiles.findOldSecureProps(service);
                for (const account of accounts) {
                    if (!account.includes("secure_config_props")) {
                        const success = await ConvertV1Profiles.deleteOldSecureProps(service, account);
                        const errMsgTrailer = `obsolete secure value ${service}/${account}`;
                        if (success) {
                            ConvertV1Profiles.addToConvertMsgs(
                                ConvertMsgFmt.REPORT_LINE | deleteMsgFormat,
                                `Deleted ${errMsgTrailer}.`
                            );
                        } else {
                            ConvertV1Profiles.addToConvertMsgs(
                                ConvertMsgFmt.ERROR_LINE | deleteMsgFormat,
                                `Failed to delete ${errMsgTrailer}.`
                            );
                        }

                        // only start a new paragraph on our first delete message
                        deleteMsgFormat = 0;
                    }
                }
            }
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
     * Retrieve info about old plug-ins and their overrides.
     * @returns IOldPluginInfo
     *          plugins   - List of CLI plug-ins to uninstall
     *          overrides - List of overrides to replace in app settings
     */
    private static getOldPluginInfo(): IOldPluginInfo {
        const pluginInfo: IOldPluginInfo = {
            plugins: [],
            overrides: []
        };

        // if the old SCS plugin is our credential manager, record that it should be replaced
        let currCredMgr;
        try {
            // have AppSettings been initialized?
            AppSettings.instance;
        } catch (error) {
            let settingsFile: string = "NotSetYet";
            try {
                // A VSCode extension will not have initialized AppSettings, so initialize it now
                settingsFile = path.join(ImperativeConfig.instance.cliHome, "settings", "imperative.json");
                const defaultSettings: ISettingsFile = {
                    overrides: {}
                } as any;
                defaultSettings.overrides[ConvertV1Profiles.credMgrKey] = ConvertV1Profiles.builtInCredMgrNm;
                AppSettings.initialize(settingsFile, defaultSettings);
            } catch(error) {
                currCredMgr = null;
                ConvertV1Profiles.addExceptionToConvertMsgs(
                    `Failed to initialize AppSettings overrides from ${settingsFile}.`, error
                );
            }
        }

        // get the current credMgr from AppSettings
        try {
            currCredMgr = AppSettings.instance.get("overrides", ConvertV1Profiles.credMgrKey);
        } catch(error) {
            currCredMgr = null;
            ConvertV1Profiles.addExceptionToConvertMsgs(
                `Failed trying to read '${ConvertV1Profiles.credMgrKey}' overrides.`, error
            );
        }

        // we leave the 'false' indicator unchanged to allow for the use of no credMgr
        if (typeof currCredMgr === "string") {
            // if any of the old SCS credMgr names are found, record that we want to replace the credMgr
            for (const oldOverrideName of [
                ConvertV1Profiles.oldScsPluginNm, "KeytarCredentialManager", "Zowe-Plugin", "Broadcom-Plugin"])
            {
                if (currCredMgr.includes(oldOverrideName)) {
                    ConvertV1Profiles.oldScsPluginWasConfigured = true;
                    pluginInfo.overrides.push(ConvertV1Profiles.credMgrKey);
                    break;
                }
            }
        }

        try {
            // Only record the need to uninstall the SCS plug-in if it is currently installed
            if (ConvertV1Profiles.isPluginInstalled(ConvertV1Profiles.oldScsPluginNm)) {
                pluginInfo.plugins.push(ConvertV1Profiles.oldScsPluginNm);
            }
        } catch (error) {
            // report all errors except the absence of the plugins.json file
            if (!error.message.includes("ENOENT")) {
                ConvertV1Profiles.addExceptionToConvertMsgs("Failed trying to get the set of installed plugins.", error);
            }
        }

        return pluginInfo;
    }

    /**
     * Report whether the specified plugin is installed.
     * @param pluginName name of the plugin to search for.
     * @returns True if plugin is installed. False otherwise.
     */
    private static isPluginInstalled(pluginName: string): boolean {
        let pluginsFileNm: string;
        try {
            pluginsFileNm = path.join(ImperativeConfig.instance.cliHome, "plugins", "plugins.json");
            const pluginsFileJson = readFileSync(pluginsFileNm);
            if (Object.hasOwn(pluginsFileJson, pluginName)) {
                return true;
            }
        }
        catch (ioErr) {
            ConvertV1Profiles.addExceptionToConvertMsgs(`Cannot read plugins file ${pluginsFileNm}`, ioErr);
        }
        return false;
    }

    /**
     * Get the number of old profiles present in the CLI home dir.
     * @param profilesRootDir Root profiles directory
     * @returns Number of old profiles found
     */
    private static getOldProfileCount(profilesRootDir: string): number {
        const profileTypes = V1ProfileRead.getAllProfileDirectories(profilesRootDir);
        let oldProfileCount = 0;
        for (const profileType of profileTypes) {
            const profileTypeDir = path.join(profilesRootDir, profileType);
            const profileNames = V1ProfileRead.getAllProfileNames(profileTypeDir, ".yaml", `${profileType}_meta`);
            oldProfileCount += profileNames.length;
        }
        return oldProfileCount;
    }

    /**
     * Verify that the credential vault is accessible, or whether there is a problem.
     * @returns true if credential vault is available, false if it is not
     */
    private static async isZoweKeyRingAvailable(): Promise<boolean> {
        try {
            ConvertV1Profiles.zoweKeyRing = (await import("@zowe/secrets-for-zowe-sdk")).keyring;
            await ConvertV1Profiles.zoweKeyRing.findCredentials(CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);
        } catch (error) {
            ConvertV1Profiles.addExceptionToConvertMsgs(
                "Zowe keyring or the credential vault are unavailable. Unable to delete old secure values.", error
            );
            return false;
        }
        return true;
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
            const credentialsArray = await ConvertV1Profiles.zoweKeyRing.findCredentials(acct);
            for (const element of credentialsArray) {
                oldSecurePropNames.push(element.account);
            }
        } catch (error) {
            ConvertV1Profiles.convertResult.credsWereMigrated = false;
            ConvertV1Profiles.addExceptionToConvertMsgs(
                `Encountered an error while gathering secure properties for service '${acct}':`, error
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
            success = await ConvertV1Profiles.zoweKeyRing.deletePassword(acct, propName);
        } catch (error) {
            ConvertV1Profiles.addExceptionToConvertMsgs(
                `Encountered an error while deleting secure data for service '${acct}/${propName}':`, error
            );
            success = false;
        }
        return success;
    }

    /**
     * Add a new message to the V1 profile conversion messages that reports a caught exception.
     *
     * @param introMsg An introductory message describing what action was being attempted when we failed.
     * @param error The exception that we caught.
     */
    private static addExceptionToConvertMsgs(introMsg: string, error: Error): void {
        ConvertV1Profiles.addToConvertMsgs(ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH, introMsg);
        ConvertV1Profiles.addToConvertMsgs(ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT, "Reason: " + stripAnsi(error.message));
        if (Object.hasOwn(error, "stack")) {
            ConvertV1Profiles.addToConvertMsgs(ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT, stripAnsi(error.stack));
        }
    }

    /**
     * Add a new message to the V1 profile conversion messages.
     * @param msgFormat Formatting clues for the message.
     * @param msgText Unformatted text of the message.
     */
    private static addToConvertMsgs(msgFormat: number, msgText: string): void {
        if (msgFormat & ConvertMsgFmt.ERROR_LINE) {
            Logger.getImperativeLogger().error(msgText);
        }
        const newMsg = new ConvertMsg(msgFormat, msgText);
        ConvertV1Profiles.convertResult.msgs.push(newMsg);
    }
}
