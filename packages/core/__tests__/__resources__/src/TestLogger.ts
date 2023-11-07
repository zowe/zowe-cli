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

import * as path from "path";

import { LoggerConfigBuilder } from "../../../src/logger/LoggerConfigBuilder";
import { Logger } from "../../../src/logger/Logger";
import { IConfigLogging } from "../../../src/logger/doc/IConfigLogging";

/**
 * Logger for unit/integration tests. Creates file appenders based on the name of the test file to segregate the
 * output of each test file for easier correlation to the report.
 */
export class TestLogger {
    /**
     * Log to the console - automatically appends a new line.
     * @static
     * @param {string} message
     * @memberof TestLogger
     */
    public static log(message: string) {
        process.stdout.write(message + "\n");
    }

    /**
     * Simple pass-thru to info. Removes the requirement for the caller to invoke getTestLogger().
     * @param {string} message - The info message to log.
     * @param args - any additional arguments for substitution, etc.
     */
    public static info(message: string, ...args: any[]) {
        TestLogger.getTestLogger().info(message, ...args);
    }

    /**
     * Simple pass-thru to debug. Removes the requirement for the caller to invoke getTestLogger().
     * @param {string} message - The debug message to log.
     * @param args - any additional arguments for substitution, etc.
     */
    public static debug(message: string, ...args: any[]) {
        TestLogger.getTestLogger().debug(message, args);
    }

    /**
     * Simple pass-thru to error. Removes the requirement for the caller to invoke getTestLogger().
     * @param {string} message - The error message to log.
     * @param args - any additional arguments for substitution, etc.
     */
    public static error(message: string, ...args: any[]) {
        TestLogger.getTestLogger().error(message, ...args);
    }

    /**
     * Simple pass-thru to trace. Removes the requirement for the caller to invoke getTestLogger().
     * @param {string} message - The trace message to log.
     * @param args - any additional arguments for substitution, etc.
     */
    public static trace(message: string, ...args: any[]) {
        TestLogger.getTestLogger().trace(message, ...args);
    }

    /**
     * Simple pass-thru to warn. Removes the requirement for the caller to invoke getTestLogger().
     * @param {string} message - The warn message to log.
     * @param args - any additional arguments for substitution, etc.
     */
    public static warn(message: string, ...args: any[]) {
        TestLogger.getTestLogger().warn(message, ...args);
    }

    /**
     * @static
     * @param {any} [loggerFileName=TestLogger.getCallersFile()]
     * @returns {Logger}
     * @memberof TestLogger
     */
    public static getTestLogger(loggerFileName = TestLogger.getCallersFile()): Logger {
        if (TestLogger.testLogger != null) {
            const categoryLogger: Logger = Logger.getLoggerCategory(loggerFileName);
            categoryLogger.level = "trace";
            if (categoryLogger == null) {
                const logFile: string = TestLogger.constructTestLogFile(loggerFileName);
                LoggerConfigBuilder.addFileAppender(LoggerConfigBuilder.getDefaultIConfigLogging(),
                    loggerFileName, loggerFileName, logFile);
                const returnLogger: Logger = Logger.getLoggerCategory(loggerFileName);
                returnLogger.level = "trace";
                return returnLogger;
            } else {
                return categoryLogger;
            }
        } else {
            TestLogger.initLogger(loggerFileName);
            const testLogger: Logger = TestLogger.testLogger;
            testLogger.level = "trace";
            return testLogger;
        }
    }

    private static testLogger: Logger;

    private static constructTestLogFile(loggerFileName: string): string {
        return "__tests__/__results__/log/" + loggerFileName + ".log";
    }

    private static initLogger(loggerFileName: string) {
        Logger.initLogger(TestLogger.getDefaultConfig(loggerFileName.split(" ").join("_")));
        TestLogger.testLogger = Logger.getLoggerCategory(loggerFileName);
    }

    private static getDefaultConfig(loggerFileName: string): IConfigLogging {
        const logFile: string = TestLogger.constructTestLogFile(loggerFileName);
        return LoggerConfigBuilder.addFileAppender(LoggerConfigBuilder.getDefaultIConfigLogging(),
            loggerFileName, "default", logFile);
    }

    private static getCallersFile(): string {
        const stack: string[] = new Error().stack.split("\n");
        const currentFileName: string = path.basename(__filename);
        stack.splice(0, 1);
        for (const entry of stack) {
            const removeCloseParen: string = entry.split(")").join("");
            const strip: string[] = removeCloseParen.split("(");
            if (strip.length >= 2) {
                const filePathWithLineNums: string = strip[1];
                const fileNameWithLineNums: string = path.basename(filePathWithLineNums);
                const fileName: string = fileNameWithLineNums.split(":")[0];
                if (fileName.indexOf(".spec.") >= 0 || fileName.indexOf(".test.") >= 0) {
                    return fileName;
                }
            }
        }
        return "default_log_file";
    }
}
