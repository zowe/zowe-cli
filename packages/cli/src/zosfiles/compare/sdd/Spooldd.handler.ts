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

import { AbstractSession, ICommandArguments } from "@zowe/imperative";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { CompareBaseHandler } from "../CompareBase.handler";
import {CompareBaseHelper } from "../CompareBaseHelper";

/**
 * Handler to compare spooldd's content
 * @export
 */
export default class SpoolddHandler extends CompareBaseHandler {
    public async getFile1(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer> {
        const { jobName, jobId, spoolId } = helper.prepareSpoolDescriptor(args.spoolDescription1);
        return await GetJobs.getSpoolContentById(session, jobName, jobId, spoolId);
    }
    public async getFile2(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer> {
        const { jobName, jobId, spoolId } = helper.prepareSpoolDescriptor(args.spoolDescription2);
        return await GetJobs.getSpoolContentById(session, jobName, jobId, spoolId);
    }
}
