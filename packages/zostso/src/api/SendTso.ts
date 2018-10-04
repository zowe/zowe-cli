/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { AbstractSession, Headers } from "@brightside/imperative";
import { ZosmfHeaders, ZosmfRestClient } from "../../../rest";

import { isNullOrUndefined } from "util";
import { TsoValidator } from "./TsoValidator";
import { noDataInput, noServletKeyInput, TsoConstants } from "./TsoConstants";
import { ISendTsoParms } from "./doc/input/ISendTsoParms";
import { IZosmfTsoResponse } from "./doc/zosmf/IZosmfTsoResponse";
import { ICollectedResponses } from "./doc/ICollectedResponses";
import { ISendResponse } from "./doc/ISendResponse";

/**
 * Class to handle sending data to TSO
 * @class SendTso
 */
export class SendTso {
    /**
     * API method to send data to already started TSO address space, but will read TSO data until a PROMPT is reached.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} servletKey - servlet key returned from a successful start
     * @param {string} data - data to send to the TSO address space.
     * @returns {Promise<ISendResponse>} SendTso response object, @see {ISendResponse}
     * @memberof SendTso
     */
    public static async sendDataToTSOCollect(session: AbstractSession, servletKey: string, data: string) {
        const putResponse = await SendTso.sendDataToTSOCommon(session, {servletKey, data});
        TsoValidator.validateErrorMessageFromZosmf(putResponse);
        const responses = await SendTso.getAllResponses(session, putResponse);
        return SendTso.createResponse(responses.tsos, responses.messages);
    }

    /**
     * API method to send data to already started TSO address space
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IStartTsoParms} commandParams - object with required parameters, @see {ISendTsoParms}
     * @returns {Promise<IZosmfTsoResponse>} - z/OSMF response object, @see {IZosmfTsoResponse}
     * @memberof SendTso
     */
    public static async sendDataToTSOCommon(session: AbstractSession, commandParams: ISendTsoParms) {

        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(commandParams.servletKey, noServletKeyInput.message);
        TsoValidator.validateNotEmptyString(commandParams.data, noDataInput.message);

        const parameters: string = "/" + TsoConstants.RES_START_TSO + "/" + commandParams.servletKey + TsoConstants.RES_DONT_READ_REPLY;
        const jobObj: any = {"TSO RESPONSE": {VERSION: "0100", DATA: commandParams.data}};
        return ZosmfRestClient.putExpectJSON<IZosmfTsoResponse>
        (session, TsoConstants.RESOURCE + parameters, [ZosmfHeaders.X_CSRF_ZOSMF_HEADER, Headers.APPLICATION_JSON], jobObj);

    }

    /**
     * API method is used to get response data from a TSO address space.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {String} servletKey - servlet key of address space
     * @returns {Promise<IZosmfTsoResponse>} - z/OSMF response object, @see {IZosmfTsoResponse}
     * @memberof SendTso
     */
    public static async getDataFromTSO(session: AbstractSession, servletKey: string) {
        TsoValidator.validateSession(session);

        const parameters: string = "/" + TsoConstants.RES_START_TSO + "/" + servletKey;
        return ZosmfRestClient.getExpectJSON<IZosmfTsoResponse>(session, TsoConstants.RESOURCE + parameters,
            [ZosmfHeaders.X_CSRF_ZOSMF_HEADER, Headers.APPLICATION_JSON]);
    }

    /**
     * Collects responses from address space until it reaches prompt
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IZosmfTsoResponse} tso - object from first API call from witch responses are needed
     * @returns {Promise<ICollectedResponses>} - CollectedResponses response object, @see {ICollectedResponses}
     * @memberof SendTso
     */
    public static async getAllResponses(session: AbstractSession, tso: IZosmfTsoResponse): Promise<ICollectedResponses> {
        let done = false;
        const tsos: IZosmfTsoResponse[] = [];
        tsos.push(tso);
        let messages: string = "";
        while (!done) {
            if (!isNullOrUndefined(tso.tsoData)) {
                tso.tsoData.forEach((data) => {
                    if (data[TsoConstants.TSO_MESSAGE]) {
                        messages += (data[TsoConstants.TSO_MESSAGE].DATA + "\n");
                    } else if (data[TsoConstants.TSO_PROMPT]) {
                        // handle case where we get a PROMPT but no data has been accumulated yet
                        if (messages !== "") {
                            done = true;
                        } else {
                            // TSO PROMPT reached without getting any data, retrying
                        }
                    }
                });
            }
            if (!done) {
                tso = await SendTso.getDataFromTSO(session, tso.servletKey);
                TsoValidator.validateErrorMessageFromZosmf(tso);
            }
        }
        return {
            tsos,
            messages
        };
    }

    /**
     * Creates ISendResponse object and fills with data
     * @param {IZosmfTsoResponse[]} allResponses - array of all collected responses
     * @param {string} messages - concatenated messages from responses
     * @returns {ISendResponse} - SendTso response object, @see {ISendResponse}
     * @memberof SendTso
     */
    private static createResponse(allResponses: IZosmfTsoResponse[], messages: string): ISendResponse {
        return {
            success: true,
            zosmfResponse: allResponses,
            commandResponse: messages
        };

    }
}
