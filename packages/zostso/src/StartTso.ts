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
import { ICollectedResponses } from "./doc/ICollectedResponses";

/**
 * Start TSO address space and receive servlet key
 * @export
 * @class StartTso
 */
export class StartTso {

    /**
     * Start TSO address space with provided  parameters
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IStartTsoParms} commandParms - object with required parameters, @see {IStartTsoParms}
     * @returns {Promise<IZosmfTsoResponse>} z/OSMF response object, @see {IZosmfTsoResponse}
     * @memberof StartTso
     */
    public static startCommon(session: AbstractSession, commandParms: IStartTsoParms) {
        TsoValidator.validateSession(session);
        TsoValidator.validateStartParams(commandParms);
        const startResources = this.getResourcesQuery(commandParms);

        return ZosmfRestClient.postExpectJSON<IZosmfTsoResponse>(session, startResources,
            [Headers.APPLICATION_JSON]);
    }
    /**
     * Start TSO address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} parms - optional object with required parameters, @see {IStartTsoParms}
     * @returns {Promise<IStartStopResponses>} command response on resolve, @see {IStartStopResponses}
     * @memberof StartTso
     */
    public static async start(session: AbstractSession, accountNumber: string, parms?: IStartTsoParms): Promise<IStartStopResponses> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(accountNumber, noAccountNumber.message);
        let customParms: IStartTsoParms;
        if (parms == null) {
            customParms = this.setDefaultAddressSpaceParams({}, encodeURIComponent(accountNumber));
        } else {
            customParms = this.setDefaultAddressSpaceParams(parms, encodeURIComponent(accountNumber));
        }

        const zosmfResponse = await this.startCommon(session, customParms);
        const collectedResponses: ICollectedResponses = zosmfResponse.servletKey != null ?
            await SendTso.getAllResponses(session, zosmfResponse) : { tsos: null, messages: "" };
        return TsoResponseService.populateStartAndStopCollectAll(zosmfResponse, collectedResponses);
    }

    /**
     * Sets required parameters by default if not provided. If some parameters provided
     * it uses received and the rest required parameters will be default
     * @static
     * @param {IStartTsoParms} parms - object with required parameters, @see {IStartTsoParms}
     * @param {string} accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @returns {IStartTsoParms} object with provided parameters if not the with default
     * @memberof StartTso
     */
    public static setDefaultAddressSpaceParams(parms: IStartTsoParms, accountNumber: string): IStartTsoParms {
        return {
            logonProcedure: parms.logonProcedure ?? TsoConstants.DEFAULT_PROC,
            characterSet: parms.characterSet ?? TsoConstants.DEFAULT_CHSET,
            codePage: parms.codePage ?? TsoConstants.DEFAULT_CPAGE,
            rows: parms.rows ?? TsoConstants.DEFAULT_ROWS,
            columns: parms.columns ?? TsoConstants.DEFAULT_COLS,
            regionSize: parms.regionSize ?? TsoConstants.DEFAULT_RSIZE,
            account: accountNumber
        };
    }

    /**
     * Builds a resources query from passed parameters which is needed for z/OSMF api URI.
     * @param {IStartTsoParms} parms - object with required parameters, @see {IStartTsoParms}
     * @returns {string} URI for z/OSMF REST call
     * @memberof StartTso
     */
    public static getResourcesQuery(parms: IStartTsoParms): string {
        let query: string = `${TsoConstants.RESOURCE + "/" + TsoConstants.RES_START_TSO}?`;
        query += `${TsoConstants.PARM_ACCT}=${parms.account}&`;
        query += `${TsoConstants.PARM_PROC}=${parms.logonProcedure}&`;
        query += `${TsoConstants.PARM_CHSET}=${parms.characterSet}&`;
        query += `${TsoConstants.PARM_CPAGE}=${parms.codePage}&`;
        query += `${TsoConstants.PARM_ROWS}=${parms.rows}&`;
        query += `${TsoConstants.PARM_COLS}=${parms.columns}&`;
        query += `${TsoConstants.PARM_RSIZE}=${parms.regionSize}`;
        return query;
    }
}

