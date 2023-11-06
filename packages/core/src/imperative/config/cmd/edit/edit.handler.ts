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

import { ICommandHandler, IHandlerParameters } from "../../../../cmd/doc";
import { ImperativeConfig, ProcessUtils } from "../../../../utils";

/**
 * Edit config
 */
export default class EditHandler implements ICommandHandler {
    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        // Load the config and set the active layer according to user options
        const config = ImperativeConfig.instance.config;
        config.api.layers.activate(params.arguments.userConfig, params.arguments.globalConfig);
        const configLayer = config.api.layers.get();

        if (!configLayer.exists) {
            const initCmd = ImperativeConfig.instance.commandLine.replace("edit", "init");
            params.response.console.log(`File does not exist: ${configLayer.path}\n` +
                `To create it, run "${ImperativeConfig.instance.rootCommandName} ${initCmd}".`);
        } else {
            await ProcessUtils.openInEditor(ImperativeConfig.instance.config.api.layers.get().path);
        }
    }
}
