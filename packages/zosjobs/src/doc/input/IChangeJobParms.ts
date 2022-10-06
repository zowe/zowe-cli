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
 * Interface for change job z/OSMF API
 * @export
 * @interface IChangeJobParms
 */
export interface IChangeJobParms {
<<<<<<< HEAD
    /**
     * job name for the job you want to change
     * @type {string}
     * @memberof IChangeJobParms
     */
     jobname: string;
=======
>>>>>>> 5c7dbbb2ee5046b01f42f189dd12a29bad491dfe

    /**
     * job id for the job you want to change
     * @type {string}
     * @memberof IChangeJobParms
     */
    jobid: string;

    /**
     * job name for the job you want to change
     * @type {string}
     * @memberof IChangeJobParms
     */
    jobclass: string;
}
