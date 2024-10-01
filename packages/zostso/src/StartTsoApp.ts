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
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { SendTso } from "./SendTso";
import { IStartStopResponses } from "./doc/IStartStopResponses";
import { IStartTsoParms } from "./doc/input/IStartTsoParms";
import { IZosmfTsoResponse } from "./doc/zosmf/IZosmfTsoResponse";
import { TsoValidator } from "./TsoValidator";
import { noAccountNumber, TsoConstants } from "./TsoConstants";
import { TsoResponseService } from "./TsoResponseService";
import { IStartASAppResponse } from "./doc/IStartASAppResponse";
import { IStartTsoAppParms } from "./doc/input/IStartTsoAppParms";
/**
 * Start TSO address space and receive servlet key
 * @export
 * @class StartTsoApp
 */
export class StartTsoApp {
    /**
     * Start TSO application at address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} parms - optional object with required parameters, @see {IStartTsoParms}
     * @returns {Promise<IStartASAppResponse>} command response on resolve, @see {IStartASAppResponse}
     * @memberof StartTso
     */
    public static async start(session: AbstractSession, accountNumber: string, params: IStartTsoAppParms, parms?: IStartTsoParms): Promise<IStartASAppResponse> {
        // Address space is not known
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(accountNumber, noAccountNumber.message);
        if(!params.queueID || !params.servletKey)
        {
            console.log("NEEDS IMPLEMENTATION");
            return undefined;
        }
        // Address space is known
        else
        {
            const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
            const apiResponse = await ZosmfRestClient.postExpectJSON<IStartASAppResponse>(
                session,
                endpoint,
                [Headers.APPLICATION_JSON],
                {
                    "startcmd": `${params.startupCommand} '&1 &2 ${params.queueID}'`
                }
            );
            return apiResponse;
        }
    }
}

