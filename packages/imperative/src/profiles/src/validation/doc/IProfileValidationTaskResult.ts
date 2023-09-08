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
 * A single result in the report from testing a profile against an IProfileValidationCriterion
 * Used to build the final validation report
 */
import { VALIDATION_OUTCOME } from "./IProfileValidationTask";

/**
 * Profile validation results for one particular task
 */
export interface IProfileValidationTaskResult {
    /**
     * Outcome of this task, whether it succeeded, failed, or somewhere in between
     */
    outcome: VALIDATION_OUTCOME;
    /**
     * Name of the task
     * (will be automatically populated by the validation API)
     */
    taskName?: string;
    /**
     * A description of the result of the validation test, whether
     * it succeeded or failed. Example:
     *    Successfully submitted job USER(JOB00001)
     *    or
     *    Failed to submit job due to the following error:
     *    Input was not recognized by the system as a job RC 4 RSN ...
     */
    resultDescription: string;
    /**
     * Same as the endpoints in the profile validation task.
     * (will be automatically populated by the validation API)
     */
    associatedEndpoints?: string[];
}

