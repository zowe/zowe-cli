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
 * Condensed job response interface
 * Simplified version of an IJob that can be used to
 * display job details to a user without providing too much detail.l
 * @export
 * @interface IJobFileSimple
 */
export interface IJobFileSimple {

    /**
     * ID of job that was submitted
     * @type {number}
     * @memberof IJobFileSimple
     */
    id: number;

    /**
     * DD name of job spool file
     * @type {string}
     * @memberof IJobFileSimple
     */
    ddname: string;

    /**
     * Step for which job dd exists
     * @type {string}
     * @memberof IJobFileSimple
     */
    stepname: string;

    /**
     * Total records contained within the job dd
     * @type {number}
     * @memberof IJobFileSimple
     */
    "record-count": number;
}
