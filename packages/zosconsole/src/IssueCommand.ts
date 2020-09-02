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

import { ZosmfRestClient } from "@zowe/rest-for-zowe-sdk"";
import { isNullOrUndefined } from "util";
import { IZosmfIssueParms } from "./doc/zosmf/IZosmfIssueParms";
import { ConsoleValidator } from "./ConsoleValidator";
import { IZosmfIssueResponse } from "./doc/zosmf/IZosmfIssueResponse";
import { ConsoleConstants } from "./ConsoleConstants";
import { IIssueParms } from "./doc/IIssueParms";
import { ConsoleResponseService } from "./ConsoleResponseService";
import { IConsoleResponse } from "./doc/IConsoleResponse";
import { ICollectParms } from "./doc/ICollectParms";
import { CollectCommand } from "./CollectCommand";

/**
 * Issue MVS Console commands by using a system console
 * @export
 * @class IssueCommand
 */
export class IssueCommand {
    /**
     * Issue an MVS console command, returns "raw" z/OSMF response
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {string} consoleName name of the EMCS console that is used to issue the command
     * @param {IZosmfIssueParms} commandParms synchronous console issue parameters, @see {IZosmfIssueParms}
     * @return {Promise<IZosmfIssueResponse>} command response on resolve, @see {IZosmfIssueResponse}
     * @memberof IssueCommand
     */
    public static issueCommon(session: AbstractSession, consoleName: string, commandParms: IZosmfIssueParms) {
        ConsoleValidator.validateCommonParms(session, consoleName, commandParms);

        return ZosmfRestClient.putExpectJSON<IZosmfIssueResponse>(session, IssueCommand.getResource(consoleName),
            [Headers.APPLICATION_JSON], commandParms);
    }

    /**
     * Issue an MVS console command in default console, returns "raw" z/OSMF response
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {IZosmfIssueParms} commandParms synchronous console issue parameters, @see {IZosmfIssueParms}
     * @return {Promise<IZosmfIssueResponse>} command response on resolve, @see {IZosmfIssueResponse}
     * @memberof IssueCommand
     */
    public static issueDefConsoleCommon(session: AbstractSession, commandParms: IZosmfIssueParms) {
        return IssueCommand.issueCommon(session, ConsoleConstants.RES_DEF_CN, commandParms);
    }

    /**
     * Issue an MVS console command command synchronously - meaning solicited (direct command responses) are gathered
     * immediately after the command is issued. However, after (according to the z/OSMF REST API documentation)
     * approximately 3 seconds the response will be returned.
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {IIssueParms} parms console issue parameters, @see {IIssueParms}
     * @return {Promise<IConsoleResponse>} command response on resolve, @see {IConsoleResponse}
     * @memberof IssueCommand
     */
    public static async issue(session: AbstractSession, parms: IIssueParms) {
        ConsoleValidator.validateIssueParms(session, parms);

        const consoleName: string = isNullOrUndefined(parms.consoleName) ? ConsoleConstants.RES_DEF_CN : parms.consoleName;
        const commandParms: IZosmfIssueParms = IssueCommand.buildZosmfConsoleApiParameters(parms);
        let response: IConsoleResponse = ConsoleResponseService.getEmptyConsoleResponse();

        const resp: IZosmfIssueResponse = await IssueCommand.issueCommon(session, consoleName, commandParms);
        response = ConsoleResponseService.populate(resp, response, parms.processResponses);

        return response;
    }

    /**
     * Simple issue console command method. Does not accept parameters, so all defaults on the z/OSMF API are taken.
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {string} theCommand command to issue
     * @return {Promise<IConsoleResponse>} command response on resolve, @see {IConsoleResponse}
     * @memberof IssueCommand
     */
    public static async issueSimple(session: AbstractSession, theCommand: string) {
        ConsoleValidator.validateIssueSimpleParms(session, theCommand);

        const parms: IIssueParms = {
            command: theCommand,
            processResponses: true
        };
        return IssueCommand.issue(session, parms);
    }

    /**
     * Issue an MVS console command command synchronously - meaning solicited (direct command responses) are gathered
     * immediately after the command is issued. However, after (according to the z/OSMF REST API documentation)
     * approximately 3 seconds the response will be returned.
     *
     * To control additional collection and other behaviors, populate the ICollectParms object according
     * to your needs (see ICollectParms for details).
     * @static
     * @param {AbstractSession} session representing connection to this api
     * @param {IIssueParms} issueParms console issue parameters, @see {IIssueParms}
     * @param {ICollectParms} collectParms console collect parameters, @see {ICollectParms}
     * @return {Promise<IConsoleResponse>} command response on resolve, @see {IConsoleResponse}
     * @memberof IssueCommand
     */
    public static async issueAndCollect(session: AbstractSession, issueParms: IIssueParms,
                                        collectParms: ICollectParms) {
        ConsoleValidator.validateCollectParm(collectParms);
        let response: IConsoleResponse = await IssueCommand.issue(session, issueParms);

        if (response.lastResponseKey && !response.keywordDetected) {
            collectParms.commandResponseKey = response.lastResponseKey;
            response = await CollectCommand.collect(session, collectParms, response);
        }
        return response;
    }

    /**
     * Get resource path for issue command
     * @static
     * @param {string} consoleName name of the EMCS console that is used to issue the command
     * @return {string} resource path
     * @memberof IssueCommand
     */
    public static getResource(consoleName: string): string {
        return ConsoleConstants.RESOURCE + "/" + consoleName;
    }

    /**
     * Build IZosmfIssueParms object from provided parameters
     * @static
     * @param {IIssueParms} parms parameters for issue command
     * @return {IZosmfIssueParms} request body, @see {ZosmfConsoleApiParameters}
     * @memberof IssueCommand
     */
    public static buildZosmfConsoleApiParameters(parms: IIssueParms): IZosmfIssueParms {
        ConsoleValidator.validateIssueParm(parms);

        const zosmfParms: IZosmfIssueParms = {cmd: parms.command};
        if (!isNullOrUndefined(parms.solicitedKeyword)) {
            zosmfParms["sol-key"] = parms.solicitedKeyword;
        }
        if (!isNullOrUndefined(parms.sysplexSystem)) {
            zosmfParms.system = parms.sysplexSystem;
        }
        if (!isNullOrUndefined(parms.async)) {
            zosmfParms.async = parms.async;
        }
        return zosmfParms;
    }
}
