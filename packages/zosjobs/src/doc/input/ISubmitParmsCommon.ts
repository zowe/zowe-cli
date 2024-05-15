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
 * Common interface for submit job API
 * @export
 * @interface ISubmitParms
 */
export interface ISubmitParmsCommon {

    /**
     * A string for JCL symbolic substitution
     * @type {string}
     * @memberof ISubmitParms
     */
    jclSymbols?: string;

    /**
     * Specify internal reader file encoding and corresponding http(s) headers
     * will be appended to the request accordingly
     * @type {string}
     * @memberof ISubmitParms
     */
    internalReaderFileEncoding?: string;

    /**
     * Specify internal reader RECFM and corresponding http(s) headers
     * will be appended to the request accordingly
     * "F" (fixed) or "V" (variable)
     * @type {string}
     * @memberof ISubmitJclParms
     */
    internalReaderRecfm?: string;

    /**
     * Specify internal reader LRECL and corresponding http(s) headers
     * will be appended to the request accordingly
     * @type {string}
     * @memberof ISubmitJclParms
     */
    internalReaderLrecl?: string;
}
