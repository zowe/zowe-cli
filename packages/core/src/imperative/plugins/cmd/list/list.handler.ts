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

import { PluginIssues } from "../../utilities/PluginIssues";
import { ICommandHandler, IHandlerParameters } from "../../../../cmd/doc";
import { Logger } from "../../../../logger/Logger";
import { IPluginJson } from "../../doc/IPluginJson";
import { TextUtils } from "../../../../utils/TextUtils";

/**
 * The install command handler for cli plugin install.
 *
 * @see {installDefinition}
 */
export default class ListHandler implements ICommandHandler {
    /**
     * A logger for this class
     *
     * @private
     * @type {Logger}
     */
    private log: Logger = Logger.getImperativeLogger();

    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @returns {Promise<ICommandResponse>} The command response
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const chalk = TextUtils.chalk;

        const installedPlugins: IPluginJson = PluginIssues.instance.getInstalledPlugins();

        params.response.data.setObj(installedPlugins);
        let listOutput: string = "";
        let firstTime = true;

        for (const pluginName of Object.keys(installedPlugins).sort((a, b) => a.localeCompare(b))) {
            if (Object.prototype.hasOwnProperty.call(installedPlugins, pluginName)) {
                // Build the console output
                if (!params.arguments.short) {
                    if (firstTime) {
                        listOutput = `\n${chalk.yellow.bold("Installed plugins:")} \n\n`;
                    }

                    listOutput = listOutput + `${chalk.yellow.bold(" -- pluginName: ")}` +
                        `${chalk.red.bold(pluginName)} \n`;
                    listOutput = listOutput + `${chalk.yellow.bold(" -- package: ")}` +
                        `${chalk.red.bold(installedPlugins[pluginName].package)} \n`;
                    listOutput = listOutput + `${chalk.yellow.bold(" -- version: ")}` +
                        `${chalk.red.bold(installedPlugins[pluginName].version)} \n`;
                    listOutput = listOutput + `${chalk.yellow.bold(" -- registry: ")}` +
                        installedPlugins[pluginName].registry + "\n\n";
                } else {
                    listOutput += `${chalk.yellow(pluginName)}@${installedPlugins[pluginName].version}\n`;
                }

                // Write to the log file
                if (firstTime) {
                    this.log.simple(" ");
                    this.log.simple("Installed plugins:");
                    this.log.simple(" ");
                    firstTime = false;
                }
                this.log.simple("    pluginName: " + pluginName);
                this.log.simple("    package: " + installedPlugins[pluginName].package);
                this.log.simple("    version: " + installedPlugins[pluginName].version);
                this.log.simple("    registry: " + installedPlugins[pluginName].registry);
                this.log.simple(" ");
            }
        }

        if (listOutput === "") {
            listOutput = "No plugins have been installed into your CLI application.";
        }

        // Write to the results of the list command to console
        params.response.console.log(listOutput);
    }
}
