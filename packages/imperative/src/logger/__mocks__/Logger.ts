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

import { Console } from "../../console";

const Logger: any =
    (jest.genMockFromModule("../Logger") as any).Logger;

const loggerRequire = (jest as any).requireActual("../Logger").Logger;

Logger.getLoggerCategory.mockImplementation((category: string) => {
    return new Logger(new Console(), category);
});

Logger.getImperativeLogger.mockImplementation(() => {
    return Logger.getLoggerCategory(loggerRequire.DEFAULT_IMPERATIVE_NAME);
});

Logger.getAppLogger.mockImplementation(() => {
    return Logger.getLoggerCategory(loggerRequire.DEFAULT_APP_NAME);
});

Logger.getConsoleLogger.mockImplementation(() => {
    return Logger.getLoggerCategory(loggerRequire.DEFAULT_CONSOLE_NAME);
});

Logger.initLogger.mockImplementation(() => {
    return Logger.getLoggerCategory(loggerRequire.DEFAULT_CONSOLE_NAME);
});

exports.Logger = Logger;
