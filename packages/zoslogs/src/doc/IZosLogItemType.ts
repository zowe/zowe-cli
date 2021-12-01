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
 * Represents the details about one log item
 * @export
 * @interface IZosLogItemType
 */
export interface IZosLogItemType {

    /**
     * Eight character command and response token (CART).
     * @type {string}
     * @memberof IZosLogItemType
     */
    cart: string;

    /**
     * The color of the message.
     * @type {string}
     * @memberof IZosLogItemType
     */
    color: string;

    /**
     * The name of the job that generates the message.
     * @type {string}
     * @memberof IZosLogItemType
     */
    jobName: string;

    /**
     * The content of the message.
     * @type {string}
     * @memberof IZosLogItemType
     */
    message: string;

    /**
     * The message ID.
     * @type {string}
     * @memberof IZosLogItemType
     */
    messageId: string;

    /**
     * Reply ID, in decimal.
     * @type {string}
     * @memberof IZosLogItemType
     */
    replyId: string;

    /**
     * Original eight character system name.
     * @type {string}
     * @memberof IZosLogItemType
     */
    system: string;

    /**
     * “HARDCOPY”.
     * @type {string}
     * @memberof IZosLogItemType
     */
    type: string;

    /**
     * Indicate whether the message is a DOM, WTOR, or HOLD message.
     * @type {string}
     * @memberof IZosLogItemType
     */
    subType: string;

    /**
     * For example, “Thu Feb 03 03:00 GMT 2021”.
     * @type {string}
     * @memberof IZosLogItemType
     */
    time: string;

    /**
     * UNIX timestamp. For example, 1621920830109.
     * @type {number}
     * @memberof IZosLogItemType
     */
    timestamp: number;
}
