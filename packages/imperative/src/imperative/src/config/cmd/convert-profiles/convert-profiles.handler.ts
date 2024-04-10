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

import { ICommandHandler, IHandlerParameters, IHandlerResponseConsoleApi } from "../../../../../cmd";
import {
    ConvertMsg, ConvertMsgFmt, ConvertV1Profiles, IConvertV1ProfOpts, IConvertV1ProfResult
} from "../../../../../config";
import { uninstall as uninstallPlugin } from "../../../plugins/utilities/npm-interface";
import { TextUtils } from "../../../../../utilities";
/**
 * Handler for the convert profiles command.
 */
export default class ConvertProfilesHandler implements ICommandHandler {
    /**
     * Process the command input and display output.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const convertOpts: IConvertV1ProfOpts = {
            deleteV1Profs: false
        };

        if (params.arguments?.delete) {
            convertOpts.deleteV1Profs = true;
            if (params.arguments.prompt == null || params.arguments.prompt === true) {
                params.response.console.log(
                    "If you confirm the deletion of V1 profiles, they are deleted from disk after\n" +
                    "a successful conversion. Otherwise, they remain but are no longer used.\n" +
                    "You can also delete your V1 profiles later.\n"
                );
                const answer = await params.response.console.prompt("Do you want to delete your V1 profiles now [y/N]: ");
                if (answer.charAt(0).toLowerCase() !== "y") {
                    convertOpts.deleteV1Profs = false;
                }
            }
        }

        const convertResult: IConvertV1ProfResult = await ConvertV1Profiles.convert(convertOpts);

        /* Uninstall the V1 SCS plugin.
         *
         * The uninstall cannot be done in ConvertV1Profiles.convert because circular
         * dependencies cause problems in other unrelated modules that import from
         * "@zowe/imperative".
         *
         * Add our messages to those already in the response object so that we can
         * display all messages together later.
         */
        if (convertResult.v1ScsPluginName) {
            try {
                uninstallPlugin(convertResult.v1ScsPluginName);
                const newMsg = new ConvertMsg(
                    ConvertMsgFmt.REPORT_LINE, `Uninstalled plug-in "${convertResult.v1ScsPluginName}"`
                );
                convertResult.msgs.push(newMsg);
            } catch (error) {
                let newMsg = new ConvertMsg(
                    ConvertMsgFmt.ERROR_LINE, `Failed to uninstall plug-in "${convertResult.v1ScsPluginName}"`
                );
                convertResult.msgs.push(newMsg);

                newMsg = new ConvertMsg(
                    ConvertMsgFmt.ERROR_LINE | ConvertMsgFmt.INDENT, error.message
                );
                convertResult.msgs.push(newMsg);
            }
        }

        // show all report messages followed by error messages
        this.showMsgsByType(convertResult.msgs, ConvertMsgFmt.REPORT_LINE, params.response.console);
        this.showMsgsByType(convertResult.msgs, ConvertMsgFmt.ERROR_LINE, params.response.console);
    }

    /**
     * Show all of the messages of a given type.
     * The intent is to allow our caller to show a report of all actions,
     * followed by a report of all errors.
     *
     * @param setOfMsgs The available set of messages to display.
     * @param msgTypeToShow The type of message to display.
     *                      Either ConvertMsgFmt.REPORT_LINE or ConvertMsgFmt.ERROR_LINE.
     * @param consoleApiFun The IHandlerResponseConsoleApi object used to display
     *                      messages in a CLI terminal.
     */
    private showMsgsByType(
        setOfMsgs: ConvertMsg[],
        msgTypeToShow: number,
        consoleApiFun: IHandlerResponseConsoleApi
    ): void {

        let firstMsgLine: boolean = true;
        for (const nextMsg of setOfMsgs) {
            let startingMsgText = "";
            if (nextMsg.msgFormat & msgTypeToShow) {
                if (firstMsgLine) {
                    firstMsgLine = false;
                    if (msgTypeToShow & ConvertMsgFmt.ERROR_LINE) {
                        startingMsgText = "\nThe following operation(s) were not completed:\n";
                    }

                    // We want one newline before our first message, but avoid a double newline
                    if (!(nextMsg.msgFormat & ConvertMsgFmt.PARAGRAPH)) {
                        startingMsgText += "\n";
                    }
                }

                if (nextMsg.msgFormat & ConvertMsgFmt.PARAGRAPH) {
                    startingMsgText += "\n";
                }
                if (nextMsg.msgFormat & ConvertMsgFmt.INDENT) {
                    startingMsgText += "    ";
                }

                if (msgTypeToShow & ConvertMsgFmt.REPORT_LINE) {
                    consoleApiFun.log(startingMsgText + nextMsg.msgText);
                } else {
                    consoleApiFun.error(TextUtils.chalk.red(startingMsgText + nextMsg.msgText));
                }
            }
        }
    }
}
