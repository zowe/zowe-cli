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

import { AbstractSession, Headers } from "npm:@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IStopTsoParms } from "./doc/input/IStopTsoParms";
import { noServletKeyInput, TsoConstants } from "./TsoConstants";
import { TsoValidator } from "./TsoValidator";
import { IZosmfTsoResponse } from "./doc/zosmf/IZosmfTsoResponse";
import { TsoResponseService } from "./TsoResponseService";
import { IStartStopResponse } from "./doc/IStartStopResponse";


/**
 * Stop active TSO address space using servlet key
 * @export
 * @class StopTso
 */
export class StopTso {

    /**
     * Sends REST call to z/OSMF for stoping active TSO address space
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {IStopTsoParms} commandParms - object with required parameters, @see {IStopTsoParms}
     * @returns {Promise<IZosmfTsoResponse>} z/OSMF response object, @see {IZosmfTsoResponse}
     * @memberof StopTso
     */
    public static async stopCommon(session: AbstractSession, commandParms: IStopTsoParms) {
        TsoValidator.validateSession(session);
        TsoValidator.validateStopParams(commandParms);
        TsoValidator.validateNotEmptyString(commandParms.servletKey, noServletKeyInput.message);

        const resources = this.getResources(commandParms.servletKey);

        return ZosmfRestClient.deleteExpectJSON<IZosmfTsoResponse>(session, resources,
            [Headers.APPLICATION_JSON]);
    }

    /**
     * Stop TSO address space and populates response with IStartStopResponse, @see {IStartStopResponse}
     * @param {AbstractSession} session
     * @param {string} servKey - unique servlet entry identifier
     * @returns {Promise<IStartStopResponse>} populated response, @see {IStartStopResponse}
     * @memberof StopTso
     */
    public static async stop(session: AbstractSession, servKey: string): Promise<IStartStopResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(servKey, noServletKeyInput.message);
        const commandParms: IStopTsoParms = {servletKey: servKey};

        const zosmfResponse: IZosmfTsoResponse = await this.stopCommon(session, commandParms);
        TsoValidator.validateErrorMessageFromZosmf(zosmfResponse);
        return TsoResponseService.populateStartAndStop(zosmfResponse);
    }

    /**
     * Generates query parameter needed for z/OSMF REST call
     * @param {string} servletKey - unique servlet entry identifier
     * @returns {string} generated resources query
     * @memberof StopTso
     */
    public static getResources(servletKey: string): string {
        TsoValidator.validateNotEmptyString(servletKey, noServletKeyInput.message);
        return `${TsoConstants.RESOURCE}/${TsoConstants.RES_START_TSO}/${servletKey}`;
    }
}
