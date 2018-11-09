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
import { IZosFilesResponse } from "../../../api";
import { Upload } from "../../../api/methods/upload";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { readStdin } from "../../../../../utils";

/**
 * Handler to stream data from stdin to a data set
 * @export
 */
export default class StdinToDataSetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
                                    session: AbstractSession): Promise<IZosFilesResponse> {

        const payload: Buffer = await readStdin();
        const result = await Upload.bufferToDataSet(session, Buffer.from(payload), commandParameters.arguments.dataSetName, {
            volume: commandParameters.arguments.volumeSerial,
            binary: commandParameters.arguments.binary
        });

        if (result.success) {
            const formatMessage = TextUtils.prettyJson({
                success: result.success,
                from: "stdin",
                to: commandParameters.arguments.dataSetName
            });
            commandParameters.response.console.log(formatMessage);
        }
        return result;
    }
}
