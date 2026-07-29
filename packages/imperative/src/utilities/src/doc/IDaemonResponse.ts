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
 * Option interface to construct response from daemon client
 * @export
 * @interface IDaemonResponse
 */
export interface IDaemonResponse {
    /**
     * List of CLI arguments received from the daemon client.
     */
    argv?: string[];

    /**
     * Current working directory received from the daemon client.
     */
    cwd?: string;

    /**
     * Environment variables with CLI prefix received from the daemon client.
     */
    env?: Record<string, string>;

    /**
     * Length of stdin data received from the daemon client.
     * The client sends binary stdin data as a multipart request, that contains
     * a JSON body with `stdinLength` defined, followed by the raw binary data.
     */
    stdinLength?: number;

    /**
     * Stdin text received from the daemon client.
     * This is used for plain text stdin data like replies to prompts.
     */
    stdin?: string;

    /**
     * The user that initiated the request from the daemon client.
     */
    user?: string;

    /**
     * A fresh nonce chosen by the client, sent alone (with no other fields
     * populated) as the very first message on a new connection. This starts
     * the identity handshake: the daemon must prove it knows the secret
     * token from the owner-only PID file (bound to this nonce) before the
     * client will send anything else.
     */
    nonce?: string;

    /**
     * Keyed proof that the daemon client could read the owner-only daemon
     * PID file (and is therefore the user that owns this daemon): an
     * HMAC-SHA256 of the secret token, bound to the server nonce received
     * during the handshake. The client sends this on every request. This is
     * the authoritative authentication check. The raw
     * token itself is never sent on the wire; see `DaemonClient`.
     */
    clientProof?: string;
}
