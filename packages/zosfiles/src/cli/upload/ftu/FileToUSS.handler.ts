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

import { AbstractSession, IHandlerParameters, TextUtils } from "@brightside/imperative";
import { Upload } from "../../../api/methods/upload";
import { IZosFilesResponse } from "../../../api";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to upload content from a local file to a USS file
 * @export
 */
export default class FileToUSSHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
                                    session: AbstractSession): Promise<IZosFilesResponse> {

        const response = await Upload.fileToUSSFile(session, commandParameters.arguments.inputfile,
            commandParameters.arguments.USSFileName, commandParameters.arguments.binary);
        const formatMessage = TextUtils.prettyJson(response.apiResponse);
        commandParameters.response.console.log(formatMessage);
        return response;
    }
}
