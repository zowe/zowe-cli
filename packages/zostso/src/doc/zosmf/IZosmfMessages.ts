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
 * The z/OSMF Ping API error message parameters. See the z/OSMF REST API documentation for full details.
 * @export
 * @deprecated Use `IZosmfMessages` instead because it is spelled correctly
 * @interface IZosfmMessages
 */
export type IZosfmMessages = IZosmfMessages;

/**
 * The z/OSMF Ping API error message parameters. See the z/OSMF REST API documentation for full details.
 * @export
 * @interface IZosmfMessages
 */
export interface IZosmfMessages {
    /**
     * Error message text.
     * @type string
     * @memberOf IZosmfMessages
     */
    "messageText": string;

    /**
     * Error message text ID.
     * @type string
     * @memberOf IZosmfMessages
     */
    "messageId": string;

    /**
     * Error message stack trace.
     * @type string
     * @memberOf IZosmfMessages
     */
    "stackTrace": string;
}
