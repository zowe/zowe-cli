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
 * Interface for create dataset API
 *  zOSMF REST API information:
 *    https://www.ibm.com/support/knowledgecenter/SSLTBW_2.3.0/com.ibm.zos.v2r3.izua700/IZUHPINFO_API_CreateDataSet.htm#CreateDataSet
 * @export
 */
export interface ICreateDataSetLikeOptions {
    /**
     * The name of another data set from which to copy attributes
     * @type {string}
     */
    like: string;
    /**
     * The indicator that we need to show the attributes
     *
     * DO NOT SEND THIS TO ZOSMF
     *
     * @type {boolean}
     */
    showAttributes?: boolean;
}
