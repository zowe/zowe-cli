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
 * Session interface for maintaining cookie and protocol information
 * @export
 * @interface ISshSession
 */
export interface ISshSession {

    /**
     * Host to connect ssh to
     * @type {string}
     * @memberof ISession
     */
    hostname?: string;

    /**
     * Port to obtain data from
     * 22 is the default for ssh
     * @type {number}
     * @memberof ISession
     */
    port?: number;

    /**
     * User name for logging in
     * @type {string}
     * @memberof ISession
     */
    user?: string;

    /**
     * Password
     * @type {string}
     * @memberof ISession
     */
    password?: string;

    /**
     * Path to a private key that matches with a public key stored in the server for authentication
     * @type {string}
     * @memberof ISession
     */
    privateKey?: string;

    /**
     * password to unlock the private key.
     * @type {string}
     * @memberof ISession
     */
    keyPassphrase?: string;

    /**
     * How long in milliseconds to wait for the SSH handshake to complete. If unset, defaults to 0 - no timeout.
     * @type {string}
     * @memberof ISession
     */
    handshakeTimeout?: number;

    /**
     * Trusted host key of the z/OS SSH server, stored as the base64-encoded key blob presented by the
     * server during the handshake. When set, the server's key is verified against this value before any
     * credentials are sent. Populated automatically on first connect after the user accepts the key
     * (trust on first use), or configured manually to pin a known key.
     * @type {string}
     * @memberof ISession
     */
    hostKey?: string;

    /**
     * Skip verification of the SSH server's host key. Defaults to false, meaning the server's identity
     * is verified before any credentials are sent. When true, host key verification is skipped entirely
     * and the connection is vulnerable to man-in-the-middle attacks.
     * @type {boolean}
     * @memberof ISession
     */
    insecure?: boolean;

}
