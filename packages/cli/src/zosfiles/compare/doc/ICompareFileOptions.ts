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

import { IZosFilesOptions } from "@zowe/zos-files-for-zowe-sdk";

/**
 * These are the options to be used in file comaparison to handle the
 *  binary, encoding, record and volumeSerial operations in the comparison process
 *
 * @exports
 * @interface ICompareFileOptions
 */
export interface ICompareFileOptions extends IZosFilesOptions {
    binary?: boolean;
    encoding?: string;
    record?: boolean;
    volumeSerial?: string;
}