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
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { HMigrate } from "@zowe/zos-files-for-zowe-sdk";

/**
 * Handler to migrate a Data Set
 */
export default class DSHandler extends ZosFilesBaseHandler {
  public async processWithSession(
    commandParameters: IHandlerParameters,
    session: AbstractSession
  ): Promise<IZosFilesResponse> {

    const { options } = commandParameters.arguments;

    return HMigrate.dataSet(session, commandParameters.arguments.dataSetName, options);
  }
}
