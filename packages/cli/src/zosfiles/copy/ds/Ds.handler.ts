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

import { AbstractSession, IHandlerParameters, IHandlerResponseConsoleApi } from "npm:@zowe/imperative";
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
            overwrite: commandParameters.arguments.overwrite,
            responseTimeout: commandParameters.arguments.responseTimeout,
            safeReplace: commandParameters.arguments.safeReplace,
            promptFn: this.promptForSafeReplace(commandParameters.response.console),
            promptForIdenticalNamedMembers: this.promptForIdenticalNamedMembers(commandParameters.response.console),
            progress: commandParameters.response.progress,
        };
        const response = await Copy.dataSet(session, toDataSet, options);
        return response;
    }

    private promptForSafeReplace(console: IHandlerResponseConsoleApi) {
        return async (targetDSN: string) => {
            const answer: string = await console.prompt(
                `The dataset '${targetDSN}' exists on the target system. This copy can result in data loss.` +
                ` Are you sure you want to continue? [y/N]: `
            );
            return answer != null && (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
        };
    }

    private promptForIdenticalNamedMembers(console: IHandlerResponseConsoleApi) {
        return async() => {
            const answer: string = await console.prompt (
                `The source and target data sets have identical member names. The contents of the target members will be overwritten.` +
                ` Are you sure you want to continue? [y/N]: `
            );
            return answer != null && (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
        };
    }
}
