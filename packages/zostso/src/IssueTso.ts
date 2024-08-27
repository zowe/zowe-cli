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

import { AbstractSession, Headers, ImperativeError } from "@zowe/imperative";
import { IStartTsoParms } from "./doc/input/IStartTsoParms";
import { noAccountNumber, noCommandInput, TsoConstants } from "./TsoConstants";
import { SendTso } from "./SendTso";
import { StartTso } from "./StartTso";
import { IIssueResponse } from "./doc/IIssueResponse";
import { StopTso } from "./StopTso";
import { TsoValidator } from "./TsoValidator";
import { IIssueTsoParms } from "./doc/input/IIssueTsoParms";
import { CheckStatus, ZosmfConstants } from "@zowe/zosmf-for-zowe-sdk";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IIssueTsoCmdResponse } from "./doc/IIssueTsoCmdResponse";
import { IIssueTsoCmdParms } from "./doc/input/IIssueTsoCmdParms";
const { ProfileInfo } = require("@zowe/imperative");
/**
 * Class to handle issue command to TSO
 * @class IssueTso
 */
export class IssueTso {

    public static async issueTsoCmd(
        session: AbstractSession,
        commandInfo: string | IIssueTsoCmdParms,
        addressSpaceOptions?: IStartTsoParms
    ): Promise<IIssueTsoCmdResponse | IIssueResponse> {
        let command: string | IIssueTsoCmdParms;
        let version: string;
        let isStateful: boolean;
        const useNewApi = addressSpaceOptions == null && await CheckStatus.isZosVersionGreaterThan(session, ZosmfConstants.VERSIONS.V2R4);
        let newApiFailureOverride: boolean = false;
        if (addressSpaceOptions == null && await CheckStatus.isZosVersionGreaterThan(session, ZosmfConstants.VERSIONS.V2R4)) {
            command = commandInfo;
            version = "v1";
            isStateful = false;
            try {
                const endpoint = `${TsoConstants.RESOURCE}/${version}/${TsoConstants.RES_START_TSO}`;
                return await ZosmfRestClient.putExpectJSON<IIssueTsoCmdResponse>(session, endpoint, [Headers.APPLICATION_JSON], {
                    "tsoCmd": command,
                    "cmdState": isStateful ? "stateful" : "stateless"
                });
            } catch {
                newApiFailureOverride = true;
                const profInfo = new ProfileInfo("zowe");
                await profInfo.readProfilesFromDisk();
                addressSpaceOptions = profInfo.getTeamConfig().api.profiles.defaultGet("tso");
            }
        }

        // Old behavior
        if ((addressSpaceOptions != null || !useNewApi) || newApiFailureOverride) {
            command = typeof commandInfo === "string" ? commandInfo : commandInfo.command;
            version = typeof commandInfo === "string" ? "v1" : commandInfo.version ?? "v1";
            isStateful = typeof commandInfo === "string" ? false : commandInfo.isStateful ?? false;
            TsoValidator.validateSession(session);
            TsoValidator.validateNotEmptyString(addressSpaceOptions?.account, noAccountNumber.message);
            TsoValidator.validateNotEmptyString(command as string, noCommandInput.message);

            const response: IIssueResponse = {
                success: false,
                startResponse: await StartTso.start(session, addressSpaceOptions?.account, addressSpaceOptions || {}),
                startReady: false,
                zosmfResponse: null,
                commandResponse: null,
                stopResponse: null
            };

            if (!response.startResponse.success) {
                throw new ImperativeError({
                    msg: `TSO address space failed to start.`,
                    additionalDetails: response.startResponse.failureResponse?.message
                });
            }

            const sendResponse = await SendTso.sendDataToTSOCollect(session, response.startResponse.servletKey, command as string);
            response.success = sendResponse.success;
            response.zosmfResponse = sendResponse.zosmfResponse;
            response.commandResponse = sendResponse.commandResponse;
            response.stopResponse = await StopTso.stop(session, response.startResponse.servletKey);
            return response;
        } else {
            throw "ERROR";
        }
    }

    /**
     * @deprecated Use issueTsoCmd instead
     * API method to start a TSO address space, issue a command, collect responses until prompt is reached, and terminate the address space.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} accountNumber - accounting info for Jobs
     * @param {string} command - command text to issue to the TSO address space.
     * @param {IStartTsoParms} startParams - optional object with required parameters for starting TSO address space, @see {IStartTsoParms}
     * @returns {Promise<IIssueResponse>} IssueTso response object, @see {IIssueResponse}
     * @memberof IssueTso
     */
    public static async issueTsoCommand(session: AbstractSession, accountNumber: string, command: string, startParams?: IStartTsoParms): Promise<IIssueResponse> {
        return await IssueTso.issueTsoCmd(session, command, { ...startParams, account: accountNumber }) as IIssueResponse;
    }

    /**
     * @deprecated use issueTsoCmd instead
     * API method to start a TSO address space with provided parameters, issue a command,
     * collect responses until prompt is reached, and terminate the address space.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IIssueTsoParms} commandParms - object with required parameters, @see {IIssueTsoParms}
     * @returns {Promise<IIssueResponse>}
     */
    public static async issueTsoCommandCommon(session: AbstractSession, commandParms: IIssueTsoParms): Promise<IIssueResponse> {
        return await IssueTso.issueTsoCmd(session, commandParms.command, {
            ...commandParms.startParams, account: commandParms.accountNumber
        }) as IIssueResponse;
    }

}
