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
import { Get } from "@zowe/zos-files-for-zowe-sdk";
import { CompareBaseHandler } from "../CompareBase.handler";
import { CompareBaseHelper } from "../CompareBaseHelper";

/**
 * Handler to view a data set's content
 * @export
 */
export default class UssFileHandler extends CompareBaseHandler {
    public async getFile1(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer> {
        return await Get.USSFile(session, args.ussFilePath1, { ...helper.file1Options, task: helper.task });
    }
    public async getFile2(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer> {
        return await Get.USSFile(session, args.ussFilePath2, { ...helper.file2Options, task: helper.task });
    }
}
