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
 * Messages displayed by the zosmf check status command
 * @type {object.<string, IMessageDefinition>}
 */
export const CheckStatusMessages: { [key: string]: IMessageDefinition } = {
    /**
     * Displayed when checkStatus succeeds and returns status information.
     * @type {IMessageDefinition}
     */
    cmdSucceeded: {
        message:
            "The user '{{userName}}' successfully connected to z/OSMF on " +
            "'{{hostName}}'.\n{{mainZosmfProps}}" +
            "z/OSMF Plug-ins that are installed on '{{hostName}}':\n{{pluginStatus}}"
    }
};
