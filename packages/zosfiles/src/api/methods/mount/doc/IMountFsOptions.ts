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

import { IMountFsMode } from "./IMountFsMode";
import { IZosFilesOptions } from "../../../doc/IZosFilesOptions";

/**
 * Interface for the options to the mount file-system API.
 * @export
 * @interface IMountFsOptions
 */
export interface IMountFsOptions extends IZosFilesOptions {

    /**
     * The file system type to mount
     * @type {string}
     */
    "fs-type"?: string;

    /**
     * The mode for mounting the file system
     * @type {IMountFsMode}
     */
    mode?: IMountFsMode;
}
