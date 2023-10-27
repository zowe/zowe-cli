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

import * as path from "path";
import { readJsonSync, writeJsonSync } from "fs-extra";

import { ICredentialManagerNameMap } from "./doc/ICredentialManagerNameMap";
import { ImperativeConfig } from "../../utilities";
import { ImperativeError } from "../../error";
import { ISettingsFile } from "../../settings/src/doc/ISettingsFile";

/**
 * This class provides access to the known set of credential manager overrides
 * and functions to manipulate which credential manager is in use.
 * Other credential managers can replace the default credential manager.
 * Both CLI plugins and Zowe Explorer extensions can override the default
 * credential manager. However, only one credential manager will be in effect
 * on a given computer. The last component to override the credential
 * manager wins.
 */
export class CredentialManagerOverride {
    public static readonly CRED_MGR_SETTING_NAME: string = "CredentialManager";
    public static readonly DEFAULT_CRED_MGR_NAME: string = "@zowe/cli";

    private static readonly KNOWN_CRED_MGRS: ICredentialManagerNameMap[] = [
        {
            "credMgrDisplayName": this.DEFAULT_CRED_MGR_NAME
        },
        {
            "credMgrDisplayName": "Secrets for Kubernetes",
            "credMgrPluginName": "@zowe/secrets-for-kubernetes-for-zowe-cli",
            "credMgrZEName": "Zowe.secrets-for-kubernetes"
        }
    ];

    //________________________________________________________________________
    /**
     * Get the credential manager information for the specified credential manager
     * display name.
     *
     * @param credMgrDisplayName - display name of the credential manager
     *
     * @returns An ICredentialManagerNameMap or
     *          null if the specified plugin is not a known credential manager.
     */
    public static getCredMgrInfoByDisplayName(credMgrDisplayName: string) : ICredentialManagerNameMap | null {
        return this.KNOWN_CRED_MGRS.find((credMgr) => credMgr.credMgrDisplayName === credMgrDisplayName) ?? null;
    }

    //________________________________________________________________________
    /**
     * Get the credential manager information for the specified plugin.
     *
     * @param pluginName - Name of the plugin package
     *
     * @returns An ICredentialManagerNameMap or
     *          null if the specified plugin is not a known credential manager.
     */
    public static getCredMgrInfoByPlugin(pluginName: string) : ICredentialManagerNameMap | null {
        return this.KNOWN_CRED_MGRS.find((credMgr) => credMgr.credMgrPluginName === pluginName) ?? null;
    }

    //________________________________________________________________________
    /**
     * Get the credential manager information for the specified plugin.
     *
     * @param ZEExtName - Name of the Zowe Explorer extension
     *
     * @returns An ICredentialManagerNameMap or
     *          null if the specified extension is not a known credential manager.
     */
    public static getCredMgrInfoByZEExt(ZEExtName: string) : ICredentialManagerNameMap | null {
        return this.KNOWN_CRED_MGRS.find((credMgr) => credMgr.credMgrZEName === ZEExtName) ?? null;
    }

    //________________________________________________________________________
    /**
     * Get the known credential managers.
     *
     * @returns An array of credential managers.
     */
    public static getKnownCredMgrs() : ICredentialManagerNameMap[] {
        return this.KNOWN_CRED_MGRS;
    }

    /**
     * Record the specified credential manager in the configuration of overrides.
     * A plugin or ZE extension that provides a credential manager would record
     * its credential manager name upon installation.
     *
     * @param newCredMgrName
     *        The display name of your credential manager.
     *
     * @throws An ImperativeError upon error.
     */
    public static recordCredMgrInConfig(newCredMgrName: string) : void {
        const credMgrInfo: ICredentialManagerNameMap =
            CredentialManagerOverride.getCredMgrInfoByDisplayName(newCredMgrName);
        if (credMgrInfo === null) {
            /* We do not have a known credMgr. We do not permit overriding by an
             * unknown credMgr. Form a message of known credential managers.
             */
            throw new ImperativeError({
                msg: `The credential manager name '${newCredMgrName}' is an unknown ` +
                `credential manager. The previous credential manager will NOT be overridden. ` +
                `Valid credential managers are:` +
                this.KNOWN_CRED_MGRS.map(knownCredMgr => `\n${knownCredMgr.credMgrDisplayName}`).join('')
            });
        }

        // read in the existing settings file
        let settings: any;
        try {
            settings = this.getSettingsFileJson();
        } catch (error) {
            throw new ImperativeError({
                msg: "Due to error in settings file, unable to override the credential manager with '" +
                newCredMgrName + "'" +
                "\nReason: " + error.message
            });
        }

        // set to the new credMgr and write the settings file
        settings.json.overrides.CredentialManager = newCredMgrName;
        try {
            writeJsonSync(settings.fileName, settings.json, {spaces: 2});
        } catch (error) {
            throw new ImperativeError({
                msg: "Unable to write settings file = " + settings.fileName +
                "\nReason: " + error.message
            });
        }
    }

    //________________________________________________________________________
    /**
     * Record the default Zowe CLI credential manager in the configuration of
     * overrides. The specified credential manager will be replaced with the
     * default Zowe CLI credential manager. A plugin or ZE extension that provides
     * a credential manager would replace itself with the default credential
     * manager when it is being uninstalled.
     *
     * @param credMgrToReplace
     *        The display name of your credential manager. This name must also
     *        be the credential manager currently recorded in the configuration
     *        of overrides. Otherwise, no replacement will be performed.
     *        Specifying your own name is intended to prevent a plugin from
     *        inadvertently replacing another plugin's credential manager.
     *
     * @throws An ImperativeError upon error.
     */
    public static recordDefaultCredMgrInConfig(credMgrToReplace: string) : void {
        // read in the existing settings file
        let settings: any;
        try {
            settings = this.getSettingsFileJson();
        } catch (error) {
            throw new ImperativeError({
                msg: "Due to error in settings file, unable to replace the credential manager named '" +
                credMgrToReplace + "'" +
                "\nReason: " + error.message
            });
        }

        // we only permit a credential manager to restore from itself back to our default
        if ( settings.json.overrides.CredentialManager != credMgrToReplace ) {
            throw new ImperativeError({
                msg: `An attempt to revert Credential Manager = '${credMgrToReplace}' ` +
                    `to the default Credential Manager = '${this.DEFAULT_CRED_MGR_NAME}' ` +
                    `failed. The value '${credMgrToReplace}' must be the current value ` +
                    `in settings file = '${settings.fileName}'. Instead, ` +
                    `the current value is '${settings.json.overrides.CredentialManager}'. ` +
                    "The current Credential Manager has not been replaced."
            });
        }

        // reset to our default credMgr and write the settings file
        settings.json.overrides.CredentialManager = this.DEFAULT_CRED_MGR_NAME;
        try {
            writeJsonSync(settings.fileName, settings.json, {spaces: 2});
        } catch (error) {
            throw new ImperativeError({
                msg: "Unable to write settings file = " + settings.fileName +
                "\nReason: " + error.message
            });
        }
    }

    //________________________________________________________________________
    /**
     * Get the contents of the $ZOWE_CLI_HOME/settings/imperative.json file.
     * The resulting JSON is guaranteed to contain the key
     * 'overrides.CredentialManager'.
     *
     * @returns A 'settings' object with the properties: fileName and json.
     *          The json object contains the contents of the settings file.
     *
     * @throws An ImperativeError if the file does not exist or have the key.
     */
    private static getSettingsFileJson() {
        const settings = {
            fileName: "",
            json: {} as ISettingsFile
        };
        try {
            settings.fileName = path.join(ImperativeConfig.instance.cliHome, "settings", "imperative.json");
            settings.json = readJsonSync(settings.fileName);
        } catch (error) {
            throw new ImperativeError({
                msg: "Unable to read settings file = " + settings.fileName +
                "\nReason: " + error.message
            });
        }
        if ( typeof(settings.json?.overrides?.CredentialManager) === "undefined") {
            throw new ImperativeError({
                msg: "The property key 'overrides.CredentialManager' does not exist in settings file = " +
                settings.fileName
            });
        }
        return settings;
    }

}
