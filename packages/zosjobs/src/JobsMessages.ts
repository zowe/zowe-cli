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
    * Message indicating that no search option was passed or both were passed
    * @memberof ZosJobsMessages
    * @type {IMessageDefinition}
    */
    missingSearchOption: {
        message: "You must specify either the `--search-string` or `--search-regex` option"
    }
};
