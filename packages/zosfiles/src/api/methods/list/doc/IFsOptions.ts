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
 * This interface defines the options that can be sent into the zfs function
 */
export interface IFsOptions extends IZosFilesOptions {

    /**
     * Specifies the path where the file system is mounted
     */
    path?: string;

    /**
     * Specifies the name of the mounted file system
     */
    fsname?: string;

    /**
     * Specifies the maximum number of items to return
     */
    maxLength?: number;
}
