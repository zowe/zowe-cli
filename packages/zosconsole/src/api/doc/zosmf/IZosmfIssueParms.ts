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

/**
 * The z/OSMF console API parameters. See the z/OSMF REST API documentation for full details.
 * @export
 * @interface IZosmfIssueParms
 */
export interface IZosmfIssueParms {
    /**
     * The z/OS console command to issue.
     * @type {string]
     * @memberof IZosmfIssueParms
     */
    cmd: string;

    /**
     * The solicited keyword to look for
     * @type {string}
     * @memberof IZosmfIssueParms
     */
    solKey?: string;

    /**
     * The system in the sysplex to route the command.
     * @type {string}
     * @memberof IZosmfIssueParms
     */
    system?: string;

    /**
     * The method of issuing the command.
     * @type {string}
     * @memberof IZosmfIssueParms
     */
    async?: string;
}
