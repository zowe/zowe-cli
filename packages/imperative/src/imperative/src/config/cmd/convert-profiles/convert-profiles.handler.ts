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
import { removeSync } from "fs-extra";
import * as path from "path";
import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk";
import { ICommandHandler, IHandlerParameters } from "../../../../../cmd";
import { ConfigBuilder, ConfigSchema } from "../../../../../config";
import { ProfileIO, ProfileUtils } from "../../../../../profiles";
import { ImperativeConfig } from "../../../../../utilities";
import { AppSettings } from "../../../../../settings";
import { PluginIssues } from "../../../plugins/utilities/PluginIssues";
import { uninstall as uninstallPlugin } from "../../../plugins/utilities/npm-interface";
import { OverridesLoader } from "../../../OverridesLoader";
import { IImperativeOverrides } from "../../../doc/IImperativeOverrides";

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

/**
 * Handler for the convert profiles command.
 */
export default class ConvertProfilesHandler implements ICommandHandler {
    private readonly ZOWE_CLI_PACKAGE_NAME = "@zowe/cli";
    private readonly ZOWE_CLI_SECURE_PLUGIN_NAME = "@zowe/secure-credential-store-for-zowe-cli";
    private keytar: typeof keytar = undefined;

    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const cliBin = ImperativeConfig.instance.rootCommandName;
        const profilesRootDir = ProfileUtils.constructProfilesRootDirectory(ImperativeConfig.instance.cliHome);
        const configExists = ImperativeConfig.instance.config?.exists;
        const oldPluginInfo = this.getOldPluginInfo();

        // Cannot do profiles operations w/ team config
        const oldProfileCount = configExists ? 0 : this.getOldProfileCount(profilesRootDir);
        const oldProfilesDir = `${profilesRootDir.replace(/[\\/]$/, "")}-old`;
        let skipConversion = false;

        if (configExists) {
            // Warn that a team config was detected
            params.response.console.log(`A team configuration file was detected. V1 profiles cannot be loaded for conversion.\n` +
            `Run '${cliBin} config list --locations --root' for team configuration file locations.\n`);
        }

        if (oldPluginInfo.plugins.length == 0 && oldProfileCount === 0) {
            params.response.console.log("No old profiles were found to convert from Zowe v1 to v2.");
            // Exit if we're not deleting
            if (!(params.arguments.delete != null && params.arguments.delete === true)) {
                return;
            } else {
                skipConversion = true;
            }
        }

        // If this is true, then we know that we want to delete, but there is nothing to convert first.
        if (!skipConversion) {
            if (oldProfileCount > 0) {
                params.response.console.log(`Detected ${oldProfileCount} old profile(s) to convert from Zowe v1 to v2.\n`);
            }

            if (oldPluginInfo.plugins.length > 0) {
                params.response.console.log(`The following plug-ins will be removed because they are now part of the core CLI and are no longer ` +
                    `needed:\n\t${oldPluginInfo.plugins.join("\n\t")}\n`);
            }

            if (params.arguments.prompt == null || params.arguments.prompt === true) {
                const answer = await params.response.console.prompt("Are you sure you want to continue? [y/N]: ");
                if (answer == null || !(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes")) {
                    return;
                }
            }

            params.response.console.log("");
            oldPluginInfo.overrides.forEach(this.removeOverride);
            for (const pluginName of oldPluginInfo.plugins) {
                try {
                    uninstallPlugin(pluginName);
                    params.response.console.log(`Uninstalled plug-in: ${pluginName}`);
                } catch (error) {
                    params.response.console.error(`Failed to uninstall plug-in "${pluginName}":\n    ${error}`);
                }
            }

            if (oldProfileCount != 0) {
                await OverridesLoader.ensureCredentialManagerLoaded();

                const convertResult = await ConfigBuilder.convert(profilesRootDir);
                for (const [k, v] of Object.entries(convertResult.profilesConverted)) {
                    params.response.console.log(`Converted ${k} profiles: ${v.join(", ")}`);
                }
                if (convertResult.profilesFailed.length > 0) {
                    params.response.console.log("");
                    params.response.console.errorHeader(`Failed to convert ${convertResult.profilesFailed.length} profile(s). See details below`);
                    for (const { name, type, error } of convertResult.profilesFailed) {
                        if (name != null) {
                            params.response.console.error(`Failed to load ${type} profile "${name}":\n    ${error}`);
                        } else {
                            params.response.console.error(`Failed to find default ${type} profile:\n    ${error}`);
                        }
                    }
                }

                params.response.console.log("");
                const teamConfig = ImperativeConfig.instance.config;
                teamConfig.api.layers.activate(false, true);
                teamConfig.api.layers.merge(convertResult.config);
                ConfigSchema.updateSchema();
                await teamConfig.save();

                try {
                    fs.renameSync(profilesRootDir, oldProfilesDir);
                } catch (error) {
                    params.response.console.error(`Failed to rename profiles directory to ${oldProfilesDir}:\n    ${error}`);
                }

                params.response.console.log(`Your new profiles have been saved to ${teamConfig.layerActive().path}.\n` +
                    `Run "${cliBin} config edit --global-config" to open this file in your default editor.\n`);

                if (params.arguments.delete == null || params.arguments.delete === false) {
                    params.response.console.log(`Your old profiles have been moved to ${oldProfilesDir}.\n` +
                    `Run "${cliBin} config convert-profiles --delete" if you want to completely remove them.\n\n` +
                    `If you would like to revert back to v1 profiles, or convert your v1 profiles again, rename the 'profiles-old' ` +
                    `directory to 'profiles' and delete the new config file located at ${teamConfig.layerActive().path}.`);
                }
            }
        }

        if (params.arguments.delete != null && params.arguments.delete === true) {
            if (params.arguments.prompt == null || params.arguments.prompt === true) {
                const answer = await params.response.console.prompt("Are you sure you want to delete your v1 profiles? [y/N]: ");
                if (answer == null || !(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes")) {
                    return;
                }
            }

            // Delete the profiles directory
            try {
                removeSync(oldProfilesDir);
                params.response.console.log(`Deleting the profiles directory '${oldProfilesDir}'... done`);
            } catch (err) {
                params.response.console.error(`Failed to delete the profiles directory '${oldProfilesDir}':\n    ${err}`);
            }

            // Delete the securely stored credentials
            const keytarAvailable = await this.checkKeytarAvailable();
            if (keytarAvailable) {
                const knownServices = ["@brightside/core", "@zowe/cli", "Zowe-Plugin", "Broadcom-Plugin", "Zowe"];
                for (const service of knownServices) {
                    const accounts = await this.findOldSecureProps(service, params);
                    for (const account of accounts) {
                        if (!account.includes("secure_config_props")) {
                            const success = this.deleteOldSecureProps(service, account, params);
                            params.response.console.log(`Deleting secure value for "${service}/${account}"... ${success ? "done" : "failed"}`);
                        }
                    }
                }
            } else {
                params.response.console.error(`Keytar or the credential vault are unavailable. Unable to delete old secure values.`);
            }
        }
    }

    /**
     * Retrieve info about old plug-ins and their overrides.
     *  - `plugins` - List of CLI plug-ins to uninstall
     *  - `overrides` - List of overrides to remove from app settings
     */
    private getOldPluginInfo(): IOldPluginInfo {
        const pluginInfo: IOldPluginInfo = {
            plugins: [],
            overrides: []
        };

        if (ImperativeConfig.instance.hostPackageName === this.ZOWE_CLI_PACKAGE_NAME) {
            let oldCredMgr = AppSettings.instance.get("overrides", "CredentialManager");

            if (typeof oldCredMgr !== "string" || oldCredMgr === ImperativeConfig.instance.hostPackageName) {
                // Fall back to default plug-in name because CredentialManager override is not set
                oldCredMgr = this.ZOWE_CLI_SECURE_PLUGIN_NAME;
            } else {
                // Need to remove CredentialManager override because it is a plug-in name
                pluginInfo.overrides.push("CredentialManager");
            }

            // Only uninstall plug-in if it is currently installed
            if (oldCredMgr in PluginIssues.instance.getInstalledPlugins()) {
                pluginInfo.plugins.push(oldCredMgr);
            }
        }

        return pluginInfo;
    }

    /**
     * Get the number of old profiles present in the CLI home dir.
     * @param profilesRootDir Root profiles directory
     * @returns Number of old profiles found
     */
    private getOldProfileCount(profilesRootDir: string): number {
        const profileTypes = ProfileIO.getAllProfileDirectories(profilesRootDir);
        let oldProfileCount = 0;
        for (const profileType of profileTypes) {
            const profileTypeDir = path.join(profilesRootDir, profileType);
            const profileNames = ProfileIO.getAllProfileNames(profileTypeDir, ".yaml", `${profileType}_meta`);
            oldProfileCount += profileNames.length;
        }
        return oldProfileCount;
    }

    /**
     * Remove obsolete Imperative overrides from app settings. This method is
     * called before uninstalling old plug-ins.
     *
     * This method is private because only the convert-profiles command is able
     * to disable the credential manager and reload it. For all other commands,
     * the credential manager is loaded in `Imperative.init` and frozen with
     * `Object.freeze` so cannot be modified later on.
     */
    private removeOverride(override: keyof IImperativeOverrides) {
        switch (override) {
            case "CredentialManager":
                AppSettings.instance.set("overrides", "CredentialManager", ImperativeConfig.instance.hostPackageName);
                if (ImperativeConfig.instance.loadedConfig.overrides.CredentialManager != null) {
                    delete ImperativeConfig.instance.loadedConfig.overrides.CredentialManager;
                }
                break;
        }
    }

    /**
     * Lazy load keytar, and verify that the credential vault is able to be accessed,
     * or whether there is a problem.
     * @returns true if credential vault is available, false if it is not
     */
    private async checkKeytarAvailable(): Promise<boolean> {
        let success: boolean = false;
        const requireOpts: any = {};
        if (process.mainModule?.filename != null) {
            requireOpts.paths = [process.mainModule.filename];
        }
        try {
            const keytarPath = require.resolve("@zowe/secrets-for-zowe-sdk", requireOpts);
            this.keytar = (await import(keytarPath)).keyring;
            await this.keytar.findCredentials(this.ZOWE_CLI_PACKAGE_NAME);
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
     * @param params The parameters and response console APIs
     * @returns a list of secured properties stored under the specified account
     */
    private async findOldSecureProps(acct: string, params: IHandlerParameters): Promise<string[]> {
        const oldSecurePropNames: string[] = [];
        try {
            const credentialsArray = await this.keytar.findCredentials(acct);
            for (const element of credentialsArray) {
                oldSecurePropNames.push(element.account);
            }
        } catch (err) {
            params.response.console.error(`Encountered an error while gathering profiles for service '${acct}':\n    ${err}`);
        }
        return oldSecurePropNames;
    }

    /**
     * Delete the secure property specified from the operating system credential vault.
     * @param acct The account the property is stored under
     * @param propName The name of the property to delete
     * @param params The parameters and response console APIs
     * @returns true if the property was deleted successfully
     */
    private async deleteOldSecureProps(acct: string, propName: string, params: IHandlerParameters): Promise<boolean> {
        let success = false;
        try {
            success = await this.keytar.deletePassword(acct, propName);
        } catch (err) {
            params.response.console.error(`Encountered an error while deleting secure data for service '${acct}/${propName}':\n    ${err}`);
            success = false;
        }
        return success;
    }
}
