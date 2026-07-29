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
 * Reply sent by the daemon to the client's initial handshake "hello" frame,
 * proving that the daemon knows the secret token stored in the owner-only
 * PID file before the client sends anything sensitive (argv/cwd/env/proof).
 */
export interface IDaemonHandshakeReply {
    /**
     * A fresh nonce chosen by the daemon. The client binds its own proof
     * (sent with the real request that follows) to this nonce.
     */
    nonce: string;

    /**
     * HMAC-SHA256 of the shared secret token, bound to the client's nonce
     * from the hello frame. Proves the daemon knows the token without ever
     * putting the raw token on the wire.
     */
    serverProof: string;
}
