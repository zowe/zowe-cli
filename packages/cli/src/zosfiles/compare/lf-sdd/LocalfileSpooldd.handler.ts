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

import { AbstractSession, ICommandArguments } from "@zowe/core-for-zowe-sdk";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { CompareBaseHelper } from "../CompareBaseHelper";
import { CompareBaseHandler } from "../CompareBase.handler";

/**
 * Handler to compare spooldd's content
 * @export
 */
export default class LocalfileSpoolddHandler extends CompareBaseHandler {
    public async getFile1(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer> {
        return helper.prepareLocalFile(args.localFilePath);
    }
    public async getFile2(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer> {
        const { jobName, jobId, spoolId } = helper.prepareSpoolDescriptor(args.spoolDescription);
        return await GetJobs.getSpoolContentById(session, jobName, jobId, spoolId);
    }
}