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
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ICreateZfsOptions } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { Create } from "@zowe/zos-files-for-zowe-sdk";

/**
 * Handler to create a z/OS file system
 */
export default class ZfsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // collect the options from our command line arguments into an object
        const createZfsOptions: Partial<ICreateZfsOptions> = {
            owner: commandParameters.arguments.owner,
            group: commandParameters.arguments.group,
            perms: commandParameters.arguments.perms,
            cylsPri: commandParameters.arguments.cylsPri,
            cylsSec: commandParameters.arguments.cylsSec,
            storclass: commandParameters.arguments.storageClass,
            mgntclass: commandParameters.arguments.managementClass,
            dataclass: commandParameters.arguments.dataClass,
            volumes: commandParameters.arguments.volumes,
            timeout: commandParameters.arguments.timeout,
            responseTimeout: commandParameters.arguments.responseTimeout
        };

        return Create.zfs(session, commandParameters.arguments.fileSystemName, createZfsOptions);
    }
}
