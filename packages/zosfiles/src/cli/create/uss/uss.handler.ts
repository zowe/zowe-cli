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

/**
 * Handler to create a z/OS file system
 */
export default class UssHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // collect the options from our command line arguments into an object
        // const createUssOptions: Partial<ICreateUssOptions> = {
        //     type: commandParameters.arguments.type,
        //     mode: commandParameters.arguments.mode
        // };
        const srtType = commandParameters.arguments.type;
        const strMode = commandParameters.arguments.mode;


        return Create.uss(session, commandParameters.arguments.ussPath, srtType, strMode);
    }
}
