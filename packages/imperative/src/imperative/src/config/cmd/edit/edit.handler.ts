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
import { CliUtils, ImperativeConfig, ProcessUtils, TextUtils } from "../../../../../utilities";
import { ImperativeError } from "../../../../../error";

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
            if (params.arguments.editor) {
                const trustEditor = await this.promptTrustEditor(params.arguments.editor);
                if (!trustEditor) {
                    throw new ImperativeError({
                        msg: TextUtils.chalk.red(`User did not trust the editor. Command terminated.`),
                        causeErrors: new Error(`User did not trust the editor.`)
                    });
                }
            }
            ProcessUtils.openInEditor(ImperativeConfig.instance.config.api.layers.get().path, params.arguments.editor);
        }
    }

    /**
     * Ask the user whether they trust the editor that they supplied.
     * @param editor Editor supplied by the user
     * @returns True if the user trusts the editor
     */
    private async promptTrustEditor(editor: string): Promise<boolean> {
        let input: string | null;
        do {
            input = await CliUtils.readPrompt(TextUtils.chalk.green(
                `You are about to edit using '${editor}'. Would you like to trust this editor? y/n`));
        } while (input != null && input.toLowerCase() !== "y" && input.toLowerCase() !== "n");
        if (input == null) {
            throw new ImperativeError({
                msg: TextUtils.chalk.red("No input provided. Command terminated.")
            });
        }
        return input.toLowerCase() === "y";
    }
}
