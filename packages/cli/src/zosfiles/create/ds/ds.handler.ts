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
import { Create, CreateDataSetTypeEnum, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { mapArgumentsToOptions } from "../../../Utils";
import { DsDefinition } from "./ds.definition";

/**
 * Handler to like a data set
 */

export default class DataSetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        if (commandParameters.arguments.like == null) {
            return Create.dataSet(
                session,
                CreateDataSetTypeEnum.DATA_SET_BLANK,
                commandParameters.arguments.dataSetName,
                mapArgumentsToOptions(commandParameters.arguments, DsDefinition.options)
            );

        }
        else {
            return Create.dataSetLike(
                session,
                commandParameters.arguments.dataSetName,
                commandParameters.arguments.like,
                mapArgumentsToOptions(commandParameters.arguments, DsDefinition.options)
            );
        }

    }
}
