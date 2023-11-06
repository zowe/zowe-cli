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

import { IImperativeLoggingConfig } from "./IImperativeLoggingConfig";

export interface IImperativeLogsConfig {

    /**
     * Use this property to configure imperative logging preferences.  Defaults are provided and this
     * property must only be supplied to override defaults.  See the IImperativeLoggingConfig document for more
     * information.
     */
    imperativeLogging?: IImperativeLoggingConfig;

    /**
     * Use this property to configure your applications logging preferences.  Defaults are provided and this
     * property must only be supplied to override defaults.  See the IImperativeLoggingConfig document for more
     * information.
     */
    appLogging?: IImperativeLoggingConfig;

    /**
     * Use this property to configure additional log files and preferences if needed.
     */
    additionalLogging?: IImperativeLoggingConfig[];

    [key: string]: any;
}
