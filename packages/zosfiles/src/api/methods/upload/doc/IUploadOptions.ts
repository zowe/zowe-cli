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

import { ITaskWithStatus } from "@brightside/imperative";

/**
 * This interface defines the options that can be sent into the upload data set function
 */
export interface IUploadOptions {

    /**
     * The volume where the data set resides
     */
    volume?: string;

    /**
     * The indicator to upload the data set in binary mode
     */
    binary?: boolean;

    /**
     * The migrated recall option
     * @example "wait, nowait, error"
     */
    recall?: string;

    /**
     * Task status object used by CLI handlers to create progress bars
     * for certain upload requests such as directory to PDS
     * Optional
     */
    task?: ITaskWithStatus;

    /**
     * The indicator to upload the directories recursively
     */
    recursive?: boolean;
}
