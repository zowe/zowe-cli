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
import { IZosFilesOptions } from "./IZosFilesOptions";

/**
 * This interface defines the options that can be sent to get a data set or USS file function
 * @export
 * @interface IOptions
 */
export interface IOptions extends IZosFilesOptions {
    /**
     * The indicator to view the data set or USS file in binary mode
     * Has priority over record for datasets
     * If binary and record are both specified, binary is used
     * @type {boolean}
     */
    binary?: boolean;

    /**
     * The indicator to view the data set in record mode
     * Should not be specified for USS files
     * If binary and record are both specified, binary is used
     * @type {boolean}
     */
    record?: boolean;

    /**
     * Code page encoding
     * @type {string}
     */
    encoding?: string;

    /**
     * The local file encoding to pass as a "Content-Type" header
     */
    localEncoding?: string;

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
