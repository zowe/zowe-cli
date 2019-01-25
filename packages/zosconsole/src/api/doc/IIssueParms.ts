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

import { IConsoleParms } from "./IConsoleParms";

/**
 * Interface for Issue command parameters
 * @export
 * @interface IIssueParms
 */
export interface IIssueParms extends IConsoleParms {
    /**
     * The Command to issue.
     * @type {string}
     * @memberof IIssueParms
     */
    command: string;

    /**
     * The system (withing the z/OSMF sysplex) to route the command.
     * @type {string}
     * @memberof IIssueParms
     */
    sysplexSystem?: string;

    /**
     * The solicited keyword to check for in the response. Causes the API to return immediately when the keyword
     * is found, however, it may include solicited command response messages beyond the keyword itself.
     * @type {string}
     * @memberof IIssueParms
     */
    solicitedKeyword?: string;

    /**
     * Indicates the method of issuing the command is synchronous or asynchronous.
     * Default value is "N" - Synchronous request.
     * @type {string}
     * @memberof IIssueParms
     */
    async?: string;
}
