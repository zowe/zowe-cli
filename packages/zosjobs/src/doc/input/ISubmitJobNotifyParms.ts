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

import { JOB_STATUS } from "../../types/JobStatus";

/**
 * Interface for submit job API
 * @export
 * @interface ISubmitJobNotifyParm
 */
export interface ISubmitJobNotifyParm {

    /**
     * z/OS data set which should contain syntactically correct JCL
     * Example value: IBMUSER.PUBLIC.CNTL(IEFBR14)
     * where IEFBR14 contains statements like:
     *   //IEFBR14 JOB ()
     *   //RUN     EXEC PGM=IEFBR14
     * @type {string}
     * @memberof ISubmitJobNotifyParm
     */
    jobDataSet: string;

    /**
     * Watch delay (polling delay) that the underlying services will use
     * to report whenever a job is complete in milliseconds.
     * Default: MonitorJobs.DEFAULT_WATCHER_DELAY
     * @type {number}
     * @memberof ISubmitJclNotifyParm
     */
    watchDelay?: number;

    /**
     * Status for which you'd like to be notified of a completed job.
     * Default: MonitorJobs.DEFAULT_STATUS.
     * @type {JOB_STATUS}
     * @memberof ISubmitJclNotifyParm
     */
    status?: JOB_STATUS;

    /**
     * Number of attempts for which will poll before ending.
     * Default: MonitorJobs.DEFAULT_ATTEMPTS.
     * @type {number}
     * @memberof ISubmitJclNotifyParm
     */
    attempts?: number;

    /**
     * A string for JCL symbolic substitution
     * @type {string}
     * @memberof ISubmitJobParms
     */
    jclSymbols?: string;
}
