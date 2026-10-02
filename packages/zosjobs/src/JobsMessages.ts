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

import { IMessageDefinition } from "@zowe/imperative";

/**
 * Messages to be used as command responses for different scenarios
 * @type {object.<string, IMessageDefinition>}
 */
export const ZosJobsMessages: { [key: string]: IMessageDefinition } = {
    /**
     * Message indicating that the USS file path is required
     * @memberof ZosJobsMessages
     * @type {IMessageDefinition}
     */
    missingUssFilePath: {
        message: "Specify the USS file path."
    },

    /**
     * Message indicating that the "directory" option needs to be used if "extension" was used
     * @memberof ZosJobsMessages
     * @type {IMessageDefinition}
     */
    missingDirectoryOption: {
        message: "If you specify --extension option, you must also specify --directory"
    },

    /**
     * Message indicating that no JCL source was given
     * @memberof ZosJobsMessages
     * @type {IMessageDefinition}
     */
    missingJcl: {
        message: "No JCL provided"
    },

    /**
     * Message indicating that a job name contains characters that are not valid in a z/OS job name
     * @memberof ZosJobsMessages
     * @type {IMessageDefinition}
     */
    invalidJobName: {
        message: "The job name '{{jobname}}' is not valid. A job name can contain only letters, numbers, and the national characters @, #, and $."
    },

    /**
     * Message indicating that a job ID contains characters that are not valid in a z/OS job ID
     * @memberof ZosJobsMessages
     * @type {IMessageDefinition}
     */
    invalidJobId: {
        message: "The job ID '{{jobid}}' is not valid. A job ID can contain only letters and numbers."
    },

    /**
     * Message indicating that a spool file ID is not a non-negative integer
     * @memberof ZosJobsMessages
     * @type {IMessageDefinition}
     */
    invalidSpoolId: {
        message: "The spool file ID '{{spoolId}}' is not valid. A spool file ID must be a non-negative integer."
    }
};
