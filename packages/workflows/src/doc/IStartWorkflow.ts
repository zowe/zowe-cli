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

export type startT = "outputFileValue" | "existingValue" | "leaveConflict";

/**
 * Interface for starting workflow instance.
 * @export
 * @interface IStartWorkflow
 */
export interface IStartWorkflow {
    /**
     * Resolve conflicts by using output file,
     * already existing value or leave the
     * conflict to be handled manually.
     * @type {startT}
     * @memberof IStartWorkflow
     */
    resolveConflictByUsing?: startT;

    /**
     * Step name to be run.
     * @type {string}
     * @memberof IStartWorkflow
     */
    stepName?: string;

    /**
     * Perform subsequent steps.
     * @type {boolean}
     * @memberof IStartWorkflow
     */
    performSubsequent?: boolean;
}
