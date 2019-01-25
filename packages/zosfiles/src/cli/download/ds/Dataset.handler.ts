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

import { AbstractSession, IHandlerParameters } from "@brightside/imperative";
import { IZosFilesResponse } from "../../../api";
import { Download } from "../../../api/methods/download";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to download a data set or member
 * @export
 */
export default class DatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        return Download.dataSet(session, commandParameters.arguments.dataSetName, {
            volume: commandParameters.arguments.volumeSerial,
            binary: commandParameters.arguments.binary,
            file: commandParameters.arguments.file,
            extension: commandParameters.arguments.extension
        });
    }
}
