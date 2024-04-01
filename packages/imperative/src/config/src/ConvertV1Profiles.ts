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
import { ImperativeConfig } from "../../utilities";
import { PluginIssues } from "../../imperative/src/plugins/utilities/PluginIssues";
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

export class ConvertV1Profiles {
    private static readonly noCfgFilePathNm: string = "CouldNotGetPathToConfigFile";

    private static convertOpts: IConvertV1ProfOpts = null;
    private static convertResult: IConvertV1ProfResult = null;
    private static profilesRootDir: string = "NotYetSet";
    private static oldProfilesDir: string = "NotYetSet";
    private static zoweKeyRing: typeof keyring = undefined;

    /**
     * Convert V1 profiles into a current zowe client config.
     *      Remove old credential manager overrides.
     *      Uninstall old SCS plugin.
     *      Delete old V1 profiles if requested.
     *
     * Calling this function after having already converted, will not attempt to
     * convert again. However it will still delete the old profiles if requested.
     *
     * @param convertOpts Options that will control the conversion process.
     * @returns Result object into which messages and stats are stored.
     */
    public static async convert(convertOpts: IConvertV1ProfOpts): Promise<IConvertV1ProfResult> {
        // initialize our result, which will be used by our utility functions, and returned by us
        ConvertV1Profiles.convertResult = {
            msgs: [],
            v1ScsPluginName: null,
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

            if (ConvertV1Profiles.isConversionNeeded()) {
                await ConvertV1Profiles.moveV1ProfilesToConfigFile();
                ConvertV1Profiles.removeOldOverrides();
            }

            if (convertOpts.deleteV1Profs){
                await ConvertV1Profiles.deleteV1Profiles();
            }
        } catch (error) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                "Encountered the following error while trying to convert V1 profiles:"
            );
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                stripAnsi(error.message)
            );
        }

        return ConvertV1Profiles.convertResult;
    }

    /**
     * Detect whether we must convert any V1 profiles to a zowe client configuration.
     * @returns True means we must do a conversion. False otherwise.
     */
    private static isConversionNeeded(): boolean {
        ConvertV1Profiles.convertResult.numProfilesFound = 0;
        let doConversion: boolean = false;

        if (ImperativeConfig.instance.config?.exists) {
            // We do not convert if we already have an existing zowe client config
            ConvertV1Profiles.putCfgFileNmInResult(ImperativeConfig.instance.config);
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE,
                `A current Zowe client configuration was found at ${ConvertV1Profiles.convertResult.cfgFilePathNm}. ` +
                `V1 profiles will not be converted.`
            );
        } else {
            // with no client config, the existence of old V1 profiles dictates if we will convert
            ConvertV1Profiles.convertResult.numProfilesFound = ConvertV1Profiles.getOldProfileCount(
                ConvertV1Profiles.profilesRootDir
            );
            if (ConvertV1Profiles.convertResult.numProfilesFound === 0) {
                ConvertV1Profiles.addToConvertMsgs(
                    ConvertMsgFmt.ERROR_LINE,
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
    private static async moveV1ProfilesToConfigFile(): Promise<void> {
        const convertedConfig: IConfig = Config.empty();

        /* Only the convert-profiles command is able to disable the credential manager
         * and reload it. For all other commands, the credential manager is loaded in
         * `Imperative.init` and frozen with `Object.freeze` so cannot be modified later on.
         *
         * Todo: Determine how we can also reload credMgr when called from ZE.
         */
        await OverridesLoader.ensureCredentialManagerLoaded();

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
                        ...(ConvertV1Profiles.convertResult.profilesConverted[profileType] || []), profileName
                    ];
                } catch (error) {
                    ConvertV1Profiles.convertResult.profilesFailed.push({ name: profileName, type: profileType, error });
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
                `Failed to convert ${ConvertV1Profiles.convertResult.profilesFailed.length} profile(s). See details below:`
            );
            for (const { name, type, error } of ConvertV1Profiles.convertResult.profilesFailed) {
                if (name != null) {
                    ConvertV1Profiles.addToConvertMsgs(
                        ConvertMsgFmt.ERROR_LINE,
                        `Failed to load ${ type } profile "${name}"`
                    );
                } else {
                    ConvertV1Profiles.addToConvertMsgs(
                        ConvertMsgFmt.ERROR_LINE,
                        `Failed to find default ${type} profile.`
                    );
                }
                ConvertV1Profiles.addToConvertMsgs(
                    ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                    stripAnsi(error.message)
                );
            }
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
        const newConfig = ImperativeConfig.instance.config;
        newConfig.api.layers.activate(false, true);
        newConfig.api.layers.merge(convertedConfig);
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
                ConvertV1Profiles.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE,
                    `If you want to restore your V1 profiles (to convert them again), ` +
                    `rename the 'profiles-old' directory to 'profiles' and delete the new config file ` +
                    `located at ${ConvertV1Profiles.convertResult.cfgFilePathNm}.`
                );
            }
        } catch (error) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                `Failed to rename profiles directory to ${ConvertV1Profiles.oldProfilesDir}:`
            );
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                error.message
            );
        }

        ConvertV1Profiles.addToConvertMsgs(
            ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
            `Your new profiles have been saved to ${ConvertV1Profiles.convertResult.cfgFilePathNm}.`
        );
        ConvertV1Profiles.addToConvertMsgs(
            ConvertMsgFmt.REPORT_LINE,
            "To make changes, edit that file in an editor of your choice."
        );
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
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE,
                "Failed to retrieve the path to the config file."
            );
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                error.message
            );
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
            removeSync(ConvertV1Profiles.oldProfilesDir);
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
                `Deleted the profiles directory '${ConvertV1Profiles.oldProfilesDir}'.`
            );
        } catch (error) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                `Failed to delete the profiles directory '${ConvertV1Profiles.oldProfilesDir}'`
            );
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                error.message
            );
        }

        // Delete the securely stored credentials
        const isZoweKeyRingAvailable = await ConvertV1Profiles.checkZoweKeyRingAvailable();
        if (isZoweKeyRingAvailable) {
            const knownServices = ["@brightside/core", "@zowe/cli", "Zowe-Plugin", "Broadcom-Plugin", "Zowe"];
            for (const service of knownServices) {
                const accounts = await ConvertV1Profiles.findOldSecureProps(service);
                for (const account of accounts) {
                    if (!account.includes("secure_config_props")) {
                        const success = await ConvertV1Profiles.deleteOldSecureProps(service, account);
                        const errMsgTrailer = `secure value for "${service}/${account}".`;
                        if (success) {
                            ConvertV1Profiles.addToConvertMsgs(
                                ConvertMsgFmt.REPORT_LINE | ConvertMsgFmt.PARAGRAPH,
                                `Deleted ${errMsgTrailer}.`
                            );
                        } else {
                            ConvertV1Profiles.addToConvertMsgs(
                                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                                `Failed to delete ${errMsgTrailer}.`
                            );
                        }
                    }
                }
            }
        } else {
            ConvertV1Profiles.addToConvertMsgs(
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
        const oldPluginInfo = ConvertV1Profiles.getOldPluginInfo();
        for (const override of oldPluginInfo.overrides) {
            if (override === "CredentialManager") {
                try {
                    AppSettings.instance.set("overrides", "CredentialManager", CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);
                    if (ImperativeConfig.instance.loadedConfig.overrides.CredentialManager != null) {
                        delete ImperativeConfig.instance.loadedConfig.overrides.CredentialManager;
                    }
                } catch (error) {
                    ConvertV1Profiles.addToConvertMsgs(
                        ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                        "Failed to replace credential manager override setting."
                    );
                    ConvertV1Profiles.addToConvertMsgs(
                        ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                        stripAnsi(error.message)
                    );
                }
            }
        }

        // Report any plugin that we will uninstall
        if (oldPluginInfo.plugins.length > 0) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.REPORT_LINE,
                "The following plug-ins will be removed because they are now part of the core CLI and are no longer needed:"
            );

            for (const nextPlugin of oldPluginInfo.plugins) {
                ConvertV1Profiles.addToConvertMsgs(
                    ConvertMsgFmt.REPORT_LINE,
                    nextPlugin
                );
            }
        }

        /* We only had one override in V1 - the old SCS plugin.
         * So, despite the array for multiple plugins, we just report
         * the first plugin name in the array as the plugin that our
         * caller should uninstall.
         */
        ConvertV1Profiles.convertResult.v1ScsPluginName =
            (oldPluginInfo.plugins.length > 0) ? oldPluginInfo.plugins[0] : null;
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
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                `Failed trying to read '${credMgrKey}' overrides.`
            );
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
                stripAnsi(error.message)
            );
        }

        // we leave the 'false' indicator unchanged to allow for the use of no credMgr
        if (typeof currCredMgr === "string") {
            // if any of the old SCS credMgr names are found, record that we want to replace the credMgr
            for (const oldOverrideName of [oldScsPluginNm, "Zowe-Plugin", "Broadcom-Plugin"]) {
                if (currCredMgr.includes(oldOverrideName)) {
                    pluginInfo.overrides.push(credMgrKey);
                    break;
                }
            }
        }

        try {
            // Only record the need to uninstall the SCS plug-in if it is currently installed
            if (oldScsPluginNm in PluginIssues.instance.getInstalledPlugins()) {
                pluginInfo.plugins.push(oldScsPluginNm);
            }
        } catch (error) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.PARAGRAPH,
                "Failed trying to get the set of installed plugins."
            );
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT,
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
            ConvertV1Profiles.zoweKeyRing = (await import(zoweSecretsPath)).keyring;
            await ConvertV1Profiles.zoweKeyRing.findCredentials(CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);
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
            const credentialsArray = await ConvertV1Profiles.zoweKeyRing.findCredentials(acct);
            for (const element of credentialsArray) {
                oldSecurePropNames.push(element.account);
            }
        } catch (error) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE,
                `Encountered an error while gathering secure properties for service '${acct}':`
            );
            ConvertV1Profiles.addToConvertMsgs(
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
            success = await ConvertV1Profiles.zoweKeyRing.deletePassword(acct, propName);
        } catch (error) {
            ConvertV1Profiles.addToConvertMsgs(
                ConvertMsgFmt.ERROR_LINE,
                `Encountered an error while deleting secure data for service '${acct}/${propName}':`
            );
            ConvertV1Profiles.addToConvertMsgs(
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
        ConvertV1Profiles.convertResult.msgs.push(newMsg);

    }
}
