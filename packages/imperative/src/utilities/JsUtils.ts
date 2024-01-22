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

import { URL } from "url";

export class JsUtils {

    // __________________________________________________________________________
    /**
     * Is the supplied object empty.
     *
     * @param {object} objToTest - The object to test.
     *
     * @returns {boolean} - True if empty. False otherwise.
     */
    public static isObjEmpty(objToTest: object): boolean {
        return Object.keys(objToTest ?? {}).length === 0;
    }

    // __________________________________________________________________________
    /**
     * Is the supplied string a URL.
     *
     * @param {string} urlString - The string to test.
     *
     * @returns {boolean} - True if it is a URL. False otherwise.
     */
    public static isUrl(urlString: string): boolean {
        try { return new URL(urlString).origin !== "null"; } catch (_) { return false; }
    }
}
