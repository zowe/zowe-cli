/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { AbstractSession, IHandlerParameters, TextUtils } from "@brightside/imperative";
import { IZosFilesResponse } from "../../../api/doc/IZosFilesResponse";
import { Invoke } from "../../../api/methods/invoke";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to create a PDS data set
 * @export
 */
export default class AmsFileHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        let response: IZosFilesResponse;
        response = await Invoke.ams(session, commandParameters.arguments.controlStatementsFile);
        commandParameters.response.console.log(TextUtils.prettyJson(response.apiResponse));
        return response;
    }
}
