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

import { AbstractSession, Headers } from "@zowe/imperative";
import { ZosmfHeaders, ZosmfRestClient } from "../../rest";
import { TsoValidator } from "./TsoValidator";
import { noPingInput, TsoConstants } from "./TsoConstants";
import { IZosmfPingResponse } from "./doc/zosmf/IZosmfPingResponse";
import { TsoResponseService } from "./TsoResponseService";
import { IPingResponse } from "./doc/IPingResponse";


export class PingTso {
    /**
     * Issue a TSO Ping command, returns @param {IPingResponse} result, @see {IPingResponse}
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {string} servletKey servletkey for address space to ping, generated by start command
     * @param {IZosmfPingResponse} res raw ZOS/MF response
     * @return {IPingResponse}, @see {IPingResponse}
     * @memberof PingTso
     */
    public static async ping(session: AbstractSession, servletKey: string) {
        TsoValidator.validatePingParms(session, servletKey, noPingInput.message);
        const res = await ZosmfRestClient.putExpectJSON<IZosmfPingResponse>(session, PingTso.getResource(servletKey),
            [ZosmfHeaders.X_CSRF_ZOSMF_HEADER, Headers.APPLICATION_JSON], null);
        TsoValidator.validateErrorMessageFromZosmf(res);
        const result: IPingResponse = TsoResponseService.populatePing(res);
        return result;
    }

    /**
     * Get resource path for ping command
     * @static
     * @param {string} servletKey servelet key from start API method
     * @return {string} resource path
     * @memberof PingTso
     */
    public static getResource(servletKey: string): string {
        TsoValidator.validateNotEmptyString(servletKey, noPingInput.message);
        return TsoConstants.RES_PING + "/" + servletKey;
    }

}
