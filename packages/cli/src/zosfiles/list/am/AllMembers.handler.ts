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
 * Handler to list a data set members
 * @export
 */
export default class AllMembersHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const response = await List.allMembers(session, commandParameters.arguments.dataSetName, {
            volume: commandParameters.arguments.volumeSerial,
            attributes: commandParameters.arguments.attributes,
            maxLength: commandParameters.arguments.maxLength,
            pattern: commandParameters.arguments.pattern,
            responseTimeout: commandParameters.arguments.responseTimeout,
            messageResponse: commandParameters.arguments.messageResponse
        });

        if (commandParameters.arguments.attributes && response.apiResponse.items.length > 0) {
            commandParameters.response.console.log(TextUtils.prettyJson(response.apiResponse.items));
        } else {
            const memberList = response.apiResponse.items.map((mem: any) => mem.member);
            commandParameters.response.console.log(memberList.join("\n"));
        }

        return response;
    }
}
