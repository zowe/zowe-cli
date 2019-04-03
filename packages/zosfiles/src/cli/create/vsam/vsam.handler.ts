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
import { ICreateVsamOptions } from "../../../api/methods/create/doc/ICreateVsamOptions";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { Create } from "../../../api/methods/create";

/**
 * Handler to create a VSAM data set
 */
export default class VsamHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // collect the options from our command line arguments into an object
        const createVsamOptions: Partial<ICreateVsamOptions> = JSON.parse(JSON.stringify({
            dsorg: commandParameters.arguments.dataSetOrganization,
            size: commandParameters.arguments.size,
            secondary: commandParameters.arguments.secondarySpace,
            volumes: commandParameters.arguments.volumes,
            storeclass: commandParameters.arguments.storageClass,
            mgntclass: commandParameters.arguments.managementClass,
            dataclass: commandParameters.arguments.dataClass,
            retainFor: commandParameters.arguments.retainFor,
            retainTo: commandParameters.arguments.retainTo,
            showAttributes: commandParameters.arguments.showAttributes
        }));

        return Create.vsam(session, commandParameters.arguments.dataSetName, createVsamOptions);
    }
}
