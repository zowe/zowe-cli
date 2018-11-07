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
 * The possible job status strings (as specified by the z/OSMF documentation). Used in the Jobs APIs for monitoring
 * jobstatus, etc.
 * @type JOB_STATUS (string)
 */
export type JOB_STATUS = "ACTIVE" | "OUTPUT" | "INPUT";
export const JOB_STATUS = {
    // Active indicates that the job is running/executing.
    ACTIVE: "ACTIVE" as JOB_STATUS,
    // Output indicates that the job has finished/failed (and potentially has spool output).
    OUTPUT: "OUTPUT" as JOB_STATUS,
    // Input indicates that the job is awaiting execution.
    INPUT: "INPUT" as JOB_STATUS,
};

// The "order" indicates the logical order of job progression within the system. Used to determine if the job will
// NEVER enter the status that is requested on the API (e.g. if the status is OUTPUT, the job will never be ACTIVE)
export const JOB_STATUS_ORDER: JOB_STATUS[] = ["INPUT", "ACTIVE", "OUTPUT"];
