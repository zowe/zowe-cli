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
import {
    ConvertMsg, ConvertMsgFmt, ConvertV1Profiles, IConvertV1ProfOpts, IConvertV1ProfResult
} from "../../../../../config";
import { uninstall as uninstallPlugin } from "../../../plugins/utilities/npm-interface";

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

        if (params.arguments.delete != null && params.arguments.delete === true) {
            if (params.arguments.prompt == null || params.arguments.prompt === true) {
                params.response.console.log(
                    "If you confirm the deletion of V1 profiles, they are deleted from disk\n" +
                    "after a successful conversion. Otherwise, they remain but no longer used.\n" +
                    "You can also delete your V1 profiles later.\n"
                );
                const answer = await params.response.console.prompt("Do you want to delete your V1 profiles now [y/N]: ");
                if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
                    convertOpts.deleteV1Profs = true;
                }
            }
        }

        const convertResult: IConvertV1ProfResult = await ConvertV1Profiles.convert(convertOpts);

        /* Uninstall the V1 SCS plugin.
         *
         * The uninstall cannot be done in ConvertV1Profiles.convert, because circular
         * dependencies cause problems in other unrelated modules that import from
         * "@zowe/imperative".
         *
         * Add our messages to those already in the response object so that we can
         * display all messages together later.
         */
        if (convertResult.v1ScsPluginName) {
            uninstallPlugin(convertResult.v1ScsPluginName);
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

        // display all of the messages reported by the conversion API
        for (const nextMsg of convertResult.msgs) {
            params.response.console.log(nextMsg.msgText);
        }

        return;
    }
}
