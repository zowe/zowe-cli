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

/**
 * z/OSMF synchronous console command response messages. See the z/OSMF REST API publication for complete details.
 * @export
 * @interface IZosmfIssueResponse
 */
export interface IZosmfIssueResponse {
    /**
     * Follow-up response URL.
     * @type {string}
     * @memberof IZosmfIssueResponse
     */
    "cmd-response-url"?: string;

    /**
     * Command response text.
     * @type {string}
     * @memberof IZosmfIssueResponse
     */
    "cmd-response": string;

    /**
     * The follow-up response URI.
     * @type {string}
     * @memberof IZosmfIssueResponse
     */
    "cmd-response-uri"?: string;

    /**
     * The command response key used for follow-up requests.
     * @type {string}
     * @memberof IZosmfIssueResponse
     */
    "cmd-response-key"?: string;

    /**
     * True if the solicited keyword requested is present.
     * @type {string}
     * @memberof IZosmfIssueResponse
     */
    "sol-key-detected"?: boolean;
}
