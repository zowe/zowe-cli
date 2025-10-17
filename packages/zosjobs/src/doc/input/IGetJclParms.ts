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

import { ICommonJobParms } from "./ICommonJobParms";

/**
 * Interface for get JCL APIs
 * @export
 * @interface IGetJclParms
 */
export interface IGetJclParms extends ICommonJobParms {
    /**
     * If you specify true for this field, the file will be downloaded in binary mode
     * @type {boolean}
     * @memberof IGetJclParms
     */
    binary?: boolean;

    /**
     * If you specify true for this field, the file will be downloaded in record mode
     * @type {boolean}
     * @memberof IGetJclParms
     */
    record?: boolean;

    /**
     * The codepage to use for translation from EBCDIC
     * @type {string}
     * @memberof IGetJclParms
     */
    encoding?: string;
}
