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
 * This interface defines the options that can be sent into the USS list files qfunction
 */
export interface IUSSListOptions extends IZosFilesOptions {


    /**
     * The indicator that we want to show less files
     */
    maxLength?: number;

    /**
     * An optional parameter to enable detailed error messages for commands
     */
    messageResponse?: boolean;
}
