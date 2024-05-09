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

export class RestStandAloneUtils {

    /**
     * Obtain user name from a base 64 credential
     * @param {string} auth - base 64 encoded credentials
     * @returns {string} - user name
     */
    public static getUsernameFromAuth(auth: string): string {
        auth = auth.replace(this.BASIC, "");
        const decoding = Buffer.from(auth, "base64").toString();
        return decoding.substring(0, decoding.lastIndexOf(":"));
    }

    /**
     * Obtain password from a base 64 credential
     * @param {string} auth - base 64 encoded credentials
     * @returns {string} - password
     */
    public static getPasswordFromAuth(auth: string): string {
        auth = auth.replace(this.BASIC, "");
        const decoding = Buffer.from(auth, "base64").toString();
        return decoding.substring(decoding.lastIndexOf(":") + 1);
    }

    private static readonly BASIC: RegExp = /^Basic/ig;
}
