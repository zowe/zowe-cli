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

import { IZosFileUtils } from "../../../doc/IZosFileUtils";

/**
 * This interface defines the options that can be sent into the delete data set function.
 */
export interface IDeleteOptions extends IZosFileUtils {

    /**
     * If true then the function uses the PURGE=YES on ARCHDEL request.
     * If false (default) the function uses the PURGE=NO on ARCHDEL request.
     */
    purge?: boolean;
}
