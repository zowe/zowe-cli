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
import { Logger } from "../../../../../logger/";
import { PMFConstants } from "../../utilities/PMFConstants";
import { uninstall } from "../../utilities/npm-interface";
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
}
