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

import { AbstractSession, IHandlerParameters, TextUtils } from "@zowe/imperative";
import { IZosFilesResponse, List } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to list a data sets
 * @export
 */
export default class DataSetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const response = await List.dataSet(session, commandParameters.arguments.dataSetName, {
            volume: commandParameters.arguments.volumeSerial,
            attributes: commandParameters.arguments.attributes,
            maxLength: commandParameters.arguments.maxLength,
            responseTimeout: commandParameters.arguments.responseTimeout,
            start: commandParameters.arguments.start
        });

        if (commandParameters.arguments.attributes && response.apiResponse.items.length > 0) {
            commandParameters.response.console.log(TextUtils.prettyJson(response.apiResponse.items));
        } else {
            const dsnameList = response.apiResponse.items.map((mem: any) => mem.dsname);
            commandParameters.response.console.log(dsnameList.join("\n"));
        }

        return response;
    }
}
