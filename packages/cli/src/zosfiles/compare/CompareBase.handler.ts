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

import { AbstractSession, ICommandArguments, IHandlerParameters, TaskStage } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../ZosFilesBase.handler";
import { CompareBaseHelper } from "./CompareBaseHelper";

/**
 * This class is used by the various zosfiles-compare handlers as the base class for their implementation.
 * All handlers within zosfiles-compare should extend this class.
 *
 * This class should not be used outside of the zosfiles-compare package.
 *
 * @private
 */
export abstract class CompareBaseHandler extends ZosFilesBaseHandler {
    /**
     * This will grab the zosmf profile and create a session before calling the subclass
     * {@link ZosFilesBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const helper = new CompareBaseHelper(commandParameters);
        helper.task = {
            percentComplete: 0,
            statusMessage: `Retrieving content for the first file/dataset`,
            stageName: TaskStage.IN_PROGRESS
        };

        commandParameters.response.progress.startBar({ task: helper.task });

        const fileContent1 = await this.getFile1(session, commandParameters.arguments, helper);
        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task: helper.task });

        helper.task.statusMessage = `Retrieving content for the second file/dataset`;
        const fileContent2 = await this.getFile2(session, commandParameters.arguments, helper);

        return helper.getResponse(helper.prepareContent(fileContent1), helper.prepareContent(fileContent2));
    }

    /**
     * Abstract method required for compare handlers to determine how they gather the contents of the file/dataset to compare
     * @param session Gives access to the session object in case the handler needs to submit a request to get the first file
     * @param args Command arguments required for getting the dataset, filepath, or spool descriptor
     * @param helper CompareBaseHelper instance to access prepare- functions
     */
    public abstract getFile1(
        session: AbstractSession,
        args: ICommandArguments,
        helper: CompareBaseHelper,
    ): Promise<string | Buffer>;

    /**
     * Abstract method required for compare handlers to determine how they gather the contents of the file/dataset to compare
     * @param session Gives access to the session object in case the handler needs to submit a request to get the contents
     * @param args Command arguments required for getting the dataset, filepath, or spool descriptor
     * @param helper CompareBaseHelper instance to access prepare- functions
     */
    public abstract getFile2(
        session: AbstractSession,
        args: ICommandArguments,
        helper: CompareBaseHelper,
    ): Promise<string | Buffer>;
}
