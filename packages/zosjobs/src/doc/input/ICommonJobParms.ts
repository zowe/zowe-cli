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
 * Interface for various job APIs
 * @export
 * @interface ICommonJobParms
 */
export interface ICommonJobParms {

    /**
     * job id for a job
     * @type {string}
     * @memberof ICommonJobParms
     */
    jobid: string;

    /**
     * job name for a job
     * @type {string}
     * @memberof ICommonJobParms
     */
    jobname: string;
}
