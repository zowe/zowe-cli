import { IHandlerProgressApi, ITaskWithStatus } from "@zowe/imperative";
import { IDataSet } from "../../../doc/IDataSet";
import { IZosFilesOptions } from "../../../doc/IZosFilesOptions";

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
 * This interface defines the options that can be sent into the copy data set function.
 */
export interface ICopyDatasetOptions extends IZosFilesOptions {
    /**
     * The dataset to copy from.
     * @type {IDataSet}
     */
    "from-dataset": IDataSet;

    /**
     * Enq option
     * Allow values are: SHR, SHRW, EXCLU.
     * @type {string}
     */
    enq?: string;

    /**
     * Replace option
     * @type {boolean}
     */
    replace?: boolean;

    /**
     * Overwrite option
     * @type {boolean}
     */
    overwrite?: boolean;

    /**
     * Safe replace option
     * @type {boolean};
     */
    safeReplace?: boolean;

    /**
     * Prompt callback that will be invoked before overwiting a data set.
     * @param targetDSN Name of data set that already exists
     * @returns True if target data set should be overwritten
     */
    promptFn?: (targetDSN: string) => Promise<boolean>;

    /**
     * Prompt for duplicates
     * @returns `True` if the copy operation will overwrite an existing member; `false` otherwise
     */
    promptForIdenticalNamedMembers?: () => Promise<boolean>;

    /**
     * Task status object used by CLI handlers to create progress bars
     * Optional
     * @type {ITaskWithStatus}
     */
    task?: ITaskWithStatus;

    /**
     * Apis to create and destroy progress bars during the command.
     * @type {IHandlerProgressApi}
     * @memberof IHandlerResponseApi
     */
    progress?: IHandlerProgressApi;
}
