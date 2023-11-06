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

import { ICommandHandler, IHandlerParameters, IHandlerResponseApi } from "../../../../cmd/doc";
import { ItemId } from "./EnvItems";
import { EnvQuery, IGetItemOpts } from "./EnvQuery";
import { TextUtils } from "../../../../utils/TextUtils";

/**
 * Handler to report a user's wroking environment.
 *
 * We detect and report information from the user environment, including
 * installed 3rd party prerrequisites. We report those findings.
 *
 * We also maintain a set of known problem conditions (like broken NPM
 * versions which happen way too often). We use that data to report the
 * probelem to the customer and any known workaround.
 *
 * @export
 */
export default class ReportEnvHandler implements ICommandHandler {
    public async process(cmdParams: IHandlerParameters): Promise<void> {
        await this.displayEnvReport(cmdParams.response);
        cmdParams.response.data.setExitCode(0);
    }

    // __________________________________________________________________________
    /**
     * Display a report of all items of interest and any problems detected.
     *
     * @param consoleApi Console response object to which we will write messages.
     */
    private async displayEnvReport(responseApi: IHandlerResponseApi): Promise<void> {
        const { EOL } = require("os");
        for (const nextItemId of Object.keys(ItemId).map(
            keyVal => parseInt(keyVal)).filter(keyVal => !isNaN(keyVal)
        ))
        {
            // These items have a progress bar. Output a newline beforehand.
            if (nextItemId == ItemId.NPM_VER || nextItemId == ItemId.ZOWE_CONFIG_TYPE) {
                responseApi.console.error(EOL);
            }
            await this.displayEnvItem(nextItemId, responseApi);
        }

        responseApi.console.log(
            `This information contains site-specific data. Redact anything required${EOL}` +
            "by your organization before sending this information to outside companies."
        );
    }

    // __________________________________________________________________________
    /**
     * Display a specific item and any problems detected.
     *
     * @param consoleApi Console response object to which we will write messages.
     */
    private async displayEnvItem(itemId: ItemId, responseApi: IHandlerResponseApi): Promise<void> {
        const getItemOpts: IGetItemOpts = {
            progressApi: responseApi.progress
        };
        const getResult = await EnvQuery.getEnvItemVal(itemId, getItemOpts);
        responseApi.console.log(getResult.itemValMsg);
        if (getResult.itemProbMsg.length > 0) {
            responseApi.console.log(TextUtils.chalk.red("    " + getResult.itemProbMsg));
        }
    }
}
