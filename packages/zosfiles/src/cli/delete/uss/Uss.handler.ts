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
import { Delete, IZosFilesResponse } from "../../../api";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to delete a USS file.
 */
export default class UssHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        return Delete.ussFile(session, commandParameters.arguments.fileName, commandParameters.arguments.recursive);
    }
}
