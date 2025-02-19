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

import { noAccountNumber, TsoConstants } from "./TsoConstants";
import { ITsoAppCommunicationParms } from "./doc/input/ITsoAppCommunicationParms";
import { IASAppResponse } from "./doc/IASAppResponse";
import { AbstractSession, Headers } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IStartTsoParms } from "./doc/input/IStartTsoParms";
import { TsoValidator } from "./TsoValidator";
import { IStartTsoAppParms } from "./doc/input/IStartTsoAppParms";
import { StartTso } from "./StartTso";
import { IIssueResponse } from "./doc/IIssueResponse";

export class AddressSpaceApps {
    /**
     * Format API response to IASAppResponse structure.
     * @static
     * @param {any} response - Raw API response
     * @param {string | null} servletKey - Servlet key if present
     * @param {string | null} queueID - Queue ID if present
     * @returns {IASAppResponse} Formatted API response
     */
    private static formatResponse(response: any, servletKey: string | null, queueID: string | null): IASAppResponse {
        return {
            version: response.ver,
            reused: response.reused,
            timeout: response.timeout,
            servletKey: servletKey ?? null,
            queueID: queueID ?? null,
            tsoData: response.tsoData?.map((message: any) => {
                const messageKey = message["TSO MESSAGE"] ? "TSO MESSAGE" : "TSO PROMPT";
                return {
                    VERSION: message[messageKey].VERSION,
                    DATA: message[messageKey].DATA,
                };
            }) || [response.appData],
        };
    }

    public static async start(
        session: AbstractSession,
        accountNumber: string,
        params: IStartTsoAppParms,
        startParms: IStartTsoParms
    ): Promise<IASAppResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(accountNumber, noAccountNumber.message);

        if (!params.queueID || !params.servletKey) {
            const response: IIssueResponse = {
                success: false,
                startResponse: await StartTso.start(session, accountNumber, startParms),
                startReady: false,
                zosmfResponse: null,
                commandResponse: null,
                stopResponse: null,
            };
            params.servletKey = response.startResponse.zosmfTsoResponse.servletKey;
            params.queueID = response.startResponse.zosmfTsoResponse.queueID;
        }

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        const response = await ZosmfRestClient.postExpectJSON<IASAppResponse & { ver: string }>(
            session,
            endpoint,
            [Headers.APPLICATION_JSON],
            { startcmd: `${params.startupCommand} '&1 &2 ${params.queueID}'` }
        );

        return AddressSpaceApps.formatResponse(response, params.servletKey, params.queueID);
    }

    public static async send(
        session: AbstractSession,
        accountNumber: string,
        params: ITsoAppCommunicationParms,
        _startParms: IStartTsoParms
    ): Promise<IASAppResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(accountNumber, noAccountNumber.message);

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        const apiResponse = await ZosmfRestClient.putExpectJSON<IASAppResponse & { ver: string }>(
            session,
            endpoint,
            [Headers.CONTENT_TYPE, "text/plain"],
            params.message
        );

        return AddressSpaceApps.formatResponse(apiResponse, apiResponse.servletKey ?? null, apiResponse.queueID ?? null);
    }

    public static async receive(
        session: AbstractSession,
        accountNumber: string,
        params: ITsoAppCommunicationParms
    ): Promise<IASAppResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(accountNumber, noAccountNumber.message);
        const TIMEOUT_SECONDS: number = params.timeout;

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        let combinedResponse: IASAppResponse | null = null;
        let endKeyword = false;
        const startTime = Date.now();

        do {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (Date.now() - startTime > TIMEOUT_SECONDS * 1000) {
                break;
            }

            try {
                const apiResponse = await ZosmfRestClient.getExpectJSON<IASAppResponse & { ver: string; appData?: any }>(
                    session,
                    endpoint
                );
                const formattedResponse = AddressSpaceApps.formatResponse(apiResponse, apiResponse.servletKey ?? null, apiResponse.queueID ?? null);

                if (combinedResponse === null) {
                    combinedResponse = formattedResponse;
                } else {
                    combinedResponse.tsoData.push(...formattedResponse.tsoData);
                }

                endKeyword = formattedResponse.tsoData.some((data: any) =>
                    typeof data === "string" ? data.trim() === "READY" : data.DATA.trim() === "READY"
                );
            } catch (error) {
                if (combinedResponse) {
                    return combinedResponse;
                }
                throw error;
            }
        } while (!endKeyword && params.receiveUntilReady);

        return combinedResponse!;
    }
}
