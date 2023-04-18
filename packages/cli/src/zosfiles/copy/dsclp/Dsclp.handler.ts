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

import { AbstractSession, IHandlerParameters, IHandlerResponseConsoleApi, Session } from "@zowe/imperative";
import { Copy, ICrossLparCopyDatasetOptions, IDataSet, IGetOptions, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { getDataSet } from "../../ZosFiles.utils";

/**
 * Handler to copy a data set.
 */

export default class DsclpHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const sourceDataset: IDataSet = getDataSet(commandParameters.arguments.fromDataSetName);
        const targetDataset: IDataSet = getDataSet(commandParameters.arguments.toDataSetName);

        const options: ICrossLparCopyDatasetOptions = {
            "from-dataset": sourceDataset,
            enq: commandParameters.arguments.enq,
            replace: commandParameters.arguments.replace,
            responseTimeout: commandParameters.arguments.responseTimeout,
            targetVolser: commandParameters.arguments.targetVolser,
            targetManagementClass: commandParameters.arguments.targetManagementClass,
            targetStorageClass: commandParameters.arguments.targetStorageClass,
            targetDataClass: commandParameters.arguments.targetDataClass,
            promptFn: this.promptForOverwrite(commandParameters.response.console)
        };

        const sourceOptions: IGetOptions = {
            binary: commandParameters.arguments.binary,
            encoding: commandParameters.arguments.encoding,
            record: commandParameters.arguments.record,
            volume: commandParameters.arguments.volume
        };

        const targetSession = new Session(commandParameters.arguments.targetZosmfSession);

        return Copy.dataSetCrossLPAR(session,
            targetDataset,
            options,
            sourceOptions,
            targetSession
        );
    }

    /**
     * Private function to prompt user if they wish to overwrite an existing dataset.
     */
    private promptForOverwrite(console: IHandlerResponseConsoleApi) {
        return async (targetDSN: string) => {
            const answer: string = await console.prompt(
                `The dataset '${targetDSN}' already exists on the target system. Do you wish to overwrite it? [y/N]: `);
            return (answer != null && (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"));
        };
    }
}
