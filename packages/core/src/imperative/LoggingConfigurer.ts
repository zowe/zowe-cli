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

import { IConfigLogging } from "../logger/doc/IConfigLogging";
import { Logger } from "../logger/Logger";
import { LoggerConfigBuilder } from "../logger/LoggerConfigBuilder";
import { IImperativeConfig } from "./doc/IImperativeConfig";
import { Console } from "../console/Console";
import { IO } from "../io/IO";
import { IImperativeLoggingConfig } from "./doc/IImperativeLoggingConfig";
import { ImperativeError } from "../error/ImperativeError";
import { ImperativeExpect } from "../expect/ImperativeExpect";

/**
 * Helper class to construct default config, log4js config, and define
 * log4js configuration document.
 * @export
 * @class LoggingConfigurer
 */
export class LoggingConfigurer {

    /**
     * Configure all log4js loggers based on imperative config
     * @static
     * @param {string} home - home directory
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @returns {IConfigLogging} - compiled logging config for Logger.init();
     * @memberof LoggingConfigurer
     */
    public static configureLogger(home: string, imperativeConfig: IImperativeConfig): IConfigLogging {
        ImperativeExpect.toBeDefinedAndNonBlank(home, "home");
        ImperativeExpect.keysToBeDefinedAndNonBlank(imperativeConfig, ["name"]);

        /**
         * Build appropriate minimum required configuration for the loggers of:
         * - imperative
         * - app
         * - console
         */
        imperativeConfig = LoggingConfigurer.buildLoggingDefaults(imperativeConfig);

        /**
         * Get a default log4js configuration document
         */
        let loggingConfig = LoggerConfigBuilder.getDefaultIConfigLogging();

        /**
         * Add appenders for the log4js configuration document based on the imperative logging configuration
         */
        loggingConfig = LoggerConfigBuilder.addFileAppender(
            loggingConfig,
            LoggerConfigBuilder.DEFAULT,
            LoggerConfigBuilder.DEFAULT,
            home + LoggerConfigBuilder.getDefaultFileName(imperativeConfig.logging.imperativeLogging.apiName));

        loggingConfig = LoggerConfigBuilder.addFileAppender(
            loggingConfig,
            imperativeConfig.logging.imperativeLogging.apiName,
            imperativeConfig.logging.imperativeLogging.apiName,
            home + LoggerConfigBuilder.getDefaultFileName(imperativeConfig.logging.imperativeLogging.apiName));

        const appId = imperativeConfig.name;
        loggingConfig = LoggerConfigBuilder.addFileAppender(
            loggingConfig,
            imperativeConfig.logging.appLogging.apiName,
            imperativeConfig.logging.appLogging.apiName,
            home + LoggerConfigBuilder.getDefaultFileName(appId));
        // loggingConfig = LoggerConfigBuilder.addConsoleAppender(loggingConfig, imperativeConfig.logging.consoleLogging.apiName);

        /**
         * Configure the log4js categories and appenders based on imperative configuration (set log levels)
         */
        loggingConfig = LoggingConfigurer.configureImperativeLogger(
            home, imperativeConfig, loggingConfig, imperativeConfig.logging.imperativeLogging.apiName);
        loggingConfig = LoggingConfigurer.configureAppLogger(
            home, imperativeConfig, loggingConfig, imperativeConfig.logging.appLogging.apiName);
        // loggingConfig = LoggingConfigurer.configureConsoleLogger(
        //     imperativeConfig, loggingConfig, imperativeConfig.logging.consoleLogging.apiName);

        /**
         * All remaining logs are created here
         */
        if (imperativeConfig.logging.additionalLogging != null) {
            imperativeConfig.logging.additionalLogging.forEach((logConfig) => {
                if (logConfig.apiName == null) {
                    throw new ImperativeError({
                        msg: "apiName is required for additionalLoggers",
                    });
                }
                loggingConfig = LoggerConfigBuilder.addFileAppender(loggingConfig, logConfig.apiName);
                loggingConfig = LoggingConfigurer.configureLoggerByKeyHelper(
                    home, logConfig, loggingConfig, logConfig.apiName, logConfig.apiName);
            });
        }

        return loggingConfig;
    }

    /**
     * Configures log4js imperative appender from imperative config
     * @private
     * @static
     * @param {string} home - home directory
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @param {IConfigLogging} loggingConfig - log4js config
     * @param {string} key - keys within log4js appenders (like the appenders "imperative" key or categories "imperative" key)
     * @memberof LoggingConfigurer
     */
    private static configureImperativeLogger(
        home: string, imperativeConfig: IImperativeConfig, loggingConfig: IConfigLogging, key: string): IConfigLogging {
        return LoggingConfigurer.configureLoggerByKey(home, imperativeConfig, loggingConfig, key, "imperativeLogging");
    }

    /**
     * Configures log4js app appender from imperative config
     * @private
     * @static
     * @param {string} home - home directory
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @param {IConfigLogging} loggingConfig - log4js config
     * @param {string} key - keys within log4js appenders (like the appenders "imperative" key or categories "imperative" key)
     * @memberof LoggingConfigurer
     */
    private static configureAppLogger(home: string, imperativeConfig: IImperativeConfig, loggingConfig: IConfigLogging, key: string): IConfigLogging {
        return LoggingConfigurer.configureLoggerByKey(home, imperativeConfig, loggingConfig, key, "appLogging");
    }

    /**
     * Configures log4js console appender from imperative config
     * @private
     * @static
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @param {IConfigLogging} loggingConfig - log4js config
     * @param {string} key - keys within log4js appenders (like the appenders "imperative" key or categories "imperative" key)
     * @memberof LoggingConfigurer
     */
    // private static configureConsoleLogger(imperativeConfig: IImperativeConfig, loggingConfig: IConfigLogging, key: string): IConfigLogging {
    //     return LoggingConfigurer.configureLoggerByKey(imperativeConfig, loggingConfig, key, "consoleLogging");
    // }

    /**
     * Configures log4js appenders from imperative config
     * @private
     * @static
     * @param {string} home - home directory
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @param {IConfigLogging} loggingConfig - log4js config
     * @param {string} entryKey - keys within log4js appenders (like the appenders "imperative" key or categories "imperative" key)
     * @param {string} configKey - keys within IImperativeLogsConfig (like imperativeLogging)
     * @memberof LoggingConfigurer
     */
    private static configureLoggerByKey(
        home: string, imperativeConfig: IImperativeConfig, loggingConfig: IConfigLogging, entryKey: string, configKey: string) {
        if (imperativeConfig?.logging?.[configKey] != null) {
            loggingConfig = LoggingConfigurer.configureLoggerByKeyHelper(
                home, imperativeConfig.logging[configKey], loggingConfig, entryKey, configKey);
        }

        return loggingConfig;
    }

    /**
     * Common method to configure log4js appenders via imperative config
     * @private
     * @static
     * @param {string} home - home directory
     * @param {IImperativeLoggingConfig} impLogConfig
     * @param {IConfigLogging} loggingConfig - imperative main config
     * @param {string} entryKey - imperative key
     * @param {string} configKey -log4js key
     * @returns {IImperativeConfig} - populated config
     * @memberof LoggingConfigurer
     */
    private static configureLoggerByKeyHelper(home: string, impLogConfig: IImperativeLoggingConfig,
        loggingConfig: IConfigLogging, entryKey: string, configKey: string) {
        if (impLogConfig.logFile != null) {
            const fullLogFilePath = home +
                LoggingConfigurer.normalizeDir(impLogConfig.logFile);
            loggingConfig.log4jsConfig.appenders[entryKey].filename = fullLogFilePath as any;
        }
        if (impLogConfig.level != null) {
            Console.validateLevel(impLogConfig.level);
            loggingConfig.log4jsConfig.categories[entryKey].level = impLogConfig.level;
        }

        return loggingConfig;
    }

    /**
     * Build minimum imperative config for default supplied loggers
     * @private
     * @static
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @returns {IImperativeConfig} - populated config
     * @memberof LoggingConfigurer
     */
    private static buildLoggingDefaults(imperativeConfig: IImperativeConfig) {
        const imperativeId = Logger.DEFAULT_IMPERATIVE_NAME;
        imperativeConfig = LoggingConfigurer.buildImperativeLoggingDefaults(imperativeConfig, imperativeId);

        const appId = Logger.DEFAULT_APP_NAME;
        imperativeConfig = LoggingConfigurer.buildAppLoggingDefaults(imperativeConfig, appId);

        // const consoleId = Logger.DEFAULT_CONSOLE_NAME;
        // imperativeConfig = LoggingConfigurer.buildConsoleLoggingDefaults(imperativeConfig, consoleId);
        return imperativeConfig;
    }

    /**
     * Build minimum imperative config for default imperative logger
     * @private
     * @static
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @param {string} name - log4js name
     * @returns {IImperativeConfig} - populated config
     * @memberof LoggingConfigurer
     */
    private static buildImperativeLoggingDefaults(imperativeConfig: IImperativeConfig, name: string) {
        return LoggingConfigurer.buildLoggingDefaultsByKey(imperativeConfig, "imperativeLogging", name);
    }

    /**
     * Build minimum app config for default app logger
     * @private
     * @static
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @param {string} name - log4js name
     * @returns {IImperativeConfig} - populated config
     * @memberof LoggingConfigurer
     */
    private static buildAppLoggingDefaults(imperativeConfig: IImperativeConfig, name: string) {
        return LoggingConfigurer.buildLoggingDefaultsByKey(imperativeConfig, "appLogging", name);
    }

    /**
     * Build minimum console config for default console logger
     * @private
     * @static
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @param {string} name - imperative main config
     * @memberof LoggingConfigurer
     */
    // private static buildConsoleLoggingDefaults(imperativeConfig: IImperativeConfig, name: string) {
    //     return LoggingConfigurer.buildLoggingDefaultsByKey(imperativeConfig, "consoleLogging", name);
    // }

    /**
     * This method overrides any configuration of reserved loggers.
     * Build minimum console config for default console logger
     * @private
     * @static
     * @param {IImperativeConfig} imperativeConfig - imperative main config
     * @param {string} key - imperative main config
     * @param {string} apiName - imperative main config
     * @param {string} [category=apiName] - imperative main config
     * @returns {IImperativeConfig} - populated config
     * @memberof LoggingConfigurer
     */
    private static buildLoggingDefaultsByKey(
        imperativeConfig: IImperativeConfig, key: string, apiName: string, category = apiName): IImperativeConfig {
        if (imperativeConfig.logging == null) {
            imperativeConfig.logging = {};
            imperativeConfig.logging[key] = {apiName, category};
        } else {
            if (imperativeConfig.logging[key] == null) {
                imperativeConfig.logging[key] = {apiName, category};
            } else {
                imperativeConfig.logging[key].apiName = apiName;
                imperativeConfig.logging[key].category = category;
            }
        }
        return imperativeConfig;
    }

    /**
     * Normalize input file path for logs in the case that a user provides
     * redundant or missing file delimiters.
     * @private
     * @static
     * @param {string} file - normalized file
     * @returns {string} - normalized dir
     * @memberof LoggingConfigurer
     */
    private static normalizeDir(file: string): string {
        if (file[0] === "/" || file[0] === "\\") {
            return file;
        } else {
            return IO.FILE_DELIM + file;
        }
    }
}
