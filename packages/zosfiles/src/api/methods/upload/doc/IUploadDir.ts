import { IUploadFile } from "./IUploadFile";

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
 * This interface defines the map option that can be sent into the upload uss directory function
 */
export interface IUploadDir {
    /**
     * directory name
     */
    dirName: string;

    /**
     * full path specification (on local host)
     */
    fullPath: string;

    /**
     * list of files contained in the directory
     */
    fileArray?: IUploadFile[];
}
