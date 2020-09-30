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

import { Logger, LoggingConfigurer, IImperativeConfig } from "@zowe/imperative";

/**
 * Utility function to configure the core logger
 */
function configureLogger(home: string, config: IImperativeConfig ): void {
    Logger.initLogger(LoggingConfigurer.configureLogger(home, config));
}

export { configureLogger as configureLogger };