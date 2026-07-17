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
 * @memberof ZosUssMessages
 */
export const ZosUssMessages: { [key: string]: IMessageDefinition } = {
    /**
     * Message indicating that the data set type is unsupported
     * @type {IMessageDefinition}
     */
    allAuthMethodsFailed: {
        message: "All configured authentication methods failed"
    },
    connectionRefused: {
        message: "Connection was refused"
    },
    handshakeTimeout: {
        message: "Timed out while waiting for handshake"
    },
    unexpected: {
        message: "Connection failed because of an unexpected error"
    },
    expiredPassword: {
        message: "Your password has expired"
    },
    hostKeyVerificationFailed: {
        message: "Host key verification failed. The SSH server's host key is not trusted, so the connection " +
            "was rejected before any credentials were sent."
    },
    hostKeyChanged: {
        message: "Host key verification failed. The SSH server's host key does not match the previously trusted " +
            "key. This may indicate a man-in-the-middle attack, or the server's host key may have legitimately " +
            "changed. The connection was rejected before any credentials were sent."
    }
};
