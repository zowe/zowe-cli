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

import { ITaskWithStatus } from "@zowe/imperative";

/**
 * This interface defines the options that can be sent to get a data set or USS file function
 * @export
 * @interface IGetOptions
 */
export interface IGetOptions {
    /**
     * The indicator to view the data set or USS file in binary mode
     * @type {boolean}
     */
    binary?: boolean;

    /**
     * The volume on which the data set is stored
     * @type {string}
     */
    volume?: string;

    /**
     * Task status object used by CLI handlers to create progress bars
     * Optional
     * @type {ITaskWithStatus}
     */
    task?: ITaskWithStatus;
}
