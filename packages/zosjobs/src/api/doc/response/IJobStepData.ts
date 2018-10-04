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
 * Step info on a job interface
 * @export
 * @interface IJobStepData
 */
export interface IJobStepData {

    /**
     * smfid
     * @type {string}
     * @memberof IJobStepData
     */
    smfid: string;

    /**
     * ACtive
     * @type {string}
     * @memberof IJobStepData
     */
    active: string;

    /**
     * Job relevant step
     * @type {number}
     * @memberof IJobStepData
     */
    "step-number": number;

    /**
     * Job relevant proc
     * @type {string}
     * @memberof IJobStepData
     */
    "proc-step-name": string;

    /**
     * Step for which job dd exists
     * @type {string}
     * @memberof IJobFileSimple
     */
    "step-name": string;

    /**
     * Program EXEC=
     * @type {string}
     * @memberof IJobStepData
     */
    "program-name": string;
}
