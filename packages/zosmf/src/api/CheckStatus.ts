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

import { AbstractSession, ImperativeExpect, Logger } from "@zowe/imperative";
import { posix } from "path";
import { ZosmfConstants } from "./constants/Zosmf.constants";
import { ZosmfMessages } from "./constants/Zosmf.messages";
import { ZosmfRestClient } from "../../../rest/";
import { IZosmfInfoResponse } from "./doc/IZosmfInfoResponse";

/**
 * This class holds the helper functions that are used to gather zosmf information throgh the
 * z/OSMF APIs.
 */
export class CheckStatus {
    /**
     * Get z/OSMF information
     * @param {AbstractSession} session z/OSMF connection info.
     * @returns {promise<IZosmfInfoResponse>} A response contains information from API call.
     * @throws {ImperativeError} session must not be null or undefined. Any error threw by
     *                           the REST API call.
     */
    public static async getZosmfInfo(session: AbstractSession): Promise<IZosmfInfoResponse> {
        this.log.trace("getZosmfInfo called");
        const infoEndpoint = posix.join(ZosmfConstants.RESOURCE, ZosmfConstants.INFO);
        this.log.debug(`Endpoint: ${infoEndpoint}`);
        ImperativeExpect.toNotBeNullOrUndefined(session, ZosmfMessages.missingSession.message);
        return ZosmfRestClient.getExpectJSON(session, infoEndpoint);
    }

    /**
     * Get Log
     * @returns {Logger} applicationLogger.
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }
}
