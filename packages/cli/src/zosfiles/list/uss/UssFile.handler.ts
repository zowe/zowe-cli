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

import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { List, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
/**
 * Handler to list a unix directory
 * @param {IHandlerParameters} params - Command handler parameters
 */
export default class USSFileHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {

        const response = await List.fileList(session, commandParameters.arguments.path, {
            maxLength: commandParameters.arguments.maxLength,
            responseTimeout: commandParameters.arguments.responseTimeout
        });

        // Populate the response object
        commandParameters.response.data.setObj(response);
        commandParameters.response.data.setMessage(`Returned list of UNIX files and directories in path "${commandParameters.arguments.path}"`);
        // Format the output with the default fields
        commandParameters.response.format.output({
            fields: ["name", "mode", "size", "uid", "user"],
            output: response.apiResponse.items,
            format: "table"
            });
        return response;
    }
}
