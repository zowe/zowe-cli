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
import { IZosFilesResponse, List } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to resolve a data set alias
 * @export
 */
export default class AliasHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const response = await List.resolveAlias(session, commandParameters.arguments.aliasName, {
            responseTimeout: commandParameters.arguments.responseTimeout
        });

        // Display the resolved target data set name
        commandParameters.response.console.log(
            `Alias: ${response.apiResponse.alias}\nTarget: ${response.apiResponse.targetDsn}`
        );

        return response;
    }
}
