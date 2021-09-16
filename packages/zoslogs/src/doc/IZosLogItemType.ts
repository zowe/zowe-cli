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
 * Interface for returned json object
 *
 * @interface IZosLogItemType
 */
export interface IZosLogItemType {
    jobName: string;
    system: string;
    color: string;
    replyId: string;
    messageId: string;
    subType: string;
    time: string;
    message: string;
    type: string;
    cart: string;
    timestamp: number;
}
