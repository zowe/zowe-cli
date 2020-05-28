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
import { IUploadMap } from "./IUploadMap";
import { ZosFilesAttributes } from "../../../utils/ZosFilesAttributes";

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
     * Code page encoding
     * @example 1047
     * @example 037
     */
    encoding?: number;

    /**
     * The migrated recall option
     * @example "wait, nowait, error"
     */
    recall?: string;

    /**
     * Task status object used by CLI handlers to create progress bars
     * Optional
     */
    task?: ITaskWithStatus;

    /**
     * The indicator to upload the directories recursively
     */
    recursive?: boolean;

    /**
     * The list of files to be uploaded in binary mode
     */
    binary_files?: string;

    /**
     * The list of files to be uploaded in ASCII mode
     */
    ascii_files?: string;

    /**
     * The map of files and their upload mode to be used for binary_files and ascii_files
     */
    filesMap?: IUploadMap;

    /**
     * The ZosFilesAttributes instance describe upload attributes for the files and directories
     */
    attributes?: ZosFilesAttributes;

    /**
     * The maximum REST requests to perform at once
     * Increasing this value results in faster uploads but increases resource consumption
     * on z/OS and risks encountering an error caused
     * by making too many requests at once.
     * Default: 1
     */
    maxConcurrentRequests?: number;
}
