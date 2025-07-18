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
import { IIssueTsoCmdOpts } from "./doc/input/IIssueTsoCmdOpts";
/**
 * Class to handle issue command to TSO
 * @class IssueTso
 */
export class IssueTso {
    public static async issueTsoCmd(
        session: AbstractSession,
        command: string,
        opts?: IIssueTsoCmdOpts
    ): Promise<IIssueResponse> {
        let version: string;
        opts = opts || {};
        opts.suppressStartupMessages = opts.suppressStartupMessages ?? true;
        const versionCheck = await CheckStatus.isZosVersionAtLeast(
            session,
            ZosmfConstants.VERSIONS.V2R4
        );
        const useNewApi =
            opts.addressSpaceOptions == null ||
            versionCheck && opts.suppressStartupMessages;

        if (useNewApi) {
            version = "v1";
            try {
                const endpoint = `${TsoConstants.RESOURCE}/${version}/${TsoConstants.RES_START_TSO}`;
                const apiResponse =
                    await ZosmfRestClient.putExpectJSON<IIssueTsoCmdResponse>(
                        session,
                        endpoint,
                        [Headers.APPLICATION_JSON],
                        {
                            tsoCmd: command,
                            cmdState: opts.isStateful
                                ? "stateful"
                                : "stateless",
                        }
                    );
                const response: IIssueResponse = {
                    success: true,
                    startReady:
                        apiResponse.cmdResponse[
                            apiResponse.cmdResponse.length - 1
                        ].message.trim() === "READY",
                    zosmfResponse: [apiResponse as any],
                    commandResponse: apiResponse.cmdResponse
                        .map((item) => item.message)
                        .join("\n"),
                };
                return response;
            } catch (e) {
                if (e.message == null || !e.message.includes("status 404")) {
                    throw e;
                }
            }
        }

        // Deprecated API Behavior [former issueTsoCommand() behavior]
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(
            opts.addressSpaceOptions?.account,
            noAccountNumber.message
        );
        TsoValidator.validateNotEmptyString(
            command as string,
            noCommandInput.message
        );

        const response: IIssueResponse = {
            success: false,
            startResponse: await StartTso.start(
                session,
                opts.addressSpaceOptions?.account,
                opts.addressSpaceOptions || {}
            ),
            startReady: false,
            zosmfResponse: null,
            commandResponse: null,
            stopResponse: null,
        };

        if (!response.startResponse.success) {
            throw new ImperativeError({
                msg: `TSO address space failed to start.`,
                additionalDetails:
                    response.startResponse.failureResponse?.message,
            });
        }

        if(response.startResponse.messages?.includes("IKJ56482I")) {
            throw new ImperativeError({
                msg: `Invalid logon procedure.`,
                additionalDetails: response.startResponse.messages
            });
        }

        const sendResponse = await SendTso.sendDataToTSOCollect(
            session,
            response.startResponse.servletKey,
            command as string
        );
        response.success = sendResponse.success;
        response.zosmfResponse = sendResponse.zosmfResponse;
        response.commandResponse = sendResponse.commandResponse;
        response.stopResponse = await StopTso.stop(
            session,
            response.startResponse.servletKey
        );
        return response;
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
    public static async issueTsoCommand(
        session: AbstractSession,
        accountNumber: string,
        command: string,
        startParams?: IStartTsoParms
    ): Promise<IIssueResponse> {
        return await IssueTso.issueTsoCmd(session, command, {
            suppressStartupMessages: false,
            addressSpaceOptions: { ...startParams, account: accountNumber },
        });
    }

    /**
     * @deprecated use issueTsoCmd instead
     * API method to start a TSO address space with provided parameters, issue a command,
     * collect responses until prompt is reached, and terminate the address space.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IIssueTsoParms} commandParms - object with required parameters, @see {IIssueTsoParms}
     * @returns {Promise<IIssueResponse>}
     */
    public static async issueTsoCommandCommon(
        session: AbstractSession,
        commandParms: IIssueTsoParms
    ): Promise<IIssueResponse> {
        return await IssueTso.issueTsoCmd(session, commandParms.command, {
            suppressStartupMessages: false,
            addressSpaceOptions: {
                ...commandParms.startParams,
                account: commandParms.accountNumber,
            },
        });
    }
}
