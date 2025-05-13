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

import { format, inspect } from "util";
import { ImperativeError } from "../../error/src/ImperativeError";
import * as StackTrace from "stack-trace";
import * as path from "path";
import { TextUtils } from "../../utilities/src/TextUtils";
import { IO } from "../../io";
import { IConfigLogging } from "./doc/IConfigLogging";
import { LoggerManager } from "./LoggerManager";
import * as log4js from "log4js";
import * as winston from "winston";
import { customLevels, log4jsConfigToWinstonConfig } from "./log4jsToWinston";
import { Console, ConsoleLevels } from "../../console/src/Console";
import { Censor } from "../../censor";
import { IQueuedMessage } from "./doc/IQueuedMessage";

/**
 * Note(Kelosky): it seems from the log4js doc that you only get a single
 * instance of log4js per category.  To reconfigure, you should "shutdown" logger.
 */
export class Logger {
    public static readonly DEFAULT_IMPERATIVE_NAME = "imperative";
    public static readonly DEFAULT_APP_NAME = "app";
    public static readonly DEFAULT_CONSOLE_NAME = "console";
    public static readonly DEFAULT_VALID_LOG_LEVELS = ["ALL", "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL", "MARK", "OFF"];

    /**
     * Get accessibility to logging service to invoke log calls, e.g
     * Logger.getLogger.info("important log info goes here");
     * @param {string} category - category of logger to obtain
     * @return {Logger} - instance of logger set to our app's category
     */
    public static getLoggerCategory(category: string) {
        if (category === Logger.DEFAULT_CONSOLE_NAME) {
            return new Logger(new Console(), Logger.DEFAULT_CONSOLE_NAME);
        } else if (winston.loggers.has(category)) {
            return new Logger(winston.loggers.get(category));
        } else {
            return new Logger(log4js.getLogger(category), category);
        }
    }

    /**
     * Get accessibility to logging service to invoke log calls, e.g
     * Logger.getLogger.info("important log info goes here");
     * @return {Logger} - instance of logger set to our app's category
     */
    public static getImperativeLogger() {
        return Logger.getLoggerCategory(Logger.DEFAULT_IMPERATIVE_NAME);
    }

    /**
     * Get log4js instance directed at our app's category.
     * @return {Logger} - instance of logger set to our app's category
     */
    public static getAppLogger() {
        return Logger.getLoggerCategory(Logger.DEFAULT_APP_NAME);
    }

    public static setLogInMemory(status: boolean, maxQueueSize?: number) {
        LoggerManager.instance.logInMemory = status;

        if (maxQueueSize != null) {
            LoggerManager.instance.maxQueueSize = maxQueueSize;
        }
    }

    /**
     * Write all messages that was stored in memory to the input file.
     * @param {string} file - destination file name
     */
    public static writeInMemoryMessages(file: string) {
        LoggerManager.instance.dumpQueuedMessages(file);
    }

    /**
     * Test if the input level is a valid value for Log4js.
     * @param {string} testLevel - input level to be tested
     * @returns {boolean} - status if the input level is valid
     */
    public static isValidLevel(testLevel: string): boolean {
        let status: boolean = false;
        if (testLevel != null &&
            Logger.DEFAULT_VALID_LOG_LEVELS.indexOf(testLevel.toUpperCase()) > -1) {
            status = true;
        }
        return status;
    }

    /**
     * Return an instance to the console logger which applies TextUtils invoked
     * through this Logger class.
     *
     * Note(Kelosky): this is not the same as obtaining a new Console() directly,
     * since we can make use of the internationalization and other routines
     * within this Logger class via this implementation.
     *
     * @return {Logger} - instance of logger set to our app's category
     */
    public static getConsoleLogger() {
        return Logger.getLoggerCategory(Logger.DEFAULT_CONSOLE_NAME);
    }

    /**
     * Initializes a Logger powered by log4js, given a configuration.
     * @param  {IConfigLogging} loggingConfig The log4js configuration to use
     * @return {Logger} A new logger instance
     */
    public static initLogger(loggingConfig: IConfigLogging) {
        if (loggingConfig == null) {
            throw new ImperativeError({msg: "Input logging config document is required"});
        }

        if (loggingConfig.log4jsConfig == null) {
            throw new ImperativeError({msg: "Input logging config is incomplete, does not contain log4jsConfig"});
        }

        if (loggingConfig.log4jsConfig.appenders == null) {
            throw new ImperativeError({msg: "Input logging config is incomplete, does not contain log4jsConfig.appenders"});
        }

        let logger: log4js.Logger;

        try {
            for (const appenderName of Object.keys(loggingConfig.log4jsConfig.appenders)) {
                const appender = loggingConfig.log4jsConfig.appenders[appenderName];
                if (appender.type === "file" || appender.type === "fileSync") {
                    IO.createDirsSyncFromFilePath(appender.filename);
                }
            }
            log4js.configure(loggingConfig.log4jsConfig as any);
            logger = log4js.getLogger();
            logger.level = "debug";
            LoggerManager.instance.isLoggerInit = true;
            return new Logger(logger);
        } catch (err) {
            const cons = new Console();
            cons.error("Couldn't make desired logger: %s", inspect(err));
            return new Logger(cons);
        }
    }

    /**
     * Creates an instance of a Logger powered by Winston, based on a log4js config.
     * @param  {IConfigLogging} loggingConfig The log4js configuration to use
     * @return {Logger} A new logger instance           
     */
    public static fromLog4jsToWinston(loggingConfig: IConfigLogging) {
        if (loggingConfig == null) {
            throw new ImperativeError({msg: "Input logging config document is required"});
        }

        if (loggingConfig.log4jsConfig == null) {
            throw new ImperativeError({msg: "Input logging config is incomplete, does not contain log4jsConfig"});
        }

        // log4js doc: When defining your appenders through a configuration, at least one category must be defined.
        if (loggingConfig.log4jsConfig.appenders == null || loggingConfig.log4jsConfig.categories == null ||
            Object.keys(loggingConfig.log4jsConfig.categories).length === 0) {
            throw new ImperativeError({msg: "Input logging config is incomplete, does not contain log4jsConfig.appenders or log4jsConfig.categories"});
        }

        try {
            for (const appenderName of Object.keys(loggingConfig.log4jsConfig.appenders)) {
                const appender = loggingConfig.log4jsConfig.appenders[appenderName];
                if (
                    typeof appender === "object" &&
                    appender !== null &&
                    "type" in appender &&
                    (appender.type === "file" || appender.type === "fileSync") &&
                    "filename" in appender
                ) {
                    IO.createDirsSyncFromFilePath(appender.filename);
                }
            }

            let newLoggerInst: winston.Logger | undefined;

            // Process categories to create specific logger configurations
            if (loggingConfig.log4jsConfig.categories) {
                for (const categoryName of Object.keys(loggingConfig.log4jsConfig.categories)) {
                    const catConfig = loggingConfig.log4jsConfig.categories[categoryName];
                    const categoryLevel = (catConfig?.level || "info").toLowerCase(); // Default to info if level not specified
                    const categoryAppenders = catConfig?.appenders ?? [];

                    // Generate a Winston config specifically for this category's appenders and level
                    const categoryWinstonConfig = log4jsConfigToWinstonConfig(
                        loggingConfig.log4jsConfig, // Pass the full original config for appender lookup
                        categoryLevel,
                        categoryAppenders
                    );

                    // Add custom levels to the generated config
                    categoryWinstonConfig.levels = customLevels.levels;

                    // Add the logger with its specific configuration
                    winston.loggers.add(categoryName, categoryWinstonConfig);
                    newLoggerInst = winston.loggers.get(categoryName);
                }
            }
            LoggerManager.instance.isLoggerInit = true;

            // Return the new logger instance if built, otherwise fallback to an available logger
            if (newLoggerInst) {
                return new Logger(newLoggerInst);
            } else {
                // Fallback if new logger wasn't created or initialization failed
                // First try the app winston logger, then the imperative winston logger - use a new console instance as last resort
                const fallbackLogger = winston.loggers.get(Logger.DEFAULT_APP_NAME) ??
                                       winston.loggers.get(Logger.DEFAULT_IMPERATIVE_NAME) ??
                                       new Console();
                return new Logger(fallbackLogger);
            }
        } catch (err) {
            const cons = new Console();
            cons.error("Couldn't make desired logger: %s", inspect(err));
            return new Logger(cons);
        }
    }

    /**
     * Creates a new Logger instance from a given Winston configuration.
     * @param {winston.LoggerOptions} config - The Winston logger configuration options.
     * @param {string} [category] - Optional category name for the logger.
     * @returns {Logger} A new Logger instance.
     */
    public static fromWinstonConfig(config: winston.LoggerOptions, category?: string): Logger {
        try {
            // Add custom levels to the provided config
            const configWithCustomLevels = { ...config, levels: customLevels.levels };
            const winstonLogger = winston.createLogger(configWithCustomLevels);

            // Optionally register the logger if a category is provided and categories are managed
            if (category && configWithCustomLevels.levels && configWithCustomLevels.level) {
                if (!winston.loggers.has(category)) {
                    winston.loggers.add(category, configWithCustomLevels);
                }
                // Ensure the created logger instance reflects the specified level for the category
                winstonLogger.level = configWithCustomLevels.level;
            }
            return new Logger(winstonLogger, category);
        } catch (err) {
            // Fallback or error handling, potentially log using a default console logger
            const cons = new Console();
            cons.error("Failed to create logger from Winston config: %s", inspect(err));
            // Return a console logger as a fallback
            return new Logger(cons, category ?? Logger.DEFAULT_CONSOLE_NAME);
        }
    }

    /**
     * This flag is being used to monitor the logger configure status.
     */
    private initStatus: boolean;

    constructor(private mJsLogger: log4js.Logger | winston.Logger | Console, private category?: string) {
        if (LoggerManager.instance.isLoggerInit && LoggerManager.instance.QueuedMessages.length > 0) {
            LoggerManager.instance.QueuedMessages.slice().reverse().forEach((value: IQueuedMessage<Exclude<ConsoleLevels, "off">>) => {
                if (this.category === value.category) {
                    mJsLogger.log(value.method, value.message);
                    LoggerManager.instance.QueuedMessages.splice(LoggerManager.instance.QueuedMessages.indexOf(value), 1);
                }
            });
        }

        this.initStatus = LoggerManager.instance.isLoggerInit;
    }

    // TODO: Can we find trace info for TypeScript to have e.g.  [ERROR] Jobs.ts : 43 - Error encountered

    /**
     * Log a message at the "trace" level
     *  Example: 'Entering cheese testing'
     * @param message - printf style template string, or a plain string message
     * @param args - printf style args
     * @returns {any}
     */
    public trace(message: string, ...args: any[]): string {
        const finalMessage = TextUtils.formatMessage.apply(this, [message].concat(args));
        if (LoggerManager.instance.isLoggerInit || this.category === Logger.DEFAULT_CONSOLE_NAME) {
            this.logService.log("trace", this.getCallerFileAndLineTag() + finalMessage);
        } else {
            LoggerManager.instance.queueMessage(this.category, "trace", this.getCallerFileAndLineTag() + finalMessage);
        }

        return finalMessage;
    }

    /**
     * Log a message at the "debug" level
     *  Example: 'Got cheese'
     * @param message - printf  or mustache style template string, or a plain string message
     * @param args - printf or mustache style args
     * @returns {any}
     */
    public debug(message: string, ...args: any[]): string {
        const finalMessage = Censor.censorRawData(TextUtils.formatMessage.apply(this, [message].concat(args)), this.category);
        if (LoggerManager.instance.isLoggerInit || this.category === Logger.DEFAULT_CONSOLE_NAME) {
            this.logService.debug(this.getCallerFileAndLineTag() + finalMessage);
        } else {
            LoggerManager.instance.queueMessage(this.category, "debug", this.getCallerFileAndLineTag() + finalMessage);
        }

        return finalMessage;
    }

    /**
     * Log a message at the "info" level
     *  Example: 'Cheese is Gouda'
     * @param message - printf or mustache style template string, or a plain string message
     * @param args - printf or mustache style args
     * @returns {any}
     */
    public info(message: string, ...args: any[]): string {
        const finalMessage = Censor.censorRawData(TextUtils.formatMessage.apply(this, [message].concat(args)), this.category);
        if (LoggerManager.instance.isLoggerInit || this.category === Logger.DEFAULT_CONSOLE_NAME) {
            this.logService.info(this.getCallerFileAndLineTag() + finalMessage);
        } else {
            LoggerManager.instance.queueMessage(this.category, "info", this.getCallerFileAndLineTag() + finalMessage);
        }

        return finalMessage;
    }

    /**
     * Log a message at the "warn" level
     *  Example: 'Cheese is quite smelly.'
     * @param message - printf or mustache style template string, or a plain string message
     * @param args - printf  or mustache style args
     * @returns {any}
     */
    public warn(message: string, ...args: any[]): string {
        const finalMessage = Censor.censorRawData(TextUtils.formatMessage.apply(this, [message].concat(args)), this.category);
        if (LoggerManager.instance.isLoggerInit || this.category === Logger.DEFAULT_CONSOLE_NAME) {
            this.logService.warn(this.getCallerFileAndLineTag() + finalMessage);
        } else {
            LoggerManager.instance.queueMessage(this.category, "warn", this.getCallerFileAndLineTag() + finalMessage);
        }
        return finalMessage;
    }

    /**
     * Log a message at the "error" level
     *  Example: 'Cheese is too ripe!'
     * @param message - printf or mustache style template string, or a plain string message
     * @param args - printf or mustache style args
     * @returns {any}
     */
    public error(message: string, ...args: any[]): string {
        const finalMessage = Censor.censorRawData(TextUtils.formatMessage.apply(this, [message].concat(args)), this.category);
        if (LoggerManager.instance.isLoggerInit || this.category === Logger.DEFAULT_CONSOLE_NAME) {
            this.logService.error(this.getCallerFileAndLineTag() + finalMessage);
        } else {
            LoggerManager.instance.queueMessage(this.category, "error", this.getCallerFileAndLineTag() + finalMessage);
        }
        return finalMessage;
    }

    /**
     * Log a message at the "fatal" level
     *  Example: 'Cheese was breeding ground for listeria.'
     * @param message - printf or mustache style template string, or a plain string message
     * @param args - printf  or mustache style args
     * @returns {any}
     */
    public fatal(message: string, ...args: any[]): string {
        const finalMessage = Censor.censorRawData(TextUtils.formatMessage.apply(this, [message].concat(args)), this.category);
        if (LoggerManager.instance.isLoggerInit || this.category === Logger.DEFAULT_CONSOLE_NAME) {
            this.logService.log("fatal", this.getCallerFileAndLineTag() + finalMessage);
        } else {
            LoggerManager.instance.queueMessage(this.category, "fatal", this.getCallerFileAndLineTag() + finalMessage);
        }
        return finalMessage;
    }

    /**
     * Log a message without CallerFileAndLineTag
     *  Example: 'Cheese that is plain'
     * @param message - printf or mustache style template string, or a plain string message
     * @param args - printf or mustache style args
     * @returns {any}
     */
    public simple(message: string, ...args: any[]): string {
        const finalMessage = Censor.censorRawData(TextUtils.formatMessage.apply(this, [message].concat(args)), this.category);
        if (LoggerManager.instance.isLoggerInit || this.category === Logger.DEFAULT_CONSOLE_NAME) {
            this.logService.info(finalMessage);
        } else {
            LoggerManager.instance.queueMessage(this.category, "info", finalMessage);
        }
        return finalMessage;
    }

    /**
     * Log an Imperative error, including any optional fields if present
     * @param {ImperativeError} err - the error to log
     */
    public logError(err: ImperativeError): void {
        this.debug("Stack at time of error logging: %s", new Error().stack);

        if (!(err.details.additionalDetails == null)) {
            this.error(err.details.additionalDetails);
        }
        if (!(err.stack == null)) {
            this.error(err.stack);
        }
        if (!(err.details.causeErrors == null) && !(err.details.causeErrors.length == null)
            && err.details.causeErrors.length > 0) {
            for (const cause of err.details.causeErrors) {
                this.error("Cause error:\n%s", inspect(cause));
            }
        }
        this.error(err.message);

    }

    /**
     * translate a message if possible
     * @param message - original message to translate, possibly with printf or {{obj}} style template
     * @param args  - varargs to use to translate / format
     * @returns {string} translated or replaced result
     */
    // public translate(message: string, ...args: any[]): string {
    //     let result: string;
    //     let translationError: Error;
    //     try {
    //         result = i18n.__.apply(global, [message].concat(args));
    //     } catch (e) {
    //         result = undefined;
    //         translationError = e;
    //     }
    //     if (isNullOrUndefined(result)) {
    //         if (translationError) {
    //             this.logService.warn("Error while translating!\n%s", inspect(translationError));
    //         }
    //         result = TextUtils.formatMessage(message, ...args);
    //     }
    //     return result;
    // }

    /**
     * Obtain .js file name and line number which issued the log message.
     * NOTE(Kelosky): Consensus seems to be that this may produce a lot of overhead
     * by creating an Error and obtaining stack information for EVERY log message
     * that is issued.
     *
     * There are also packages available to obtain the appropriate line number.
     *
     * Perhaps when a package pops up that gives the appropriate .ts line number
     * and file name, we'll remove usage of this method.
     * @returns {string} - file and line number
     */
    private getCallerFileAndLineTag(): string {
        try {
            const frame: StackTrace.StackFrame[] = StackTrace.parse(new Error());
            let callerStackIndex = 1;
            while (!frame[callerStackIndex].getFileName() || frame[callerStackIndex].getFileName().indexOf(path.basename(__filename)) >= 0) {
                // go up the stack until we're outside of the Zowe Logger file
                callerStackIndex += 1;
            }
            const filename = path.basename(frame[callerStackIndex].getFileName());
            const lineNumber = frame[callerStackIndex].getLineNumber();
            return format("[%s:%s] ", filename, lineNumber);
        } catch(e) {
            return "[<unknown>] ";
        }
    }

    /**
     * Allow for programmatic adjustments to the logger
     * @param {string} level - new level to set
     */
    set level(level: string) {
        // Update the level of the current logger instance
        this.logService.level = level;

        // If this is a Winston logger, update the level on the registered transports
        if (this.logService instanceof winston.Logger) {
            for (const transport of this.logService.transports) {
                transport.level = level;
            }
        }
    }

    /**
     * Get current level setting
     * @return {string} - level of current log setting
     */
    get level() {
        return this.logService.level.toString().toUpperCase();
    }

    /**
     * Get underlying logger service
     *
     * This function also check to see if log4js is configured since the last time it
     * was called.  If yes, then update the logger with to leverage the new configuration.
     */
    private get logService() {
        if (this.initStatus !== LoggerManager.instance.isLoggerInit) {
            const newLogger = Logger.getLoggerCategory(this.category);
            this.mJsLogger = newLogger.mJsLogger;
            this.initStatus = newLogger.initStatus;
        }

        return this.mJsLogger;
    }

    /**
     * Set underlying logger service
     */
    private set logService(service: log4js.Logger | winston.Logger | Console) {
        this.mJsLogger = service;
    }
}
