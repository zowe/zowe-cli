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

import { isNullOrUndefined } from "util";
import { ImperativeError } from "@zowe/imperative";
import { IZosmfTsoResponse } from "./doc/zosmf/IZosmfTsoResponse";
import { IStartStopResponse } from "./doc/IStartStopResponse";
import { TsoValidator } from "./TsoValidator";
import { IStartStopResponses } from "./doc/IStartStopResponses";
import { ICollectedResponses } from "./doc/ICollectedResponses";
import { IZosmfPingResponse } from "./doc/zosmf/IZosmfPingResponse";
import { IPingResponse } from "./doc/IPingResponse";

/**
 * Filter responses from z/OSMF
 * @export
 * @class TsoResponseService
 */
export class TsoResponseService {
    /**
     * Populates start and stop commands response with z/OSMF response details
     * @param {IZosmfTsoResponse} zosmfResponse -  z/OSMF response object, @see {IZosmfTsoResponse}
     * @returns {IStartStopResponse} populated object with type of IStartStopResponse, @see {IStartStopResponse}
     * @memberOf TsoResponseService
     */
    public static populateStartAndStop(zosmfResponse: IZosmfTsoResponse): IStartStopResponse {
        TsoValidator.validateStartZosmfResponse(zosmfResponse);
        const startResponse: IStartStopResponse = {
            success: false,
            zosmfTsoResponse: zosmfResponse,
            servletKey: zosmfResponse.servletKey
        };

        if (zosmfResponse.servletKey != null) {
            startResponse.success = true;
        } else if (zosmfResponse.msgData) {
            startResponse.failureResponse = new ImperativeError({
                msg: zosmfResponse.msgData[0].messageText
            });
        }
        return startResponse;
    }
    /**
     * Populates start and stop commands response with z/OSMF response details
     * @param {IZosmfTsoResponse} zosmfResponse -  z/OSMF response object, @see {IZosmfTsoResponse}
     * @param {ICollectedResponses} collectedResponses -  collected z/OSMF responses object, @see {ICollectedResponses}
     * @returns {IStartStopResponse} populated object with type of IStartStopResponse, @see {IStartStopResponse}
     * @memberOf TsoResponseService
     */
    public static populateStartAndStopCollectAll(zosmfResponse: IZosmfTsoResponse, collectedResponses?: ICollectedResponses): IStartStopResponses {
        TsoValidator.validateStartZosmfResponse(zosmfResponse);
        const startResponse: IStartStopResponses = {
            success: false,
            zosmfTsoResponse: zosmfResponse,
            collectedResponses: (collectedResponses == null) ? null : collectedResponses.tsos,
            servletKey: zosmfResponse.servletKey,
            messages: (collectedResponses == null) ? "" : collectedResponses.messages
        };

        if (zosmfResponse.servletKey != null) {
            startResponse.success = true;
        } else if (zosmfResponse.msgData) {
            startResponse.failureResponse = new ImperativeError({
                msg: zosmfResponse.msgData[0].messageText
            });
        }
        return startResponse;
    }

    /**
     * Populates ping command response with z/OSMF response details
     * @param {IZosmfPingResponse} zosmfResponse -  z/OSMF response object, @see {IZosmfPingResponse}
     * @returns {PingResponse} populated object with type of IPingResponse
     * @memberOf TsoResponseService
     */
    public static populatePing(zosmfResponse: IZosmfPingResponse): IPingResponse {
        TsoValidator.validatePingZosmfResponse(zosmfResponse);
        const PingResponse: IPingResponse = {
            success: false,
            zosmfPingResponse: null,
            servletKey: null
        };

        if (!isNullOrUndefined(zosmfResponse.servletKey)) {
            PingResponse.success = true;
            PingResponse.zosmfPingResponse = zosmfResponse;
            PingResponse.servletKey = zosmfResponse.servletKey;
        }

        return PingResponse;

    }
}
