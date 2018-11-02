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
 * Interface for cancel job z/OSMF API
 * @export
 * @interface ICancelJobParms
 */
export interface ICancelJobParms {

    /**
     * job id for the job you want to cancel
     * @type {string}
     * @memberof ICancelJobParms
     */
    jobid: string;

    /**
     * job name for the job you want to cancel
     * @type {string}
     * @memberof ICancelJobParms
     */
    jobname: string;


    /**
     * version of the cancel request
     * @type {string}
     * @memberof ICancelJobParms
     */
    version?: string;
}
