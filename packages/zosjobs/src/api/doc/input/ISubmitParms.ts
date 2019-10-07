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

import { ITaskWithStatus } from "@brightside/imperative";

/**
 * Interface for submit job API
 * @export
 * @interface ISubmitParms
 */
export interface ISubmitParms {

    /**
     * USS file which should contain syntactically correct JCL
     * Example value: IBMUSER.PUBLIC.CNTL(IEFBR14)
     * where IEFBR14 contains statements like:
     *   //IEFBR14 JOB ()
     *   //RUN     EXEC PGM=IEFBR14
     */
    jclSource: string;

    /**
     * Returns spool content if this option used
     */
    viewAllSpoolContent?: boolean;

    /**
     * Wait for the job to reach output status
     */
    wait?: boolean;

    /**
     * Local directory path to download output of the job
     */
    directory?: string;

    /**
     * A file extension to save the job output with
     */
    extension?: string;

    /**
     * The volume on which the data set is stored
     */
    volume?: string;

    /**
     * Task status object used by CLI handlers to create progress bars
     * for certain job submit requests
     * Optional
     */
    task?: ITaskWithStatus;
}
