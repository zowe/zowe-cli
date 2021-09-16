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
 * Interface for log in returned json object
 *
 * @interface IZosLogType
 */
import { IZosLogItemType } from "./IZosLogItemType";

export interface IZosLogType {
    timezone: number;
    nextTimestamp: number;
    source: string;
    totalitems: number;
    items: IZosLogItemType[];
}
