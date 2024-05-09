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
 * This class contains logic to enable users to opt-in to features
 * that will become standard functionality in the next version of Zowe.
 * @export
 * @class NextVerFeatures
 */
export class NextVerFeatures {
    private static ENV_VAR_PREFIX = "ZOWE";

    /**
     * Identify if we should use the V3 error message format.
     * That choice is determined by the value of the ZOWE_V3_ERR_FORMAT environment variable.
     *
     * TODO:V3_ERR_FORMAT - Remove in V3
     *
     * @returns {boolean} True -> Use the V3 format.
     */
    public static useV3ErrFormat(): boolean {
        // our default is false
        let v3ErrFmtBoolVal: boolean = false;
        const v3ErrFmtStringVal = process.env[`${NextVerFeatures.ENV_VAR_PREFIX}_V3_ERR_FORMAT`];
        if (v3ErrFmtStringVal !== undefined) {
            // user has set the V3 error format environment variable
            if (v3ErrFmtStringVal.toUpperCase() === "TRUE") {
                v3ErrFmtBoolVal = true;
            }
        }
        return v3ErrFmtBoolVal;
    }
}
