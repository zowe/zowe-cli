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

import { ImperativeError } from "../../error";
import { isNullOrUndefined } from "util";

/**
 * JSON utility to wrap and throw ImperativeErrors
 * @export
 * @class JSONUtils
 */
export class JSONUtils {

    /**
     * Throw imperative error or return parsed data
     * @template T - type to parse
     * @param {string} data - string input data to parse as JSON
     * @param {string} [failMessage="Parse of " + data + " failed"] - failure message
     *
     * @returns {T} - parsed object. If data length is 0 then this method will return a null object
     *
     * @throws {ImperativeError} When there was a failure trying to parse a non-zero length data string.
     */
    public static parse<T extends object>(data: string, failMessage?: string): T {
        if (isNullOrUndefined(failMessage)) {
            failMessage = "Parse of " + data + " failed";
        }
        try {
            // Return an empty object if the string is empty
            if (data != null && data.trim().length === 0) {
                return null;
            } else {
                return JSON.parse(data);
            }
        } catch (thrownError) {
            throw new ImperativeError({
                msg: failMessage + ":\n" + thrownError.message,
                stack: thrownError.stack,
                additionalDetails: thrownError.message,
                causeErrors: thrownError
            });
        }
    }
}
