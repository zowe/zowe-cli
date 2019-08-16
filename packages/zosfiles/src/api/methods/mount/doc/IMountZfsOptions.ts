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
 * Interface for the options to the mount zos-file-system API.
 * @export
 * @interface IMountZfsOptions
 */
export interface IMountZfsOptions {

    /**
     * The directory to use as a mount point
     * @type {string}
     */
    "mount-point"?: string;

    /**
     * The file system type to mount
     * @type {string}
     */
    "fs-type"?: string;

    /**
     * The mode for mounting the file system
     * @type {string}
     */
    mode?: string;
}
