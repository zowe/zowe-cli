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
export interface IUploadMap {
    /**
     * The indicator to upload the data set in binary mode
     */
    binary?: boolean;

    /**
     * List of file names to be uploaded in binary or asci
     */
    fileNames: string[];
}
