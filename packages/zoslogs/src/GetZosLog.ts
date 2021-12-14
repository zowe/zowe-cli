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
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { IZosLogType } from "./doc/IZosLogType";
import { IZosLogParms } from "./doc/IZosLogParms";
import { GetZosLogValidator } from "./GetZosLogValidator";
import { ZosLogConstants } from "./ZosLogConstants";
import { isNullOrUndefined } from "util";


/**
 * Get zos log via z/OSMF restful api
 * @export
 * @class GetZosLog
 */
export class GetZosLog {
    /**
     * Issue an z/OSMF log command, returns "raw" z/OSMF response
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {IZosLogParms} commandParms log api parameters, @see {IZosLogParms}
     * @return {Promise<IZosLogType>} command response , @see {IZosLogType}
     * @memberof GetLog
     */
    public static async getZosLog(session: AbstractSession, commandParms: IZosLogParms) {
        GetZosLogValidator.validateSession(session);

        let resp: IZosLogType = await ZosmfRestClient.getExpectJSON<IZosLogType>(session,
            GetZosLog.getResourcePath(commandParms), [ZosmfHeaders.X_CSRF_ZOSMF_HEADER]);
        if (isNullOrUndefined(commandParms.processResponses) || commandParms.processResponses !== false) {
            // the IBM responses sometimes have \r and sometimes \r\n, we will process them our here and hopefully
            // return them with just \n.
            resp = JSON.parse(JSON.stringify(resp).replace(/\\r\\n/g, "\\n").replace(/\\r/g, "\\n"));
        }
        return resp;
    }

    /**
     * Get resource path for z/OSMF log restful api
     * @static
     * @param {IZosLogParms} commandParms params to compose the resource path
     * @return {string} resource path
     * @memberof GetCommand
     */
    public static getResourcePath(commandParms: IZosLogParms): string {
        let path = ZosLogConstants.RESOURCE;
        if (commandParms.startTime !== undefined) {
            let startTime = commandParms.startTime;
            // in case the input is milliseconds format, which is a long number
            if (!isNaN(commandParms.startTime)) {
                startTime = new Date(+startTime).toISOString();
            }
            path += "time=" + startTime + "&";
        }

        if (commandParms.direction !== undefined) {
            path += "direction=" + commandParms.direction + "&";
        }
        if (commandParms.range !== undefined) {
            path += "timeRange=" + commandParms.range + "&";
        }

        return path;
    }
}
