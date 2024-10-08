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

import { AbstractSession } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { TsoValidator } from "./TsoValidator";
import { noAccountNumber, TsoConstants } from "./TsoConstants";
import { ITsoAppCommunicationParms } from "./doc/input/ITsoAppCommunicationParms";
import { IASAppResponse } from "./doc/IASAppResponse";
/**
 * Send message to TSO App running at an address space
 * @export
 * @class RecieveTsoApp
 */
export class ReceiveTsoApp {
    /**
     * Start TSO application at address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} params - optional object with required parameters, @see {IStartTsoParms}
     * @returns {Promise<IASAppResponse>} command response on resolve, @see {IASAppResponse}
     * @memberof StartTso
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

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        let combinedResponse: IASAppResponse | null = null;

        let endKeyword: boolean = false;
        do {
            const apiResponse = await ZosmfRestClient.getExpectJSON<
                IASAppResponse & { ver: string }
            >(session, endpoint);

            const formattedApiResponse: IASAppResponse = {
                version: apiResponse.ver,
                reused: apiResponse.reused,
                timeout: apiResponse.timeout,
                servletKey: apiResponse.servletKey ?? null,
                queueID: apiResponse.queueID ?? null,
                tsoData: apiResponse.tsoData.map((message: any) => {
                    const messageKey = message["TSO MESSAGE"]
                        ? "TSO MESSAGE"
                        : "TSO PROMPT";
                    return {
                        VERSION: message[messageKey].VERSION,
                        DATA: message[messageKey].DATA,
                    };
                }),
            };

            if (combinedResponse === null) {
                combinedResponse = formattedApiResponse;
            } else {
                combinedResponse.tsoData.push(...formattedApiResponse.tsoData);
            }

            endKeyword = formattedApiResponse.tsoData.some(
                (data) => data.DATA.trim() === "READY"
            );
        } while (!endKeyword && params.receiveUntil);

        return combinedResponse!;
    }
}
