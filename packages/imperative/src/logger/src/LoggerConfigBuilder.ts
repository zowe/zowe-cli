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

import { IConfigLogging } from "./doc/IConfigLogging";
import { IO } from "../../io";
import * as path from "path";
import * as os from "os";

export class LoggerConfigBuilder {

    public static readonly DEFAULT_LANG = "en";
    public static readonly DEFAULT_LOG_TYPE_CONSOLE = "console";
    public static readonly DEFAULT_LOG_TYPE_PAT = "pattern";
    public static readonly DEFAULT_LOG_LAYOUT = "[%d{yyyy/MM/dd} %d{hh:mm:ss.SSS}] [%p] %m";
    public static readonly DEFAULT_COLOR_LAYOUT = "%[" + LoggerConfigBuilder.DEFAULT_LOG_LAYOUT + "%]";
    public static readonly DEFAULT_LOG_TYPE_FILE_SYNC = "fileSync";
    public static readonly DEFAULT_BACKEND = "NONE";

    public static readonly DEFAULT = "default";
    public static readonly DEFAULT_LOG_DIR = IO.FILE_DELIM;
    public static readonly DEFAULT_LOG_FILE_DIR = "logs" + IO.FILE_DELIM;
    public static readonly DEFAULT_LOG_FILE_EXT = ".log";
    public static readonly DEFAULT_LOG_FILE_MAX_SIZE = 10000000;  // 10MB log size
    public static readonly DEFAULT_LOG_FILE_BACKUPS = 5;


    /**
     * Build a fully qualified directory to a log file - defaults to the users home directory - Imperative
     * does NOT use this as the home is set by the CLI configuration document.
     * @param {string} name - name of the file to append to fully qualified directory
     */
    public static buildFullLogFile(name: string) {
        return path.normalize(os.homedir()  + name);
    }

    /**
     * Returns the constant values defined within the LoggerConfigBuilder for this config object
     * @return {IConfigLogging} - default object built
     */
    public static getDefaultIConfigLogging(): IConfigLogging {
        const config: IConfigLogging = {
            log4jsConfig: {
                appenders: {
                },
                categories: {
                },
            }
        };
        return config;
    }

    /**
     * Returns the constant values defined within the LoggerConfigBuilder for this config object
     * @return {IConfigLogging} - default object built
     */
    public static addConsoleAppender(config: IConfigLogging, key: string, categoryName = key, logLevel?: string): IConfigLogging {
        config.log4jsConfig.appenders[key] = {
            type: LoggerConfigBuilder.DEFAULT_LOG_TYPE_CONSOLE,
            layout: {
                type: LoggerConfigBuilder.DEFAULT_LOG_TYPE_PAT,
                pattern: LoggerConfigBuilder.DEFAULT_COLOR_LAYOUT,
            },
        };
        config.log4jsConfig.categories[categoryName] = {
            appenders: [key],
            level: logLevel ? logLevel : LoggerConfigBuilder.getDefaultLogLevel(),
        };
        return config;
    }

    /**
     * Returns the constant values defined within the LoggerConfigBuilder for this config object
     * @return {IConfigLogging} - default object built
     */
    public static addFileAppender(config: IConfigLogging, key: string, categoryName = key,
        filename = LoggerConfigBuilder.buildFullLogFile(LoggerConfigBuilder.getDefaultFileName(key)),
        logLevel?: string): IConfigLogging {
        config.log4jsConfig.appenders[key] = {
            filename,
            type: LoggerConfigBuilder.DEFAULT_LOG_TYPE_FILE_SYNC,
            maxLogSize: LoggerConfigBuilder.DEFAULT_LOG_FILE_MAX_SIZE,
            backups: LoggerConfigBuilder.DEFAULT_LOG_FILE_BACKUPS,
            layout: {
                type: LoggerConfigBuilder.DEFAULT_LOG_TYPE_PAT,
                pattern: LoggerConfigBuilder.DEFAULT_LOG_LAYOUT,
            },
        };
        config.log4jsConfig.categories[categoryName] = {
            appenders: [key],
            level: logLevel ? logLevel : LoggerConfigBuilder.getDefaultLogLevel(),
        };
        return config;
    }

    /**
     * Returns the log file name that will be used
     * @return {string} - the default file name for the log file
     */
    public static getDefaultFileName(name: string) {
        return LoggerConfigBuilder.DEFAULT_LOG_DIR + LoggerConfigBuilder.DEFAULT_LOG_FILE_DIR + name + LoggerConfigBuilder.DEFAULT_LOG_FILE_EXT;
    }

    /**
     * Returns the log level that will be used if not overridden
     * @returns {string} - the default log level
     */
    public static getDefaultLogLevel(): string {
        return process.env.NODE_ENV === "development" ? "DEBUG" : "WARN";
    }
}
