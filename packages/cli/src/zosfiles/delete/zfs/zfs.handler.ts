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

import { Delete, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { IZosFilesOptions } from "@zowe/zos-files-for-zowe-sdk";

/**
 * Handler to delete a z/OS file system.
 */
export default class ZfsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const zosFilesOptions: IZosFilesOptions = {responseTimeout: commandParameters.arguments.responseTimeout};
        return Delete.zfs(session, commandParameters.arguments.fileSystemName, zosFilesOptions);
    }
}
