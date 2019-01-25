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

import * as readline from "readline";

import { AbstractSession, IHandlerParameters, TextUtils } from "@brightside/imperative";
import { IZosFilesResponse } from "../../../api";
import { Upload } from "../../../api/methods/upload";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to stream data from stdin to a data set
 * @export
 */
export default class StdinToDataSetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
                                    session: AbstractSession): Promise<IZosFilesResponse> {

        let payload: string = "";
        const inputStream = readline.createInterface({
            input: process.stdin
        });

        inputStream.on("line", (input) => {
            payload += input + "\n";
        });

        const completed = new Promise<IZosFilesResponse>((resolve, reject) => {
            inputStream.on("close", async () => {
                try {
                    const result = await Upload.bufferToDataSet(session, Buffer.from(payload), commandParameters.arguments.dataSetName, {
                        volume: commandParameters.arguments.volumeSerial
                    });

                    if (result.success) {
                        const formatMessage = TextUtils.prettyJson({
                            success: result.success,
                            from: "stdin",
                            to: commandParameters.arguments.dataSetName
                        });
                        commandParameters.response.console.log(formatMessage);
                    }

                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });

        return completed;
    }
}
