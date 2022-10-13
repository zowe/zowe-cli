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

import { HOLD_STATUS } from "../../types/HoldStatus";

/**
 * Interface for change job z/OSMF API
 * @export
 * @interface IModifyJobParms
 */
export interface IModifyJobParms {
    /**
     * job name for the job you want to change
     * @type {string}
     * @memberof IModifyJobParms
     */
    jobname: string;

    /**
     * job id for the job you want to change
     * @type {string}
     * @memberof IModifyJobParms
     */
    jobid: string;

    /**
     * job name for the job you want to change
     * @type {string}
     * @memberof IModifyJobParms
     */
    jobclass: string;

    /**
     * job name for the job you want to change
     * @type {HOLD_STATUS}
     * @memberof IModifyJobParms
     */
    holdStatus: HOLD_STATUS;
}
