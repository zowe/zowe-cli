/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { IMessageDefinition } from "@brightside/imperative";

/**
 * Messages displayed by the zosmf check status command
 * @type {object.<string, IMessageDefinition>}
 */
export const CheckStatusMessages: { [key: string]: IMessageDefinition } = {
    /**
     * Displayed when checkStatus receives an error from our API.
     * @type {IMessageDefinition}
     */
    cmdFailed: {
        message:
            "User '{{userName}}' failed to get information from " +
            "'{{hostName}}:{{portNum}}'\ndue to the following error:\n" +
            "{{reasonMsg}}\n\n" +
            "Your bright z/OSMF profile may not be configured properly,\n" +
            "or the z/OSMF subsystem on '{{hostName}}' may not be available."
    },
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
