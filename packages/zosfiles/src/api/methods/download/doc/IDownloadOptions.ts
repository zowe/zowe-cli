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
import { IOptions } from "../../../doc/IOptions";

/**
 * This interface defines the options that can be sent into the download data set function
 */
export interface IDownloadOptions extends IOptions {

    /**
     * Alternate current working directory
     * @type {string}
     * @memberof IDownloadOptions
     */
    cwd?: string;

    /**
     * The local file to download the data set to
     * @example "./path/to/file.txt"
     */
    file?: string;

    /**
     * The extension you want to use for the file
     * @example .txt
     * @example .c
     */
    extension?: string;

    /**
     * The local directory to download all members from a pds
     * @example "./path/to/dir"
     */
    directory?: string;

    /**
     * Exclude data sets that match these DSLEVEL patterns. Any data sets that match
     * this pattern will not be downloaded
     * @example "ibmuser.**.jcl, ibmuser.rexa.*"
     */
    excludePatterns?: string[];

    /**
     * Map data set names that match your pattern to the desired extension
     * @example cpgm=c,asmpgm=asm
     */
    extensionMap?: { [key: string]: string };

    /**
     * The maximum REST requests to perform at once
     * Increasing this value results in faster downloads but increases resource consumption
     * on z/OS and risks encountering an error caused
     * by making too many requests at once.
     * Default: 1
     */
    maxConcurrentRequests?: number;

    /**
     * The indicator to force return of ETag.
     * If set to 'true' it forces the response to include an "ETag" header, regardless of the size of the response data.
     * If it is not present, the the default is to only send an Etag for data sets smaller than a system determined length,
     * which is at least 8MB.
     */
    returnEtag?: boolean;

    /**
     * Indicates if the created directories and files use the original letter case, which is for data sets always uppercase.
     * The default value is false for backward compability.
     * If the option "directory" or "file" is provided, this option doesn't have any effect.
     * This option has only effect on automatically generated directories and files.
     */
    preserveOriginalLetterCase?: boolean;

    /**
     * Indicates if a download operation for multiple files/data sets should fail as soon as the first failure happens.
     * If set to true, the first failure will throw an error and abort the download operation.
     * If set to false, individual download failures will be reported after all other downloads have completed.
     * The default value is true for backward compatibility.
     */
    failFast?: boolean;
}
