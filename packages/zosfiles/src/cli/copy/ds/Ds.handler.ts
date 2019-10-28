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
import { Copy, IZosFilesResponse, ICopyDatasetOptions } from "../../../api";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to copy a data set.
 */
export default class DsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const options: ICopyDatasetOptions = {};

        if (commandParameters.arguments["from-volume"]) {
            options.fromVolume = commandParameters.arguments["from-volume"];
        }

        if (commandParameters.arguments["to-volume"]) {
            options.toVolume = commandParameters.arguments["to-volume"];
        }

        return Copy.dataSet(
            session,
            commandParameters.arguments.fromDataSetName,
            commandParameters.arguments.toDataSetName,
            options
        );
    }
}
