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

import { ICommandHandler, IHandlerParameters } from "../../../../cmd";
import { Logger } from "../../../../logger";
import { PMFConstants } from "../../utilities/PMFConstants";
import { update } from "../../utilities/npm-interface";
import { ImperativeError } from "../../../../error";
import { TextUtils } from "../../../../utilities";
import { IPluginJson } from "../../doc/IPluginJson";
import { readFileSync, writeFileSync } from "jsonfile";
import { npmLogin } from "../../utilities/NpmFunctions";

/**
 * The update command handler for cli plugin install.
 *
 * @see {updateDefinition}
 */
export default class UpdateHandler implements ICommandHandler {
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
     * @param {string[]} [params.arguments.plugin] This is the plugin to update.
     *
     * @returns {Promise<ICommandResponse>} The command response
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const iConsole = Logger.getImperativeLogger();
        const chalk = TextUtils.chalk;
        let packageName;

        this.console.debug(`Root Directory: ${PMFConstants.instance.PLUGIN_INSTALL_LOCATION}`);

        const plugin: string = params.arguments.plugin;
        let registry = params.arguments.registry;

        if (params.arguments.plugin == null || params.arguments.plugin.length === 0) {
            throw new ImperativeError({
                msg: `${chalk.yellow.bold("Plugin name")} is required.`
            });
        }

        iConsole.debug("Reading in the current configuration.");
        const installedPlugins: IPluginJson = readFileSync(PMFConstants.instance.PLUGIN_JSON);

        if (params.arguments.login) {
            npmLogin(registry);
        }

        if (Object.prototype.hasOwnProperty.call(installedPlugins, plugin)) {
            // Loop through the plugins and remove the uninstalled package
            for (const pluginName in installedPlugins) {
                // Only retain the plugins that aren't being uninstalled
                if (plugin.toString() === pluginName.toString()) {
                    // Retrieve the package and registry values from the plugins.json file to pass to update
                    // as package may not match the plugin value.  This is true for plugins installed by
                    // folder location.  Example: plugin 'imperative-sample-plugin' installed from ../imperative-plugins
                    packageName = installedPlugins[pluginName].package;
                    if (registry === undefined) {
                        registry = installedPlugins[pluginName].registry;
                    }
                    // Call update which returns the plugin's version so plugins.json can be updated
                    installedPlugins[pluginName].version = await update(packageName, registry);
                    installedPlugins[pluginName].registry = registry; // update in case it changed

                    writeFileSync(PMFConstants.instance.PLUGIN_JSON, installedPlugins, {
                        spaces: 2
                    });
                    params.response.console.log(`Update of the npm package(${packageName}) was successful.\n`);
                }
            }
        } else {
            throw new ImperativeError({
                msg: `${chalk.yellow.bold("Plugin name '")}${chalk.red.bold(plugin)}' is not installed.`
            });
        }
    }
}
