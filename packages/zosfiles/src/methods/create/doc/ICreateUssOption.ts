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
 * Interface for the options to the create uss file or directory API.
 * @export
 * @interface ICreateUssOptions
 */
export interface ICreateUssOptions extends IZosFilesOptions {

    /**
     * The request type
     * @type {string}
     */
    type: string;

    /**
     * 	Specifies the file or directory permission bits to be used in creating the file or directory.
     * @type {string}
     */
    mode?: string;
}
