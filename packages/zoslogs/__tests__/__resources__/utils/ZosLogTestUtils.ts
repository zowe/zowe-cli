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

import { ImperativeError } from "@zowe/imperative";

/**
 * Class for ZosLog test utils.
 * @class ZosLogTestUtils
 */
export class ZosLogTestUtils {
    // Max timeout time for Jest
    public static MAX_TIMEOUT_TIME: number = 240000;

    /**
     * The function tests if response passed from REST call is successful.
     * @param response - response from REST call.
     * @param error - z/OSMF error.
     */
    public static expectZosmfResponseSucceeded(response: any, error: ImperativeError) {
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
    }

    /**
     * The function tests if REST call is failed.
     * @param response - response from REST call.
     * @param error - z/OSMF error.
     * @param msg - error message to compare with z/OSMF error.
     */
    public static expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toContain(msg);
    }
}
