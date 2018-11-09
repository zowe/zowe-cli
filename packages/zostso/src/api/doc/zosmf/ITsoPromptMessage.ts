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
 * TSO Prompt interface for one of TSO/E messages
 * @export
 * @memberOf ITsoPromptMessage
 */
export interface ITsoPromptMessage {
    /**
     * JSON version for message format
     * @type string
     * @memberOf ITsoPromptMessage
     */
    "VERSION": string;

    /**
     * description of the data type
     * @type string
     * @memberOf ITsoPromptMessage
     */
    "HIDDEN": string;
}
