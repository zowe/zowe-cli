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
import { IZosFilesResponse } from "../../../api/doc/IZosFilesResponse";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { Unmount } from "../../../api/methods/unmount";

/**
 * Handler to unmount a Unix file system
 */
export default class FsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        return Unmount.fs(session, commandParameters.arguments.fileSystemName);
    }
}
