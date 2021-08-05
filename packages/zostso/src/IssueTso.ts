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

import { AbstractSession, ImperativeError } from "@zowe/imperative";
import { IStartTsoParms } from "./doc/input/IStartTsoParms";
import { noAccountNumber, noCommandInput } from "./TsoConstants";
import { SendTso } from "./SendTso";
import { StartTso } from "./StartTso";
import { IIssueResponse } from "./doc/IIssueResponse";
import { StopTso } from "./StopTso";
import { TsoValidator } from "./TsoValidator";
import { IIssueTsoParms } from "./doc/input/IIssueTsoParms";

/**
 * Class to handle issue command to TSO
 * @class IssueTso
 */
export class IssueTso {

    /**
     * API method to start a TSO address space, issue a command, collect responses until prompt is reached, and terminate the address space.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} accountNumber - accounting info for Jobs
     * @param {string} command - command text to issue to the TSO address space.
     * @param {IStartTsoParms} startParams - optional object with required parameters for starting TSO address space, @see {IStartTsoParms}
     * @returns {Promise<IIssueResponse>} IssueTso response object, @see {IIssueResponse}
     * @memberof IssueTso
     */
    public static async issueTsoCommand(session: AbstractSession, accountNumber: string, command: string, startParams?: IStartTsoParms) {

        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(accountNumber, noAccountNumber.message);
        TsoValidator.validateNotEmptyString(command, noCommandInput.message);

        const response: IIssueResponse = {
            success: false,
            startResponse: null,
            startReady: false,
            zosmfResponse: null,
            commandResponse: null,
            stopResponse: null
        };
        response.startResponse = await StartTso.start(session, accountNumber, startParams || {});

        if (!response.startResponse.success) {
            throw new ImperativeError({
                msg: `TSO address space failed to start.`,
                additionalDetails: response.startResponse.failureResponse?.message
            });
        }

        const sendResponse = await SendTso.sendDataToTSOCollect(session, response.startResponse.servletKey, command);
        response.success = sendResponse.success;
        response.zosmfResponse = sendResponse.zosmfResponse;
        response.commandResponse = sendResponse.commandResponse;
        response.stopResponse = await StopTso.stop(session, response.startResponse.servletKey);
        return response;
    }

    /**
     * API method to start a TSO address space with provided parameters, issue a command,
     * collect responses until prompt is reached, and terminate the address space.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IIssueTsoParms} commandParms - object with required parameters, @see {IIssueTsoParms}
     * @returns {Promise<IIssueResponse>}
     */
    public static async issueTsoCommandCommon(session: AbstractSession, commandParms: IIssueTsoParms) {

        TsoValidator.validateSession(session);
        TsoValidator.validateIssueParams(commandParms);
        TsoValidator.validateNotEmptyString(commandParms.command, noCommandInput.message);
        return IssueTso.issueTsoCommand(session, commandParms.accountNumber, commandParms.command, commandParms.startParams);
    }

}
