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
 * This interface defines the options that can be sent into the migrate data set function.
 */
export interface IMigrateOptions extends IZosFilesOptions {

    /**
     * If true then the function waits for completion of the request.
     * If false (default) the request is queued.
     */
    wait?: boolean;
}
