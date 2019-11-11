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
 * Interface for the copy dataset API
 *  zOSMF REST API information:
 *    https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.1.0/com.ibm.zos.v2r1.izua700/IZUHPINFO_API_PutDataSetMemberUtilities.htm
 * @export
 */
export interface ICopyDataSet {
    /**
     * The name of the data set
     * @type {string}
     */
    dataSetName: string;

    /**
     * The name of the member
     * @type {string}
     */
    memberName?: string;

    /**
     * Replace option
     * @type {boolean}
     */
    replace?: boolean;
}
