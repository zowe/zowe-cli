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
import { IZosFilesResponse, Create, CreateDataSetTypeEnum } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { generateZosmfOptions } from "../Create.utils";

/**
 * Handler to create a compiler listing PDSE data set
 */
export default class LISTINGPDSHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        return Create.dataSet(
            session,
            CreateDataSetTypeEnum.DATA_SET_LISTING,
            commandParameters.arguments.dataSetName,
            generateZosmfOptions(commandParameters.arguments)
        );
    }
}
