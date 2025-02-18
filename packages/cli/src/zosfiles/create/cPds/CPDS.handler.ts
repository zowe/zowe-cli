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
import { mapArgumentsToOptions } from "../../../Utils";
import { CPDSDefinition } from "./CPDS.definition";

/**
 * Handler to create a C-PDS data set
 */
export default class CPDSHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        return Create.dataSet(
            session,
            CreateDataSetTypeEnum.DATA_SET_C,
            commandParameters.arguments.dataSetName,
            mapArgumentsToOptions(commandParameters.arguments, CPDSDefinition.options)
        );
    }
}
