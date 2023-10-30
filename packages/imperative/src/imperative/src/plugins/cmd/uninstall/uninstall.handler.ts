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

import { ICommandHandler, IHandlerParameters } from "../../../../../cmd";
import { ConfigurationLoader } from "../../../ConfigurationLoader";
import { CredentialManagerOverride, ICredentialManagerNameMap } from "../../../../../security";
import { Logger } from "../../../../../logger/";
import { PluginManagementFacility } from "../../PluginManagementFacility";
import { PMFConstants } from "../../utilities/PMFConstants";
import { uninstall } from "../../utilities/npm-interface";
import { getPackageInfo } from "../../utilities/NpmFunctions";
import { ImperativeError } from "../../../../../error";
import { TextUtils } from "../../../../../utilities";

/**
 * The uninstall command handler for cli plugin install.
 *
 * @see {uninstallDefinition}
 */
export default class UninstallHandler implements ICommandHandler {
    /**
     * A logger for this class
     *
     * @private
     * @type {Logger}
     */
    private console: Logger = Logger.getImperativeLogger();

    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @param {string[]} [params.arguments.plugin] This is the plugin to uninstall.
     *
     * @returns {Promise<ICommandResponse>} The command response
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const chalk = TextUtils.chalk;
        this.console.debug(`Root Directory: ${PMFConstants.instance.PLUGIN_INSTALL_LOCATION}`);

        if (params.arguments.plugin == null || params.arguments.plugin.length === 0) {
            throw new ImperativeError({
                msg: `${chalk.yellow.bold("Package name")} is required.`
            });
        } else {
            try {
                for (const packageName of params.arguments.plugin) {
                    // let the plugin perform any pre-uninstall operations
                    try {
                        await this.callPluginPreUninstall(packageName);
                    } catch(err) {
                        // We do not stop on preUninstall error. We just show a message.
                        params.response.console.log(err.message);
                    }

                    uninstall(packageName);
                }
                params.response.console.log("Removal of the npm package(s) was successful.\n"
                );
            } catch (e) {
                throw new ImperativeError({
                    msg: "Uninstall Failed",
                    causeErrors: [e],
                    additionalDetails: e.message
                });
            }
        }
    }

    /**
     * Call a plugin's lifecycle hook to enable a plugin to take some action
     * before the plugin is uninstalled.
     *
     * @param pluginPackageNm The package name of the plugin being installed.
     *
     * @throws ImperativeError.
     */
    private async callPluginPreUninstall(pluginPackageNm: string): Promise<void> {
        const impLogger = Logger.getImperativeLogger();
        try {
            // get the plugin's Imperative config definition
            const packageInfo = await getPackageInfo(pluginPackageNm);
            const requirerFunction = PluginManagementFacility.instance.requirePluginModuleCallback(pluginPackageNm);
            const pluginImpConfig = ConfigurationLoader.load(null, packageInfo, requirerFunction);

            if ( pluginImpConfig?.pluginLifeCycle === undefined) {
                // the pluginLifeCycle was not defined by the plugin
                const credMgrInfo: ICredentialManagerNameMap =
                    CredentialManagerOverride.getCredMgrInfoByPlugin(pluginPackageNm);
                if (credMgrInfo !== null) {
                    // this plugin is a known cred mgr override
                    CredentialManagerOverride.recordDefaultCredMgrInConfig(credMgrInfo.credMgrDisplayName);
                    throw new ImperativeError({
                        msg: `The plugin '${pluginPackageNm}', which overrides the CLI ` +
                        `Credential Manager, does not implement the 'pluginLifeCycle' class. ` +
                        `The CLI default Credential Manager ` +
                        `(${CredentialManagerOverride.DEFAULT_CRED_MGR_NAME}) was automatically reinstated.`
                    });
                }
                return;
            }

            // call the plugin's preUninstall operation
            impLogger.debug(`Calling the preUninstall function for plugin '${pluginPackageNm}'`);
            const requirerFun = PluginManagementFacility.instance.requirePluginModuleCallback(pluginPackageNm);
            const lifeCycleClass = requirerFun(pluginImpConfig.pluginLifeCycle);
            const lifeCycleInstance = new lifeCycleClass();
            await lifeCycleInstance.preUninstall();
        } catch (err) {
            throw new ImperativeError({
                msg: `Unable to perform the 'preUninstall' action of plugin '${pluginPackageNm}'` +
                    `\nReason: ${err.message}`
            });
        }
    }
}
