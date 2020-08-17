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
import { ICreateUssOptions } from "../../../api/methods/create/doc/ICreateUssOption";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { Create } from "../../../api/methods/create";
import { IZosFilesOptions } from "../../../api/doc/IZosFilesOptions";

/**
 * Handler to create a USS Directory
 */
export default class UssDirHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const strMode = commandParameters.arguments.mode;
        const zosFilesOptions: IZosFilesOptions = { responseTimeout: commandParameters.arguments.responseTimeout};

        return Create.uss(session, commandParameters.arguments.ussPath, "directory", strMode, zosFilesOptions);
    }
}
