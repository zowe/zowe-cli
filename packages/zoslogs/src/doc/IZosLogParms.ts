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
 * The z/OSMF log API parameters. See the z/OSMF REST API documentation for full details.
 * @export
 * @interface IZosLogParms
 */
export interface IZosLogParms {
    /**
     * The z/OS log api time param.
     * @type {any]
     * @memberof ILogParms
     */
    startTime?: any;

    /**
     * The direction param.
     * @type {string}
     * @memberof ILogParms
     */
    direction?: "forward" | "backward";

    /**
     * The timeRange param.
     * @type {string}
     * @memberof ILogParms
     */
    range?: string;

    /**
     * The z/OSMF Console API returns '\r' or '\r\n' where line-breaks. Can attempt to replace these
     * sequences with '\n', but there may be cases where that is not preferable. Specify false to prevent processing.
     * @type {string}
     * @memberof IConsoleParms
     */
    processResponses?: boolean;
}
