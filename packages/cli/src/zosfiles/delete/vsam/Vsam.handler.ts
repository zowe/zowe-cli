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

import { AbstractSession, IHandlerParameters } from "@zowe/core-for-zowe-sdk";
import { Delete, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to delete a VSAM data set.
 */
export default class VsamHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        return Delete.vsam(session, commandParameters.arguments.dataSetName, {
            erase: commandParameters.arguments.erase,
            purge: commandParameters.arguments.purge,
            responseTimeout: commandParameters.arguments.responseTimeout
        });
    }
}
