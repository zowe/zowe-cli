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

import { IUploadMap } from "./IUploadMap";
import { ZosFilesAttributes } from "../../../utils/ZosFilesAttributes";
import { IOptions } from "../../../doc/IOptions";

/**
 * This interface defines the options that can be sent into the upload data set function
 */
export interface IUploadOptions extends IOptions {

    /**
     * The migrated recall option
     * @example "wait, nowait, error"
     */
    recall?: string;

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

    /**
     * Etag value to pass to z/OSMF API request.
     * It is used to check if the file was modified on target system before it is updated.
     */
    etag?: string;

    /**
     * The local file encoding to pass as a "Content-Type" header
     */
    localEncoding?: string;

    /**
     * The indicator to force return of ETag.
     * If set to 'true' it forces the response to include an "ETag" header, regardless of the size of the response data.
     * If it is not present, the the default is to only send an Etag for data sets smaller than a system determined length,
     * which is at least 8MB.
     */
    returnEtag?: boolean;
}
