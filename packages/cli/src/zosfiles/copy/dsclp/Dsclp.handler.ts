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

import { AbstractSession, IHandlerParameters, IHandlerResponseConsoleApi} from "@zowe/imperative";
import { Copy, IZosFilesResponse, IGetOptions, IDataSet, ICopyDatasetOptions, ICrossLparCopyDatasetOptions} from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { getDataSet } from "../../ZosFiles.utils";

/**
 * Handler to copy a data set.
 */

export default class DsclpHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {

        const sourceDataset: IDataSet = getDataSet(commandParameters.arguments.fromDataSetName);
        const targetDataset: IDataSet = getDataSet(commandParameters.arguments.toDataSetName);
        let rejectUnauthorizedFlag = true;
        const console:IHandlerResponseConsoleApi  = commandParameters.response.console;

        if(commandParameters.arguments.rejectUnauthorized == false){
            rejectUnauthorizedFlag = false;
        }

        const options: ICopyDatasetOptions = {
            "from-dataset": sourceDataset,
            enq: commandParameters.arguments.enq,
            replace: commandParameters.arguments.replace,
            responseTimeout: commandParameters.arguments.responseTimeout
        };

        const targetOptions: ICrossLparCopyDatasetOptions = {
            targetUser: commandParameters.arguments.targetUser,
            targetPassword: commandParameters.arguments.targetPassword,
            targetHost: commandParameters.arguments.targetHost,
            targetPort: commandParameters.arguments.targetPort,
            targetVolser:  commandParameters.arguments.targetVolser,
            targetManagementClass:  commandParameters.arguments.targetManagementClass,
            targetStorageClass:   commandParameters.arguments.targetStorageClass,
            targetDataClass: commandParameters.arguments.targetDataClass,
            targetTokenType: commandParameters.arguments.targetTokenType,
            targetTokenValue: commandParameters.arguments.targetTokenValue,
            targetZosmfProfile:  commandParameters.arguments.targetZosmfProfile,
            rejectUnauthorized: rejectUnauthorizedFlag
        };

        const sourceOptions: IGetOptions = {
            binary: commandParameters.arguments.binary,
            encoding: commandParameters.arguments.encoding,
            record: commandParameters.arguments.record,
            volume: commandParameters.arguments.volume
        };

        return Copy.dataSetCrossLPAR( session,
            targetDataset,
            targetOptions,
            sourceOptions,
            options,
            console
        );
    }
}

