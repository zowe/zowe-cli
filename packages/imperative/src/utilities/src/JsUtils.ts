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
        if (!objToTest) {
            return true;
        }
        for (const prop in objToTest) {
            if (Object.prototype.hasOwnProperty.call(objToTest, prop)) {
                return false;
            }
        }
        return true;
    }
}
