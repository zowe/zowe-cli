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
import { Copy, IZosFilesResponse, IDataSet, ICopyDatasetOptions } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { getDataSet } from "../../ZosFiles.utils";

/**
 * Handler to copy a data set.
 */
export default class DsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const fromDataSet: IDataSet = getDataSet(commandParameters.arguments.fromDataSetName);
        const toDataSet: IDataSet = getDataSet(commandParameters.arguments.toDataSetName);
        const options: ICopyDatasetOptions = { fromDataSet, responseTimeout: commandParameters.arguments.responseTimeout };
        if (commandParameters.arguments.replace) {
            options.replace = commandParameters.arguments.replace;
        }
          responseTimeout: commandParameters.arguments.responseTimeout
        };
        return Copy.dataSet(session, toDataSet, options);
    }
}
