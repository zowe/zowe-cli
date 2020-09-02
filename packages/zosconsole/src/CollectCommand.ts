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

import { AbstractSession, Logger, TextUtils } from "@zowe/imperative";

import { ZosmfRestClient } from "@zowe/rest-for-zowe-sdk";
import { isNullOrUndefined } from "util";
import { ConsoleValidator } from "./ConsoleValidator";
import { IZosmfCollectResponse } from "./doc/zosmf/IZosmfCollectResponse";
import { collectProcessingDetails, ConsoleConstants, decreaseCounter, resetCounter } from "./ConsoleConstants";
import { ICollectParms } from "./doc/ICollectParms";
import { IConsoleResponse } from "./doc/IConsoleResponse";
import { ConsoleResponseService } from "./ConsoleResponseService";

/**
 * Get the response to a command that was issued asynchronously with the Issue Command service
 * @export
 * @class CollectCommand
 */
export class CollectCommand {

    /**
     * Collect any messages related to the synchronous command response key provided
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {string} consoleName name of the EMCS console that is used to issue the command
     * @param {string} commandResponseKey command response key from the Issue Command request
     * @returns {Promise<IZosmfIssueResponse>} command response on resolve, @see {IZosmfIssueResponse}
     * @memberof CollectCommand
     */
    public static collectCommon(session: AbstractSession, consoleName: string, commandResponseKey: string) {
        ConsoleValidator.validateCollectCommonParms(session, consoleName, commandResponseKey);

        return ZosmfRestClient.getExpectJSON<IZosmfCollectResponse>(session,
            CollectCommand.getResource(consoleName, commandResponseKey));
    }

    /**
     * Collect any messages (from default console) related to the synchronous command response key provided
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {string} commandResponseKey command response key from the Issue Command request
     * @return {Promise<IZosmfCollectResponse>} command response on resolve, @see {IZosmfCollectResponse}
     * @memberof CollectCommand
     */
    public static collectDefConsoleCommon(session: AbstractSession, commandResponseKey: string) {
        return CollectCommand.collectCommon(session, ConsoleConstants.RES_DEF_CN, commandResponseKey);
    }

    /**
     * Collect any messages related to the synchronous command response key provided and collect them into IConsoleResponse
     *
     * To control additional collection and other behaviors, populate the ICollectParms object according
     * to your needs (see ICollectParms for details).
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {ICollectParms} parms console collect parameters, @see {ICollectParms}
     * @param {IConsoleResponse} response response from previous command (if present), @see {IConsoleResponse}
     * @return {Promise<IConsoleResponse>} command response on resolve, @see {IConsoleResponse}
     * @memberof CollectCommand
     */
    public static async collect(session: AbstractSession, parms: ICollectParms, response?: IConsoleResponse) {
        ConsoleValidator.validateCollectParms(session, parms);

        if (isNullOrUndefined(response)) {
            response = ConsoleResponseService.getEmptyConsoleResponse();
        }

        const consoleName: string = isNullOrUndefined(parms.consoleName) ? ConsoleConstants.RES_DEF_CN : parms.consoleName;
        const maxFollowUpAttempts: number = CollectCommand.getFollowUpAttempts(parms);
        const timeout = CollectCommand.getTimeout(parms);
        let collectResponse: IZosmfCollectResponse;

        let followUpCounter = maxFollowUpAttempts;
        do {
            Logger.getImperativeLogger().info(TextUtils.formatMessage(collectProcessingDetails.message,
                {
                    timer: timeout,
                    counter: followUpCounter
                }));
            try {
                if (timeout > 0) {
                    await new Promise((doNothing) => setTimeout(doNothing, timeout));
                }
                collectResponse = await CollectCommand.collectCommon(session, consoleName, parms.commandResponseKey);

                response = ConsoleResponseService.populate(collectResponse, response, parms.processResponses);
                if (ConsoleResponseService.isLastZosmfResponseEmpty(response)) {
                    followUpCounter--;
                    Logger.getImperativeLogger().info(decreaseCounter.message);
                } else {
                    followUpCounter = maxFollowUpAttempts;
                    Logger.getImperativeLogger().info(resetCounter.message);
                }
            } catch (error) {
                response = ConsoleResponseService.populateError(error, response);
                followUpCounter = 0;
            }
        } while (followUpCounter > 0 || response.keywordDetected);
        return response;
    }

    /**
     * Get resource path for collect command
     * @param {string} consoleName name of the EMCS console that is used to issue the command
     * @param {string} commandResponseKey command response key from the Issue Command request
     * @return {string} resource path
     * @memberof CollectCommand
     */
    public static getResource(consoleName: string, commandResponseKey: string): string {
        return ConsoleConstants.RESOURCE + "/" + consoleName + ConsoleConstants.SOL_MSGS + "/" + commandResponseKey;
    }

    private static readonly TO_SECONDS: number = 1000;

    /**
     *
     * @param {ICollectParms} parms parameters for collect command
     * @return {number}
     */
    private static getFollowUpAttempts(parms: ICollectParms): number {
        return isNullOrUndefined(parms) || isNullOrUndefined(parms.followUpAttempts) ? ConsoleConstants.DEFAULT_FOLLOWUP_ATTEMPTS
            : parms.followUpAttempts;
    }

    /**
     * @static
     * @param {ICollectParms} parms console collect parameters, @see {ICollectParms}s
     * @return {number} timeout in milliseconds or default value
     * @memberof CollectCommand
     */
    private static getTimeout(parms: ICollectParms): number {
        return isNullOrUndefined(parms) || isNullOrUndefined(parms.waitToCollect) ? ConsoleConstants.DEFAULT_TIMEOUT
            : parms.waitToCollect * CollectCommand.TO_SECONDS;
    }

}
