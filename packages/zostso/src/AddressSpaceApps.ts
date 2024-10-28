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
import { IIssueResponse } from "../src";

export class AddressSpaceApps {
    /**
     * Start TSO application at address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} parms - optional object with required parameters, @see {IStartTsoParms}
     * @returns {Promise<IASAppResponse>} command response on resolve, @see {IASAppResponse}
     * @memberof StartTso
     */
    public static async start(
        session: AbstractSession,
        accountNumber: string,
        params: IStartTsoAppParms,
        startParms: IStartTsoParms
    ): Promise<IASAppResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(
            accountNumber,
            noAccountNumber.message
        );

        // Address space is not known and must be created
        if (!params.queueID || !params.servletKey) {
            const response: IIssueResponse = {
                success: false,
                startResponse: await StartTso.start(
                    session,
                    accountNumber,
                    startParms
                ),
                startReady: false,
                zosmfResponse: null,
                commandResponse: null,
                stopResponse: null,
            };
            // Reassigning servletKey and queueID so the application can be started at the correct location
            params.servletKey =
                response.startResponse.zosmfTsoResponse.servletKey;
            params.queueID = response.startResponse.zosmfTsoResponse.queueID;
        }

        // Address space application starting
        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        const response = await ZosmfRestClient.postExpectJSON<
        IASAppResponse & { ver: string }
        >(session, endpoint, [Headers.APPLICATION_JSON], {
            startcmd: `${params.startupCommand} '&1 &2 ${params.queueID}'`,
        });
        const formattedApiResponse: IASAppResponse = {
            version: response.ver,
            reused: response.reused,
            timeout: response.timeout,
            servletKey: params.servletKey ?? null,
            queueID: params.queueID ?? null,
            tsoData: response.tsoData?.map((message: any) => {
                const messageKey = message["TSO MESSAGE"]
                    ? "TSO MESSAGE"
                    : "TSO PROMPT";
                return {
                    VERSION: message[messageKey].VERSION,
                    DATA: message[messageKey].DATA,
                };
            }),
        };

        return formattedApiResponse;
    }
    /**
     * Send message to TSO application at address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} parms - optional object with required parameters,
     * @returns {Promise<IASAppResponse>} command response on resolve, @see {IASAppResponse}
     * @memberof SendTso
     */
    public static async send(
        session: AbstractSession,
        accountNumber: string,
        params: ITsoAppCommunicationParms,
        startParms: IStartTsoParms
    ): Promise<IASAppResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(
            accountNumber,
            noAccountNumber.message
        );

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;

        const apiResponse = await ZosmfRestClient.putExpectJSON<
        IASAppResponse & { ver: string }
        >(
            session,
            endpoint,
            [Headers.CONTENT_TYPE, "text/plain"],
            params.message
        );

        const formattedApiResponse: IASAppResponse = {
            version: apiResponse.ver,
            reused: apiResponse.reused,
            timeout: apiResponse.timeout,
            servletKey: apiResponse.servletKey ?? null,
            queueID: apiResponse.queueID ?? null,
            tsoData: apiResponse.tsoData?.map((message: any) => {
                const messageKey = message["TSO MESSAGE"]
                    ? "TSO MESSAGE"
                    : "TSO PROMPT";
                return {
                    VERSION: message[messageKey].VERSION,
                    DATA: message[messageKey].DATA,
                };
            }),
        };

        return formattedApiResponse;
    }
    /**
     * Receive message from TSO application at address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} parms - optional object with required parameters,
     * @returns {Promise<IASAppResponse>} command response on resolve, @see {IASAppResponse}
     * @memberof SendTso
     */
    public static async receive(
        session: AbstractSession,
        accountNumber: string,
        params: ITsoAppCommunicationParms
    ): Promise<IASAppResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(
            accountNumber,
            noAccountNumber.message
        );
        const TIMEOUT_SECONDS: number = params.timeout;

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        let combinedResponse: IASAppResponse | null = null;
        let endKeyword = false;
        const startTime = Date.now();
        let timeoutReached = false;

        do {
            if (Date.now() - startTime > TIMEOUT_SECONDS * 1000) { // eslint-disable-line
                timeoutReached = true;
                break;
            }

            try {
                const apiResponse = await ZosmfRestClient.getExpectJSON<
                IASAppResponse & { ver: string; appData?: any }
                >(session, endpoint);
                const response = apiResponse as IASAppResponse & {
                    ver: string;
                    appData?: any;
                };
                const formattedApiResponse: IASAppResponse = {
                    version: response.ver,
                    reused: response.reused,
                    timeout: response.timeout,
                    servletKey: response.servletKey ?? null,
                    queueID: response.queueID ?? null,
                    tsoData: response.tsoData?.map((message: any) => {
                        const messageKey = message["TSO MESSAGE"]
                            ? "TSO MESSAGE"
                            : "TSO PROMPT";
                        return {
                            VERSION: message[messageKey].VERSION,
                            DATA: message[messageKey].DATA,
                        };
                    }) || [response.appData],
                };

                if (combinedResponse === null) {
                    combinedResponse = formattedApiResponse;
                } else {
                    combinedResponse.tsoData.push(
                        ...formattedApiResponse.tsoData
                    );
                }
                endKeyword = formattedApiResponse.tsoData.some((data: any) =>
                    typeof data === "string"
                        ? data.trim() === "READY"
                        : data.DATA.trim() === "READY"
                );
            } catch (error) {
                if (combinedResponse) {
                    return combinedResponse;
                }
                throw error;
            }
        } while (!endKeyword && params.receiveUntilReady && !timeoutReached);

        return combinedResponse!;
    }
}
