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

import { ImperativeError, TextUtils } from "@zowe/imperative";
import { ZosJobsMessages } from "./JobsMessages";

/**
 * Utility functions for z/OS jobs
 * @export
 * @class JobsUtils
 */
export class JobsUtils {
    /**
     * Characters allowed in a job name: letters, numbers, and the national characters @, #, and $
     */
    private static readonly JOB_NAME_REGEX = /^[A-Za-z0-9@#$]+$/;

    /**
     * Characters allowed in a job ID: letters and numbers
     */
    private static readonly JOB_ID_REGEX = /^[A-Za-z0-9]+$/;

    /**
     * Characters allowed in a spool file ID: digits
     */
    private static readonly SPOOL_ID_REGEX = /^\d+$/;

    /**
     * Validate a job name and job ID before they are placed in the path of a z/OSMF REST request.
     * Only the character set is checked, so that values such as "/" or ".." cannot change which
     * resource the request is sent to. Length and format rules are left to z/OSMF.
     * @static
     * @param {string} jobname - the job name to validate
     * @param {string} jobid - the job ID to validate
     * @throws {ImperativeError} when the job name or job ID contains characters that are not allowed
     * @memberof JobsUtils
     */
    public static validateJobNameAndId(jobname: string, jobid: string): void {
        if (typeof jobname !== "string" || !JobsUtils.JOB_NAME_REGEX.test(jobname)) {
            throw new ImperativeError({
                msg: TextUtils.formatMessage(ZosJobsMessages.invalidJobName.message, { jobname })
            });
        }
        if (typeof jobid !== "string" || !JobsUtils.JOB_ID_REGEX.test(jobid)) {
            throw new ImperativeError({
                msg: TextUtils.formatMessage(ZosJobsMessages.invalidJobId.message, { jobid })
            });
        }
    }

    /**
     * Validate a spool file ID before it is placed in the path of a z/OSMF REST request.
     * @static
     * @param {number} spoolId - the spool file ID to validate
     * @throws {ImperativeError} when the spool file ID is not a non-negative integer
     * @memberof JobsUtils
     */
    public static validateSpoolId(spoolId: number): void {
        if (spoolId == null || !JobsUtils.SPOOL_ID_REGEX.test(String(spoolId))) {
            throw new ImperativeError({
                msg: TextUtils.formatMessage(ZosJobsMessages.invalidSpoolId.message, { spoolId })
            });
        }
    }
}
