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
 * Job error interface
 * @export
 * @interface IJobError
 */
export interface IJobError {

    /**
     * Return code number
     * @type {number}
     * @memberof IJobError
     */
    rc: number;

    /**
     * Reason code number
     * @type {number}
     * @memberof IJobError
     */
    reason: number;

    /**
     * Stack info
     * @type {string}
     * @memberof IJobError
     */
    stack: string;

    /**
     * Category error number
     * @type {number}
     * @memberof IJobError
     */
    category: number;

    /**
     * z/OSMF error message
     * @type {string}
     * @memberof IJobError
     */
    message: string;
}
