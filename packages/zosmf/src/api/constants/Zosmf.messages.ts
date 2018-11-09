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
 * Messages to be used as detail display error message when gathering z/OSMF information
 * @type {object.<string, IMessageDefinition>}
 */
export const ZosmfMessages: { [key: string]: IMessageDefinition } = {
    /**
     * Message indicate that input session object is invalid
     * @type {IMessageDefinition}
     */
    missingSession: {
        message: "Missing profile session information."
    },
    /**
     * Message indicate that unable to connect to specified host name
     * @type {IMessageDefinition}
     */
    invalidHostName: {
        message: "Unable to establish connection to host "
    },
    /**
     * Message indicate that unable to establish connection with specified port number
     * @type {IMessageDefinition}
     */
    invalidPort: {
        message: "Unable to establish connection at port "
    },
    /**
     * Message indicate that the rejectUnauthorized flag was not set properly
     * @type {IMessageDefinition}
     */
    improperRejectUnauthorized: {
        message: "A self-signed certificate was used ({{causeMsg}}),\nand your reject-unauthorized option is '{{rejectUnauthorized}}'."
    }
};
