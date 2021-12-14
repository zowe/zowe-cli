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

import { IZosLogItemType } from "./IZosLogItemType";
/**
 * Standard log response document
 * Represents the details about the messages and logs
 * @export
 * @interface IZosLogType
 */
export interface IZosLogType {

    /**
     * Specify the timezone of the z/OS system. Valid values for the timezone rangefrom -12 to 12.
     * For example, "-3" means UTC-3 timezone.
     * @type {number}
     * @memberof IZosLogType
     */
    timezone: number;

    /**
     * The UNIX timestamp. This value could be used in a subsequent request tospecify a starting timestamp.
     * Logs in the “nextTimestamp” are not returned in the current response.
     * @type {number}
     * @memberof IZosLogType
     */
    nextTimestamp: number;

    /**
     * Indicates the source of the log.
     * Value "OPERLOG" indicates the operations log.
     * @type {string}
     * @memberof IZosLogType
     */
    source: string;

    /**
     * Total number of messages returned in the response.
     * @type {number}
     * @memberof IZosLogType
     */
    totalitems: number;

    /**
     * JSON array of messages
     * @type {IZosLogItemType[]}
     * @memberof IZosLogType
     */
    items: IZosLogItemType[];
}
