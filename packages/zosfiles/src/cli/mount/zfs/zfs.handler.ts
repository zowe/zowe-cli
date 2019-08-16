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
import { IMountZfsOptions } from "../../../api/methods/mount/doc/IMountZfsOptions";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { Mount } from "../../../api/methods/mount";

/**
 * Handler to create a z/OS file system
 */
export default class ZfsHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        // collect the options from our command line arguments into an object
        const mountZfsOptions: Partial<IMountZfsOptions> = {
            mountPoint: commandParameters.arguments.mountPoint,
            fstype: commandParameters.arguments.fstype,
            mode: commandParameters.arguments.mode,
        };

        return Mount.zfs(session, commandParameters.arguments.fileSystemName, mountZfsOptions);
    }
}
