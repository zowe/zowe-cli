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

import { AbstractSession, ICommandHandler, IHandlerParameters } from "@zowe/imperative";
import { IZosFilesResponse } from "../../../api/doc/IZosFilesResponse";
import { Create, CreateDataSetTypeEnum } from "../../../api/methods/create";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { generateZosmfOptions } from "../Create.utils";

/**
 * Handler to create a C-PDS data set
 */
export default class CPDSHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        return Create.dataSet(
            session,
            CreateDataSetTypeEnum.DATA_SET_C,
            commandParameters.arguments.dataSetName,
            generateZosmfOptions(commandParameters.arguments)
        );
    }
}
