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

import { IZosFilesOptions } from "../../../doc/IZosFilesOptions";

/**
 * This interface defines the options that can be sent into the USS list files function
 */
export interface IUSSListOptions extends IZosFilesOptions {

    /**
     * The indicator that we want to show less files
     */
    maxLength?: number;

    /**
     * The group owner or GID to filter
     */
    group?: number|string;

    /**
     * The user name or UID to filter
     */
    user?: number|string;

    /**
     * The modification time to filter, in days
     * Valid values are either an integer, or an integer with leading plus (+) or minus (-)
     */
    mtime?: number|string;

    /**
     * The size to filter
     * Valid values are either an integer, and integer with a suffix (K, M, G),
     * or an integer with leading plus (+) or minus (-)
     */
    size?: number|string;

    /**
     * The name of the file or directory to filter
     */
    name?: string;

    /**
     * The permission octal mask to use
     * The type is a string because valid values are either an integer, or an integer with a leading minus (-)
     */
    perm?: string;

    /**
     * The type of file to filter for
     * Allowed values are: c - character special file, d - directory, f - file, l - symbolic link, p - FIFO (named pipe), and s - socket
     */
    type?: string;

    /**
     * The depth of the directory structure to list files and directories for
     */
    depth?: number;

    /**
     * Whether or not to search all filesystems under the path, or just the same filesystem as the path
     * True means search all
     * False means search same
     */
    filesys?: boolean;

    /**
     * Whether to follow symlinks, or report them
     * True means to report
     * False means to follow
     */
    symlinks?: boolean;
}
