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

import { IConfigLogging } from "../../logger/doc/IConfigLogging";

const LoggingConfigurer: any =
    (jest.genMockFromModule("../LoggingConfigurer") as any).LoggingConfigurer;

const {Logger} = (jest as any).requireActual("../../logger/Logger");

LoggingConfigurer.configureLogger.mockImplementation((): IConfigLogging => {
    return {
        log4jsConfig: {
            appenders: {
                default: {
                    type: "console",
                    layout: {
                        type: "I have no clue what goes here :/",
                        pattern: "I have no clue what goes here :/"
                    }
                }
            },
            categories: {
                [Logger.DEFAULT_IMPERATIVE_NAME]: {
                    appenders: ["default"],
                    level: "TRACE"
                },
                [Logger.DEFAULT_APP_NAME]: {
                    appenders: ["default"],
                    level: "TRACE"
                },
            }
        }
    };
});

exports.LoggingConfigurer = LoggingConfigurer;
