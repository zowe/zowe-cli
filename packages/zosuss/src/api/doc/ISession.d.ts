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
 * SSH session interface for protocol information
 * @export
 * @interface ISession
 */
export interface ISession {
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
     * Path for the private key that matches with the public key that is stored in the server for authentication.
     * @type {string}
     * @memberof ISession
     */
    privateKey?: string;
    /**
     * Passphrase to decrypt the private key if it is encrypted
     * @type {string}
     * @memberof ISession
     */
    passphrase?: string;
}
