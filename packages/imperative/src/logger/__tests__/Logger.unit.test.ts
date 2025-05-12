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

jest.mock("fs");
import { LoggingConfigurer } from "../../imperative/src/LoggingConfigurer";
import { IConfigLogging, ILog4jsConfig, Logger } from "../../logger";
import { LoggerManager } from "../../logger/src/LoggerManager";
import * as winston from "winston";

import { ImperativeError } from "../../error";
import { Console } from "../../console/src/Console";

import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { IO } from "../../io";
import * as dayjs from "dayjs";
import { defaultPrintfFormat } from "../src/log4jsToWinston";

jest.mock("../../io", () => ({
    IO: {
        createDirsSyncFromFilePath: jest.fn(),
        createDirsSync: jest.fn(),
    },
}));

const customLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    mark: 4,
    debug: 5,
    trace: 6,
    all: 7,
};

jest.mock("winston", () => ({
    addColors: jest.requireActual("winston").addColors,
    format: jest.requireActual("winston").format,

    createLogger: jest.fn().mockImplementation((config) => ({
        level: config?.level || "info",
        levels: config?.levels || customLevels,
        format: config?.format || jest.fn(),

        transports: config?.transports || [],

        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
        mark: jest.fn(),
    })),
    loggers: (() => {
        const loggerCache: { [key: string]: any } = {};
        return {
            add: jest.fn((category: string, config: any) => {
                loggerCache[category] = {
                    level: config?.level || "info",
                    levels: config?.levels || customLevels,
                    format: config?.format || jest.fn(),
                    log: jest.fn(),
                    debug: jest.fn(),
                    info: jest.fn(),
                    warn: jest.fn(),
                    error: jest.fn(),
                    trace: jest.fn(),
                    fatal: jest.fn(),
                    mark: jest.fn(),
                };
            }),
            get: jest.fn().mockImplementation((category: string) => {
                if (!loggerCache[category]) {
                    loggerCache[category] = {
                        level: "info",
                        levels: customLevels,
                        format: jest.fn(),
                        log: jest.fn(),
                        debug: jest.fn(),
                        info: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                        trace: jest.fn(),
                        fatal: jest.fn(),
                        mark: jest.fn(),
                    };
                }
                return loggerCache[category];
            }),
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            trace: jest.fn(),
            has: jest
                .fn()
                .mockImplementation(
                    (category: string) => loggerCache[category] != null
                ),
        };
    })(),
    transports: {
        Console: jest.fn().mockImplementation(() => ({ format: jest.fn() })),
        File: jest.fn().mockImplementation(() => ({ format: jest.fn() })),
    },
    config: {
        npm: {
            levels: {
                fatal: 0,
                error: 1,
                warn: 2,
                info: 3,
                verbose: 4,
                debug: 5,
                silly: 6,
            },
        },
    },
    Logger: jest.requireActual("winston").Logger,
}));
jest.mock("../src/log4jsToWinston", () => {
    return {
        ...jest.requireActual("../src/log4jsToWinston"),
        log4jsConfigToWinstonConfig: jest
            .fn()
            .mockImplementation((_log4jsConfig, level, _includeAppenders) => ({
                levels: customLevels,
                level: level || "info",
                transports: [],
                format: jest.fn(),
            })),
    };
});

jest.mock("../../console/src/Console", () => {
    const mockStaticValidateLevel = jest.fn();
    const mockStaticIsValidLevel = jest.fn().mockReturnValue(true);
    const mockStaticLEVELS = [
        "trace",
        "debug",
        "info",
        "warn",
        "error",
        "fatal",
        "off",
        "mark",
    ];

    const mockConsoleInstance = {
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
        mark: jest.fn(),
        level: "info",
    };

    const mockConsoleClass = jest
        .fn()
        .mockImplementation(() => mockConsoleInstance);

    Object.assign(mockConsoleClass, {
        validateLevel: mockStaticValidateLevel,
        isValidLevel: mockStaticIsValidLevel,
        LEVELS: mockStaticLEVELS,
    });

    return {
        Console: mockConsoleClass,
    };
});

describe("Logger tests", () => {
    const fakeHome = "/home";
    const name = "sample";
    //

    beforeAll(() => {
        jest.spyOn(os, "homedir").mockImplementation(() => fakeHome);
        jest.spyOn(path, "normalize").mockImplementation((p: string) => p);
    });

    afterEach(() => {
        (LoggerManager as any).mInstance = null;
        jest.restoreAllMocks();
    });

    it("Should call underlying service function", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, { name });
        const logger = Logger.initLogger(config);

        (logger as any).logService.log = jest.fn<string, any>(
            (level: string, data: string) => data
        );
        (logger as any).logService.trace = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.info = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.debug = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.warn = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.error = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.fatal = jest.fn<string, any>(
            (data: string) => data
        );

        logger.trace("message");
        logger.info("test");
        logger.debug("test");
        logger.warn("test");
        logger.error("test");
        logger.fatal("test");

        expect((logger as any).logService.log).toHaveBeenCalledWith(
            "trace",
            expect.any(String)
        );
        expect((logger as any).logService.info).toHaveBeenCalled();
        expect((logger as any).logService.debug).toHaveBeenCalled();
        expect((logger as any).logService.warn).toHaveBeenCalled();
        expect((logger as any).logService.error).toHaveBeenCalled();
        expect((logger as any).logService.log).toHaveBeenCalledWith(
            "fatal",
            expect.any(String)
        );
    });

    it("Should allow all service function to store message in memory", () => {
        const logger = Logger.getImperativeLogger();
        const expectedSize = 7;
        Logger.setLogInMemory(true);

        logger.trace("test");
        logger.info("test");
        logger.debug("test");
        logger.warn("test");
        logger.error("test");
        logger.fatal("test");
        logger.simple("test");

        expect(LoggerManager.instance.QueuedMessages.length).toBe(expectedSize);
    });

    it("Should error if not given a config on initialization", () => {
        const expectMessage = "Input logging config document is required";
        let errorMessage = "";
        try {
            Logger.initLogger(undefined as any);
        } catch (error) {
            errorMessage = error.message;
        }
        expect(errorMessage).toBe(expectMessage);
    });

    it("Should error if given an incomplete config on initialization", () => {
        const expectMessage =
            "Input logging config is incomplete, does not contain log4jsConfig";
        let errorMessage = "";
        try {
            Logger.initLogger({});
        } catch (error) {
            errorMessage = error.message;
        }
        expect(errorMessage).toBe(expectMessage);
    });

    it("Should error if given a config with no appenders on initialization", () => {
        const expectMessage =
            "Input logging config is incomplete, does not contain log4jsConfig.appenders";
        let errorMessage = "";
        try {
            const config = { log4jsConfig: {} };
            Logger.initLogger(config as IConfigLogging);
        } catch (error) {
            errorMessage = error.message;
        }
        expect(errorMessage).toBe(expectMessage);
    });

    it("Should set the level like we say", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, { name });
        const logger = Logger.initLogger(config);

        expect(logger.level.toUpperCase()).toMatchSnapshot();
        logger.level = "trace";
        expect(logger.level.toUpperCase()).toMatchSnapshot();
    });

    it("Should call underlying services for logError function", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, { name });
        const logger = Logger.initLogger(config);

        (logger as any).logService.log = jest.fn<string, any>(
            (_level: string, data: string) => data
        );
        (logger as any).logService.trace = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.info = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.debug = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.warn = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.error = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.fatal = jest.fn<string, any>(
            (data: string) => data
        );
        (logger as any).logService.simple = jest.fn<string, any>(
            (data: string) => data
        );

        (logger as any).logService.mark = jest.fn<string, any>(
            (data: string) => data
        );

        const error = new ImperativeError({ msg: "sample error" });

        logger.logError(error);

        expect((logger as any).logService.log).not.toHaveBeenCalledWith(
            "trace",
            expect.any(String)
        );
        expect((logger as any).logService.info).not.toHaveBeenCalled();
        expect((logger as any).logService.debug).toHaveBeenCalled();
        expect((logger as any).logService.warn).not.toHaveBeenCalledTimes(1);
        expect((logger as any).logService.log).not.toHaveBeenCalledWith(
            "fatal",
            expect.any(String)
        );
        expect((logger as any).logService.error).toHaveBeenCalledTimes(2);
        expect((logger as any).logService.simple).not.toHaveBeenCalled();
    });

    it("Should get the correct requested logger appender", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {
            logging: {
                appLogging: {
                    level: "trace",
                },
                imperativeLogging: {
                    level: "error",
                },
            },
            name,
        });
        Logger.initLogger(config);

        const imperative = Logger.getImperativeLogger();
        const imperativeCategory = Logger.getLoggerCategory("imperative");
        const app = Logger.getAppLogger();

        expect((imperative.level as any).toUpperCase()).toMatchSnapshot();
        expect((imperative as any).category).toBe(Logger.DEFAULT_IMPERATIVE_NAME);
        expect((app.level as any).toUpperCase()).toMatchSnapshot();
        expect((app as any).category).toBe(Logger.DEFAULT_APP_NAME);

        expect((imperative.level as any).toUpperCase()).toBe(
            (imperativeCategory.level as any).toUpperCase()
        );
    });

    it("Should allow enable logging in memory when logger is not configured", () => {
        const newQueueSize = 10;
        Logger.setLogInMemory(true, newQueueSize);
        expect(LoggerManager.instance.logInMemory).toBeTruthy();
        expect(LoggerManager.instance.maxQueueSize).toBe(newQueueSize);

        Logger.setLogInMemory(false);
        expect(LoggerManager.instance.logInMemory).toBeFalsy();
    });

    it("Should allow message to be queue in memory when logger is not configured", () => {
        const impLogger = Logger.getImperativeLogger();
        const appLogger = Logger.getAppLogger();
        const message1 = "test message 1";
        const message2 = "test message 2";

        Logger.setLogInMemory(true);

        impLogger.debug(message1);
        expect(LoggerManager.instance.QueuedMessages.length).toBe(1);
        expect(
            LoggerManager.instance.QueuedMessages[0].message.toString()
        ).toContain(message1);

        appLogger.debug(message2);
        expect(LoggerManager.instance.QueuedMessages.length).toBe(2);
        expect(
            LoggerManager.instance.QueuedMessages[0].message.toString()
        ).toContain(message2);
        expect(
            LoggerManager.instance.QueuedMessages[1].message.toString()
        ).toContain(message1);
    });

    it("Should not queue message in memory when logInMemory is disabled or already at max queue size", () => {
        const maxQueueSize = 1;
        const impLogger = Logger.getImperativeLogger();
        const appLogger = Logger.getAppLogger();
        const message1 = "test message 1";
        const message2 = "test message 2";

        Logger.setLogInMemory(false);

        impLogger.debug(message1);
        expect(LoggerManager.instance.QueuedMessages.length).toBe(0);
        appLogger.debug(message2);
        expect(LoggerManager.instance.QueuedMessages.length).toBe(0);

        Logger.setLogInMemory(true, maxQueueSize);
        impLogger.debug(message1);
        expect(LoggerManager.instance.QueuedMessages.length).toBe(1);
        expect(
            LoggerManager.instance.QueuedMessages[0].message.toString()
        ).toContain(message1);

        appLogger.debug(message2);
        expect(LoggerManager.instance.QueuedMessages.length).toBe(1);
    });

    it("Should allow check if log level value is valid", () => {
        expect(Logger.isValidLevel("TRACE")).toBeTruthy();
        expect(Logger.isValidLevel("bad value")).toBeFalsy();
        expect(Logger.isValidLevel(" ")).toBeFalsy();
        expect(Logger.isValidLevel(null as any)).toBeFalsy();
        expect(Logger.isValidLevel(undefined as any)).toBeFalsy();
    });

    it("Should support writing all of the message in memory to file", () => {
        const logger = Logger.getImperativeLogger();
        const expectedSize = 7;
        Logger.setLogInMemory(true);

        logger.trace("test");
        logger.info("test");
        logger.debug("test");
        logger.warn("test");
        logger.error("test");
        logger.fatal("test");
        logger.simple("test");

        expect(LoggerManager.instance.QueuedMessages.length).toBe(expectedSize);

        (fs as any).appendFileSync = jest.fn();
        Logger.writeInMemoryMessages("testing.txt");
        expect(fs.appendFileSync).toHaveBeenCalledTimes(expectedSize);
    });

    it("logService setter/getter should reflect new mJsLogger on a logger instance", () => {
        const consoleA = new Console();
        const consoleB = new Console();
        const logger = new Logger(consoleA);
        expect((logger as any).logService).toBe(consoleA);
        (logger as any).logService = consoleB;
        expect((logger as any).logService).toBe(consoleB);
    });
});

describe("log4jsToWinston tests", () => {
    let mockOs: jest.Mocked<typeof os>;
    let mockProcess: any;
    let mockLog4jsToWinston: jest.Mocked<
        typeof import("../src/log4jsToWinston")
    >;

    beforeEach(() => {
        jest.clearAllMocks();

        mockOs = require("os");
        jest.spyOn(mockOs, "hostname").mockReturnValue("mock-hostname");

        mockProcess = { pid: process.pid };

        mockLog4jsToWinston = require("../src/log4jsToWinston");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("defaultPrintfFormat", () => {
        it("should print the log message in format: [timestamp] [level] <message>", () => {
            expect(defaultPrintfFormat({ timestamp: "2023-10-27 10:00:00", level: "INFO", message: "Hello world" })).toBe("[2023-10-27 10:00:00] [INFO] Hello world");
        });
    });

    it("should translate log4js pattern with ISO8601_WITH_TZ_OFFSET date format", () => {
        const pattern = "%d{ISO8601_WITH_TZ_OFFSET} %p %m";
        const translatedFormat = (
            mockLog4jsToWinston as any
        ).translateLog4jsPattern(pattern);

        const info = {
            timestamp: "2023-10-27T10:00:00.000Z",
            level: "info",
            message: "test message",
        };
        const formattedMessage = translatedFormat.transform(info);

        const expectedTimestamp = dayjs(info.timestamp).format(
            "YYYY-MM-DDTHH:mm:ss.SSSZZ"
        );
        expect(
            formattedMessage[Object.getOwnPropertySymbols(formattedMessage)[0]]
        ).toBe(`${expectedTimestamp} INFO test message`);
    });

    it("should translate log4js pattern with custom date format", () => {
        const pattern = "%d{yyyy/MM/dd hh:mm:ss.SSS} %p %m";
        const translatedFormat = (
            mockLog4jsToWinston as any
        ).translateLog4jsPattern(pattern);

        const info = {
            timestamp: "2023-10-27T10:00:00.000",
            level: "debug",
            message: "another message",
        };
        const formattedMessage = translatedFormat.transform(info);

        expect(
            formattedMessage[Object.getOwnPropertySymbols(formattedMessage)[0]]
        ).toBe(`2023/10/27 10:00:00.000 DEBUG another message`);
    });

    it("should translate log4js pattern with multiple date tokens", () => {
        const pattern = "%d{yyyy-MM-dd} %d{hh:mm:ss} %p %m";
        const translatedFormat = (
            mockLog4jsToWinston as any
        ).translateLog4jsPattern(pattern);

        const info = {
            timestamp: "2023-10-27T10:00:00.000Z",
            level: "warn",
            message: "multiple dates",
        };
        const formattedMessage = translatedFormat.transform(info);
        const expectedTimestamp = dayjs(info.timestamp).format(
            "YYYY-MM-DD HH:mm:ss"
        );

        expect(
            formattedMessage[Object.getOwnPropertySymbols(formattedMessage)[0]]
        ).toBe(`${expectedTimestamp} WARN multiple dates`);
    });

    it("should translate log4js pattern with other tokens (%c, %h, %z, %n, %%)", () => {
        const pattern = "%c %h %z %% %p%n%m";
        const translatedFormat = (
            mockLog4jsToWinston as any
        ).translateLog4jsPattern(pattern);

        const info = {
            timestamp: "2023-10-27T10:00:00.000Z",
            level: "error",
            message: "other tokens",
            category: "my-category",
        };
        const formattedMessage = translatedFormat.transform(info);

        expect(
            formattedMessage[Object.getOwnPropertySymbols(formattedMessage)[0]]
        ).toBe(
            `my-category mock-hostname ${mockProcess.pid} % ERROR\nother tokens`
        );
    });

    it("should handle missing category in info object when %c is in pattern", () => {
        const pattern = "%c %m";
        const translatedFormat = (
            mockLog4jsToWinston as any
        ).translateLog4jsPattern(pattern);

        const info: any = {
            timestamp: "2023-10-27T10:00:00.000Z",
            level: "info",
            message: "no category",
        };
        const formattedMessage = translatedFormat.transform(info);

        expect(
            formattedMessage[Object.getOwnPropertySymbols(formattedMessage)[0]]
        ).toBe(`default no category`);
        expect(info.category).toBe("default");
    });

    it("should strip colorization tokens (%[ and %])", () => {
        const pattern = "%[%d %p%] %m";
        const translatedFormat = (
            mockLog4jsToWinston as any
        ).translateLog4jsPattern(pattern);

        const info = {
            timestamp: "2023-10-27T10:00:00.000",
            level: "info",
            message: "with colors",
        };
        const formattedMessage = translatedFormat.transform(info);

        expect(
            formattedMessage[Object.getOwnPropertySymbols(formattedMessage)[0]]
        ).toBe(`${info.timestamp} INFO with colors`);
    });

    it("should correctly identify objects with pattern layout using hasPatternLayout", () => {
        const objWithPatternLayout = {
            layout: { type: "pattern", pattern: "%m" },
        };
        const objWithoutLayout = {};
        const objWithDifferentLayout = { layout: { type: "basic" } };
        const objWithLayoutNoType = { layout: { pattern: "%m" } };
        const objWithLayoutNoPattern = { layout: { type: "pattern" } };
        const objWithLayoutNull: any = { layout: null };
        const objWithLayoutNotObject = { layout: "pattern" };
        const nullObj: any = null;
        const undefinedObj: any = undefined;

        const { hasPatternLayout } = require("../src/log4jsToWinston");

        expect(hasPatternLayout(objWithPatternLayout)).toBe(true);
        expect(hasPatternLayout(objWithoutLayout)).toBe(false);
        expect(hasPatternLayout(objWithDifferentLayout)).toBe(false);
        expect(hasPatternLayout(objWithLayoutNoType)).toBe(false);
        expect(hasPatternLayout(objWithLayoutNoPattern)).toBe(false);
        expect(hasPatternLayout(objWithLayoutNull)).toBe(false);
        expect(hasPatternLayout(objWithLayoutNotObject)).toBe(false);
        expect(hasPatternLayout(nullObj)).toBe(false);
        expect(hasPatternLayout(undefinedObj)).toBe(false);
    });

    it("should correctly identify appenders with a specific type using isAppenderWithType", () => {
        const appenderWithConsoleType = { type: "console" };
        const appenderWithFileType = { type: "file", filename: "log.log" };
        const appenderWithFileSyncType = {
            type: "fileSync",
            filename: "sync.log",
        };
        const appenderWithoutType = {};
        const appenderWithDifferentType = { type: "other" };
        const nullObj: any = null;
        const undefinedObj: any = undefined;

        const { isAppenderWithType } = require("../src/log4jsToWinston");

        expect(isAppenderWithType(appenderWithConsoleType, "console")).toBe(
            true
        );
        expect(isAppenderWithType(appenderWithFileType, "file")).toBe(true);
        expect(isAppenderWithType(appenderWithFileSyncType, "fileSync")).toBe(
            true
        );
        expect(isAppenderWithType(appenderWithConsoleType, "file")).toBe(false);
        expect(isAppenderWithType(appenderWithoutType, "console")).toBe(false);
        expect(isAppenderWithType(appenderWithDifferentType, "console")).toBe(
            false
        );
        expect(isAppenderWithType(nullObj, "console")).toBe(false);
        expect(isAppenderWithType(undefinedObj, "console")).toBe(false);
    });
});

describe("Logger.fromLog4jsToWinston", () => {
    let mockWinston: jest.Mocked<typeof winston>;
    let mockIo: jest.Mocked<typeof IO>;
    let mockLog4jsToWinston: jest.Mocked<
        typeof import("../src/log4jsToWinston")
    >;
    let mockConsole: jest.MockedClass<typeof Console>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockWinston = require("winston");
        mockIo = require("../../io").IO;
        mockLog4jsToWinston = require("../src/log4jsToWinston");
        mockConsole = require("../../console/src/Console").Console;
        LoggerManager.instance.isLoggerInit = false;
    });

    it("Should error if given a config with no categories on initialization", () => {
        const expectMessage =
            "Input logging config is incomplete, does not contain log4jsConfig.appenders or log4jsConfig.categories";
        let errorMessage = "";
        try {
            const config = { log4jsConfig: { appenders: {} } };
            Logger.fromLog4jsToWinston(config as IConfigLogging);
        } catch (error) {
            errorMessage = error.message;
        }
        expect(errorMessage).toBe(expectMessage);
    });

    it("should initialize winston with converted basic log4js config", () => {
        const basicLog4jsConfig: ILog4jsConfig = {
            appenders: {
                console: {
                    type: "console",
                    layout: { type: "basic", pattern: "%d %p %c %m%n" },
                },
            },
            categories: { default: { appenders: ["console"], level: "debug" } },
        };
        const loggingConfig: IConfigLogging = {
            log4jsConfig: basicLog4jsConfig,
        };

        const expectedWinstonConfig = {
            levels: customLevels,
            level: "debug",
            transports: new Array<winston.transport>(),
            format: expect.any(Function),
        };
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockReturnValue(
            expectedWinstonConfig
        );

        Logger.fromLog4jsToWinston(loggingConfig);

        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(basicLog4jsConfig, "debug", ["console"]);
        expect(mockWinston.loggers.add).toHaveBeenCalledWith(
            "default",
            expectedWinstonConfig
        );
        expect(mockWinston.loggers.get).toHaveBeenCalledWith("default");

        const loggerInstance = mockWinston.loggers.get("default");
        loggerInstance.level =
            basicLog4jsConfig.categories.default.level.toLowerCase();
        expect(loggerInstance.level).toBe("debug");
        expect(LoggerManager.instance.isLoggerInit).toBe(true);
    });

    it("should create directories for file appenders", () => {
        const fileLog4jsConfig: ILog4jsConfig = {
            appenders: {
                fileApp: {
                    type: "file",
                    filename: "/path/to/logfile.log",
                    layout: { type: "basic", pattern: "%d %p %c %m%n" },
                },
            },
            categories: { default: { appenders: ["fileApp"], level: "info" } },
        };
        const loggingConfig: IConfigLogging = {
            log4jsConfig: fileLog4jsConfig,
        };
        const expectedWinstonConfig = {
            levels: customLevels,
            level: "info",
            transports: new Array<winston.transport>(),
            format: expect.any(Function),
        };
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockReturnValue(
            expectedWinstonConfig
        );

        Logger.fromLog4jsToWinston(loggingConfig);

        expect(mockIo.createDirsSyncFromFilePath).toHaveBeenCalledWith(
            "/path/to/logfile.log"
        );
        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(fileLog4jsConfig, "info", ["fileApp"]);
        expect(LoggerManager.instance.isLoggerInit).toBe(true);
    });

    it("should handle fileSync appenders for directory creation", () => {
        const fileSyncLog4jsConfig: ILog4jsConfig = {
            appenders: {
                fileSyncApp: {
                    type: "fileSync",
                    filename: "/another/path/syncfile.log",
                    layout: { type: "basic", pattern: "%d %p %c %m%n" },
                },
            },
            categories: {
                default: { appenders: ["fileSyncApp"], level: "warn" },
            },
        };
        const loggingConfig: IConfigLogging = {
            log4jsConfig: fileSyncLog4jsConfig,
        };
        const expectedWinstonConfig = {
            levels: customLevels,
            level: "warn",
            transports: new Array<winston.transport>(),
            format: expect.any(Function),
        };
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockReturnValue(
            expectedWinstonConfig
        );

        Logger.fromLog4jsToWinston(loggingConfig);

        expect(mockIo.createDirsSyncFromFilePath).toHaveBeenCalledWith(
            "/another/path/syncfile.log"
        );
        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(fileSyncLog4jsConfig, "warn", ["fileSyncApp"]);
        expect(mockWinston.loggers.add).toHaveBeenCalledWith(
            "default",
            expectedWinstonConfig
        );
        expect(LoggerManager.instance.isLoggerInit).toBe(true);
    });

    it("should configure multiple categories with specific levels", () => {
        const multiCategoryLog4jsConfig: ILog4jsConfig = {
            appenders: {
                console: {
                    type: "console",
                    layout: { type: "basic", pattern: "%d %p %c %m%n" },
                },
            },
            categories: {
                default: { appenders: ["console"], level: "info" },
                imperative: { appenders: ["console"], level: "error" },
                app: { appenders: ["console"], level: "trace" },
            },
        };
        const loggingConfig: IConfigLogging = {
            log4jsConfig: multiCategoryLog4jsConfig,
        };
        const expectedWinstonConfig = {
            levels: customLevels,
            level: "info",
            transports: new Array<winston.transport>(),
            format: expect.any(Function),
        };
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockReturnValue(
            expectedWinstonConfig
        );

        const mockLoggers = (
            category: string
        ): { level: string; format: any } => ({
            level: multiCategoryLog4jsConfig.categories[
                category
            ].level.toLowerCase(),
            format: jest.fn(),
        });
        (mockWinston.loggers.get as jest.Mock).mockImplementation(
            (category: string) => mockLoggers(category)
        );

        Logger.fromLog4jsToWinston(loggingConfig);

        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(multiCategoryLog4jsConfig, "info", ["console"]);

        expect(mockWinston.loggers.add).toHaveBeenCalledWith(
            "default",
            expectedWinstonConfig
        );
        expect(mockWinston.loggers.add).toHaveBeenCalledWith(
            "imperative",
            expectedWinstonConfig
        );
        expect(mockWinston.loggers.add).toHaveBeenCalledWith(
            "app",
            expectedWinstonConfig
        );

        expect(mockWinston.loggers.get).toHaveBeenCalledTimes(1);
        expect(mockWinston.loggers.get).toHaveBeenCalledWith("default");
        expect(LoggerManager.instance.isLoggerInit).toBe(true);
    });

    it("should handle errors during winston initialization gracefully", () => {
        const errorLog4jsConfig: ILog4jsConfig = {
            appenders: {
                console: {
                    type: "console",
                    layout: { type: "basic", pattern: "%d %p %c %m%n" },
                },
            },
            categories: { default: { appenders: ["console"], level: "info" } },
        };
        const loggingConfig: IConfigLogging = {
            log4jsConfig: errorLog4jsConfig,
        };
        const initError = new Error("Winston init failed");
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockImplementation(
            () => {
                throw initError;
            }
        );

        const logger = Logger.fromLog4jsToWinston(loggingConfig);

        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(errorLog4jsConfig, "info", ["console"]);
        expect(mockWinston.createLogger).not.toHaveBeenCalled();

        expect(mockConsole).toHaveBeenCalledTimes(1);

        const mockConsoleInstance = mockConsole.mock.results[0].value;

        expect(logger).toBeDefined();
        expect(mockConsoleInstance.error).toHaveBeenCalledWith(
            expect.stringContaining("Couldn't make desired logger:"),
            initError.stack
        );
        expect(LoggerManager.instance.isLoggerInit).toBe(false);
    });
});

describe("Logger.fromWinstonConfig tests", () => {
    let mockWinston: jest.Mocked<typeof winston>;
    let mockConsole: jest.MockedClass<typeof Console>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockWinston = require("winston");
        mockConsole = require("../../console/src/Console").Console;
        (LoggerManager as any).mInstance = null;
        LoggerManager.instance.isLoggerInit = false;
    });

    it("should create a Logger instance from a valid Winston config", () => {
        const winstonConfig: winston.LoggerOptions = {
            level: "debug",
            levels: customLevels,
            transports: [new mockWinston.transports.Console()],
        };
        const mockCreatedLogger = { level: "debug", info: jest.fn() };
        (mockWinston.createLogger as jest.Mock).mockReturnValue(
            mockCreatedLogger
        );

        const logger = Logger.fromWinstonConfig(winstonConfig);

        expect(mockWinston.createLogger).toHaveBeenCalledWith(winstonConfig);
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockCreatedLogger);
        expect((logger as any).category).toBeUndefined();
    });

    it("should create and register a Logger instance with a category", () => {
        const category = "testCategory";
        const winstonConfig: winston.LoggerOptions = {
            level: "warn",
            levels: customLevels,
            transports: [new mockWinston.transports.Console()],
        };
        const mockCreatedLogger = { level: "info", warn: jest.fn() };
        (mockWinston.createLogger as jest.Mock).mockReturnValue(
            mockCreatedLogger
        );
        (mockWinston.loggers.has as jest.Mock).mockReturnValue(false);

        const logger = Logger.fromWinstonConfig(winstonConfig, category);

        expect(mockWinston.createLogger).toHaveBeenCalledWith(winstonConfig);
        expect(mockWinston.loggers.has).toHaveBeenCalledWith(category);
        expect(mockWinston.loggers.add).toHaveBeenCalledWith(
            category,
            winstonConfig
        );
        expect(mockCreatedLogger.level).toBe("warn");
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockCreatedLogger);
        expect((logger as any).category).toBe(category);
    });

    it("should use existing registered logger if category already exists", () => {
        const category = "existingCategory";
        const winstonConfig: winston.LoggerOptions = {
            level: "error",
            levels: customLevels,
            transports: [new mockWinston.transports.Console()],
        };
        const mockCreatedLogger = { level: "info", error: jest.fn() };
        (mockWinston.createLogger as jest.Mock).mockReturnValue(
            mockCreatedLogger
        );
        (mockWinston.loggers.has as jest.Mock).mockReturnValue(true);

        const logger = Logger.fromWinstonConfig(winstonConfig, category);

        expect(mockWinston.createLogger).toHaveBeenCalledWith(winstonConfig);
        expect(mockWinston.loggers.has).toHaveBeenCalledWith(category);
        expect(mockWinston.loggers.add).not.toHaveBeenCalledWith(
            category,
            winstonConfig
        );
        expect(mockCreatedLogger.level).toBe("error");
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockCreatedLogger);
        expect((logger as any).category).toBe(category);
    });

    it("should fall back to Console logger if winston.createLogger fails", () => {
        const winstonConfig: winston.LoggerOptions = { level: "info" };
        const creationError = new Error("Failed to create Winston logger");
        (mockWinston.createLogger as jest.Mock).mockImplementation(() => {
            throw creationError;
        });

        const mockConsoleInstance = new mockConsole();
        mockConsole.mockClear();

        const logger = Logger.fromWinstonConfig(winstonConfig);

        expect(mockWinston.createLogger).toHaveBeenCalledWith({
            ...winstonConfig,
            levels: customLevels,
        });
        expect(mockConsole).toHaveBeenCalledTimes(1);
        expect(mockConsoleInstance.error).toHaveBeenCalledWith(
            expect.stringContaining(
                "Failed to create logger from Winston config:"
            ),
            creationError.stack
        );
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockConsoleInstance);
        expect((logger as any).category).toBe(Logger.DEFAULT_CONSOLE_NAME);
    });

    it("should fall back to Console logger with specified category if winston.createLogger fails", () => {
        const category = "fallbackCategory";
        const winstonConfig: winston.LoggerOptions = { level: "info" };
        const creationError = new Error("Failed to create Winston logger");
        (mockWinston.createLogger as jest.Mock).mockImplementation(() => {
            throw creationError;
        });

        const mockConsoleInstance = new mockConsole();
        mockConsole.mockClear();

        const logger = Logger.fromWinstonConfig(winstonConfig, category);

        expect(mockWinston.createLogger).toHaveBeenCalledWith({
            ...winstonConfig,
            levels: customLevels,
        });
        expect(mockConsole).toHaveBeenCalledTimes(1);
        expect(mockConsoleInstance.error).toHaveBeenCalledWith(
            expect.stringContaining(
                "Failed to create logger from Winston config:"
            ),
            creationError.stack
        );
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockConsoleInstance);
        expect((logger as any).category).toBe(category);
    });
});
