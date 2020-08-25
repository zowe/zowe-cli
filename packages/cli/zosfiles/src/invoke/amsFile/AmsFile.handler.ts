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
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { Invoke } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { IZosFilesOptions } from "@zowe/zos-files-for-zowe-sdk";

/**
 * Handler to create a PDS data set
 * @export
 */
export default class AmsFileHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        let response: IZosFilesResponse;
        const zosFilesOptions: IZosFilesOptions = {responseTimeout: commandParameters.arguments.responseTimeout};
        response = await Invoke.ams(session, commandParameters.arguments.controlStatementsFile, zosFilesOptions);
        commandParameters.response.console.log(TextUtils.prettyJson(response.apiResponse));
        return response;
    }
}
