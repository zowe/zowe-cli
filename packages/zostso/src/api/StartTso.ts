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

import { AbstractSession, Headers } from "@brightside/imperative";

import { isNullOrUndefined } from "util";
import { ZosmfHeaders, ZosmfRestClient } from "../../../rest";
import { SendTso } from "./SendTso";
import { IStartStopResponses } from "./doc/IStartStopResponses";
import { IStartTsoParms } from "./doc/input/IStartTsoParms";
import { IZosmfTsoResponse } from "./doc/zosmf/IZosmfTsoResponse";
import { TsoValidator } from "./TsoValidator";
import { noAccountNumber, TsoConstants } from "./TsoConstants";
import { TsoResponseService } from "./TsoResponseService";

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
     * @memberOf StartTso
     */
    public static startCommon(session: AbstractSession, commandParms: IStartTsoParms) {
        TsoValidator.validateSession(session);
        TsoValidator.validateStartParams(commandParms);
        const startResources = this.getResourcesQuery(commandParms);

        return ZosmfRestClient.postExpectJSON<IZosmfTsoResponse>(session, startResources,
            [ZosmfHeaders.X_CSRF_ZOSMF_HEADER, Headers.APPLICATION_JSON]);
    }
    /**
     * Start TSO address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} parms - optional object with required parameters, @see {IStartTsoParms}
     * @returns {Promise<IStartStopResponses>} command response on resolve, @see {IStartStopResponses}
     * @memberOf StartTso
     */
    public static async start(session: AbstractSession, accountNumber: string, parms?: IStartTsoParms): Promise<IStartStopResponses> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(accountNumber, noAccountNumber.message);
        let customParms: IStartTsoParms;
        if (isNullOrUndefined(parms)) {
            customParms = this.setDefaultAddressSpaceParams({}, accountNumber);
        } else {
            customParms = this.setDefaultAddressSpaceParams(parms, accountNumber);
        }

        const zosmfResponse = await this.startCommon(session, customParms);
        let collectedResponses = null;
        if (!isNullOrUndefined(zosmfResponse.servletKey)){
            collectedResponses = await SendTso.getAllResponses(session, zosmfResponse);
        }
        return TsoResponseService.populateStartAndStopCollectAll(zosmfResponse, collectedResponses);
    }

    /**
     * Sets required parameters by default if not provided. If some parameters provided
     * it uses received and the rest required parameters will be default
     * @static
     * @param {IStartTsoParms} parms - object with required parameters, @see {IStartTsoParms}
     * @param {string} accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @returns {IStartTsoParms} object with provided parameters if not the with default
     * @memberOf StartTso
     */
    public static setDefaultAddressSpaceParams(parms: IStartTsoParms, accountNumber: string): IStartTsoParms {
        const proc = isNullOrUndefined(parms.logonProcedure) ? TsoConstants.DEFAULT_PROC : parms.logonProcedure;
        const chset = isNullOrUndefined(parms.characterSet) ? TsoConstants.DEFAULT_CHSET : parms.characterSet;
        const cpage = isNullOrUndefined(parms.codePage) ? TsoConstants.DEFAULT_CPAGE : parms.codePage;
        const rowNum = isNullOrUndefined(parms.rows) ? TsoConstants.DEFAULT_ROWS : parms.rows;
        const cols = isNullOrUndefined(parms.columns) ? TsoConstants.DEFAULT_COLS : parms.columns;
        const rSize = isNullOrUndefined(parms.regionSize) ? TsoConstants.DEFAULT_RSIZE : parms.regionSize;

        const parameters: IStartTsoParms = {
            logonProcedure: proc,
            characterSet: chset,
            codePage: cpage,
            rows: rowNum,
            columns: cols,
            regionSize: rSize,
            account: accountNumber
        };
        return parameters;
    }

    /**
     * Builds a resources query from passed parameters which is needed for z/OSMF api URI.
     * @param {IStartTsoParms} parms - object with required parameters, @see {IStartTsoParms}
     * @returns {string} URI for z/OSMF REST call
     * @memberOf StartTso
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

