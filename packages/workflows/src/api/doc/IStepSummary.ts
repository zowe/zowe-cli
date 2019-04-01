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

import { IStepInfo } from "./IStepInfo";

/**
 * Interface for the step summary
 *
 * @export
 * @interface IStepSummary
 */
export interface IStepSummary extends IStepInfo {
    /**
     * ID of the step
     *
     * @type {string}
     * @memberof IStepSummary
     */
    stepNumber: string;
    /**
     * Step name
     *
     * @type {string}
     * @memberof IStepSummary
     */
    name: string;
    /**
     * State of the step
     *
     * @type {string}
     * @memberof IStepSummary
     */
    state: string;
    /**
     * Depends on the type of the step.
     * It can contain JOBID, REST response, etc
     *
     * @type {string}
     * @memberof IStepSummary
     */
    misc?: string;
}
