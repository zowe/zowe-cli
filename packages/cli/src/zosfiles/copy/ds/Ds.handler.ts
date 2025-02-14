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

import { AbstractSession, IHandlerParameters, IHandlerResponseConsoleApi } from "@zowe/imperative";
import { Copy, IZosFilesResponse, IDataSet, ICopyDatasetOptions, ZosFilesUtils } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to copy a data set.
 */
export default class DsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const fromDataSet: IDataSet = ZosFilesUtils.getDataSetFromName(commandParameters.arguments.fromDataSetName);
        const toDataSet: IDataSet = ZosFilesUtils.getDataSetFromName(commandParameters.arguments.toDataSetName);
        const options: ICopyDatasetOptions = {
            "from-dataset": fromDataSet,
            enq: commandParameters.arguments.enq,
            replace: commandParameters.arguments.replace,
            responseTimeout: commandParameters.arguments.responseTimeout,
            safeReplace: commandParameters.arguments.safeReplace,
            promptFn: this.promptForSafeReplace(commandParameters.response.console)
        };

        return Copy.dataSet(session, toDataSet, options);
    }

    private promptForSafeReplace(console: IHandlerResponseConsoleApi) {
        return async (targetDSN: string) => {
            const answer: string = await console.prompt(
                `The dataset '${targetDSN}' exists on the target system. This copy will result in data loss.` +
                ` Are you sure you want to continue? [y/N]: `
            );
            return answer != null && (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
        };
    }
}
