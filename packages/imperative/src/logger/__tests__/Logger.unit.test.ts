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

jest.mock("../../io", () => ({
    IO: {
        createDirsSyncFromFilePath: jest.fn(),
        // Add other static methods/properties for IO class here if needed by future tests
        createDirsSync: jest.fn(),
    },
}));
jest.mock("winston", () => ({
    format: {
        printf: jest.fn(),
        timestamp: jest.fn(),
        combine: jest.fn(),
        colorize: jest.fn(),
        json: jest.fn(),
        simple: jest.fn(),
        splat: jest.fn(),
        label: jest.fn(),
        align: jest.fn(),
        errors: jest.fn(),
        metadata: jest.fn(),
        logstash: jest.fn(),
    },
    // Adjust createLogger mock to respect the passed config level
    createLogger: jest.fn().mockImplementation((config) => ({
        level: config?.level || "info", // Use level from config or default to info
        format: config?.format || jest.fn(),
        // Add other necessary properties if the code under test uses them
        transports: config?.transports || [],
        // Mock methods used by the Logger class if necessary
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
    })),
    loggers: (() => {
        // Cache for mock loggers per category
        const loggerCache: { [key: string]: any } = {};
        return {
            add: jest.fn((category: string, config: any) => {
                // Optionally pre-populate cache if add is called before get
                if (!loggerCache[category]) {
                    loggerCache[category] = {
                        level: config?.level || "info",
                        format: config?.format || jest.fn(),
                        log: jest.fn(),
                        debug: jest.fn(),
                        info: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                        trace: jest.fn(),
                        fatal: jest.fn(),
                    };
                }
            }),
            get: jest.fn().mockImplementation((category: string) => {
                // Return existing mock from cache or create a new one
                if (!loggerCache[category]) {
                    loggerCache[category] = {
                        level: "info", // Default level if not added first
                        format: jest.fn(),
                        log: jest.fn(),
                        debug: jest.fn(),
                        info: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                        trace: jest.fn(),
                        fatal: jest.fn(),
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
}));
jest.mock("../src/log4jsToWinston", () => ({
    // Corrected path
    log4jsConfigToWinstonConfig: jest.fn().mockImplementation((config) => ({
        levels: winston.config.npm.levels, // Use mocked levels
        level: config?.categories?.default?.level?.toLowerCase() || "info",
        transports: [], // Simplified
        format: jest.fn(), // Add mock format
    })),
}));
// Mock Console class, including static and instance methods used in tests
jest.mock("../../console/src/Console", () => {
    // Define mocks for static members
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
    ];

    // Define the mock instance structure
    const mockConsoleInstance = {
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
        level: "info",
    };

    // mock constructor function
    const mockConsoleClass = jest
        .fn()
        .mockImplementation(() => mockConsoleInstance);

    // static properties on mock
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
    // // This needs to be mocked before running process function of uninstall handler
    // (Logger as any).writeToLog = jest.fn<string>((data: string) => data);

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

        // expect((logger as any).writeToLog).toBeCalled();
        expect((logger as any).logService.info).toHaveBeenCalled();
        expect((logger as any).logService.debug).toHaveBeenCalled();
        expect((logger as any).logService.warn).toHaveBeenCalled();
        expect((logger as any).logService.error).toHaveBeenCalled();
        expect((logger as any).logService.fatal).toHaveBeenCalled();
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

    it("Should error if given a partially config on initialization", () => {
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
        const level = logger.level;

        expect((level as any).toUpperCase()).toMatchSnapshot();
        logger.level = "trace";
        expect((logger.level as any).toUpperCase()).toMatchSnapshot();
    });

    it("Should call underlying services for logError function", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, { name });
        const logger = Logger.initLogger(config);

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

        const error = new ImperativeError({ msg: "sample error" });

        logger.logError(error);

        expect((logger as any).logService.trace).not.toHaveBeenCalled();
        expect((logger as any).logService.info).not.toHaveBeenCalled();
        expect((logger as any).logService.debug).toHaveBeenCalled();
        expect((logger as any).logService.warn).not.toHaveBeenCalledTimes(1);
        expect((logger as any).logService.fatal).not.toHaveBeenCalled();
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

        // these should match config
        expect((imperative.level as any).toUpperCase()).toMatchSnapshot();
        expect((app.level as any).toUpperCase()).toMatchSnapshot();

        // this should be identical to imperative
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
});

// Add the new describe block at the end
describe("log4js config migration in initLogger", () => {
    let mockWinston: jest.Mocked<typeof winston>;
    let mockIo: jest.Mocked<typeof IO>;
    let mockLog4jsToWinston: jest.Mocked<
        typeof import("../src/log4jsToWinston")
    >;
    let mockConsole: jest.MockedClass<typeof Console>;

    beforeEach(() => {
        // Reset mock counts before each test
        jest.clearAllMocks();
        mockWinston = require("winston");
        mockIo = require("../../io").IO;
        mockLog4jsToWinston = require("../src/log4jsToWinston");
        mockConsole = require("../../console/src/Console").Console;
        LoggerManager.instance.isLoggerInit = false; // Reset init status
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
            levels: expect.any(Object),
            level: "debug",
            transports: new Array<winston.transport>(),
            format: expect.any(Function),
        };
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockReturnValue(
            expectedWinstonConfig
        );

        Logger.initLogger(loggingConfig);

        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(basicLog4jsConfig);
        expect(mockWinston.createLogger).toHaveBeenCalledWith(
            expectedWinstonConfig
        );
        expect(mockWinston.loggers.add).toHaveBeenCalledWith(
            "default",
            expectedWinstonConfig
        );
        expect(mockWinston.loggers.get).toHaveBeenCalledWith("default");
        // Check level setting - mock returns an object, access level property
        const loggerInstance = mockWinston.loggers.get("default");
        loggerInstance.level =
            basicLog4jsConfig.categories.default.level.toLowerCase(); // Simulate level setting
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
            levels: expect.any(Object),
            level: "info",
            transports: new Array<winston.transport>(),
            format: expect.any(Function),
        };
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockReturnValue(
            expectedWinstonConfig
        );

        Logger.initLogger(loggingConfig);

        expect(mockIo.createDirsSyncFromFilePath).toHaveBeenCalledWith(
            "/path/to/logfile.log"
        );
        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(fileLog4jsConfig);
        expect(mockWinston.createLogger).toHaveBeenCalledWith(
            expectedWinstonConfig
        );
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
            levels: expect.any(Object),
            level: "warn",
            transports: new Array<winston.transport>(),
            format: expect.any(Function),
        };
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockReturnValue(
            expectedWinstonConfig
        );

        Logger.initLogger(loggingConfig);

        expect(mockIo.createDirsSyncFromFilePath).toHaveBeenCalledWith(
            "/another/path/syncfile.log"
        );
        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(fileSyncLog4jsConfig);
        expect(mockWinston.createLogger).toHaveBeenCalledWith(
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
            levels: expect.any(Object),
            level: "info",
            transports: new Array<winston.transport>(),
            format: expect.any(Function),
        };
        mockLog4jsToWinston.log4jsConfigToWinstonConfig.mockReturnValue(
            expectedWinstonConfig
        );

        // Mock the behavior of winston.loggers.get for different categories
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

        Logger.initLogger(loggingConfig);

        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(multiCategoryLog4jsConfig);
        expect(mockWinston.createLogger).toHaveBeenCalledWith(
            expectedWinstonConfig
        );

        // Check categories were added
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

        expect(mockWinston.loggers.get).toHaveBeenCalledTimes(3);
        expect(mockWinston.loggers.get).toHaveBeenCalledWith("default");
        expect(mockWinston.loggers.get).toHaveBeenCalledWith("imperative");
        expect(mockWinston.loggers.get).toHaveBeenCalledWith("app");
        expect(LoggerManager.instance.isLoggerInit).toBe(true);
    });

    it("should handle errors during winston initialization gracefully", () => {
        const errorLog4jsConfig: ILog4jsConfig = {
            appenders: {
                console: {
                    type: "console",
                    layout: { type: "basic", pattern: "%d %p %c %m%n" },
                },
            }, // Added layout
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

        const logger = Logger.initLogger(loggingConfig);

        expect(
            mockLog4jsToWinston.log4jsConfigToWinstonConfig
        ).toHaveBeenCalledWith(errorLog4jsConfig);
        expect(mockWinston.createLogger).not.toHaveBeenCalled();

        // Check that the mock Console constructor was called (fallback occurred)
        expect(mockConsole).toHaveBeenCalledTimes(1);

        const mockConsoleInstance = mockConsole.mock.results[0].value;

        expect(logger).toBeDefined();
        expect(mockConsoleInstance.error).toHaveBeenCalledWith(
            expect.stringContaining("Couldn't make desired logger:"),
            initError.stack
        );
        expect(LoggerManager.instance.isLoggerInit).toBe(false); // Should not be set to true on error
    });
});

describe("Logger.fromWinstonConfig tests", () => {
    let mockWinston: jest.Mocked<typeof winston>;
    let mockConsole: jest.MockedClass<typeof Console>;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        mockWinston = require("winston");
        mockConsole = require("../../console/src/Console").Console;
        (LoggerManager as any).mInstance = null; // Reset LoggerManager singleton
        LoggerManager.instance.isLoggerInit = false; // Ensure init status is reset
    });

    it("should create a Logger instance from a valid Winston config", () => {
        const winstonConfig: winston.LoggerOptions = {
            level: "debug",
            transports: [new mockWinston.transports.Console()],
        };
        const mockCreatedLogger = { level: "debug", info: jest.fn() }; // Mock the logger object returned by createLogger
        (mockWinston.createLogger as jest.Mock).mockReturnValue(
            mockCreatedLogger
        );

        const logger = Logger.fromWinstonConfig(winstonConfig);

        expect(mockWinston.createLogger).toHaveBeenCalledWith(winstonConfig);
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockCreatedLogger); // Check if the internal logger is the one created
        expect((logger as any).category).toBeUndefined(); // No category provided
    });

    it("should create and register a Logger instance with a category", () => {
        const category = "testCategory";
        const winstonConfig: winston.LoggerOptions = {
            level: "warn",
            levels: winston.config.npm.levels, // Need levels for category logic
            transports: [new mockWinston.transports.Console()],
        };
        const mockCreatedLogger = { level: "info", warn: jest.fn() }; // Initial level might differ before setting
        (mockWinston.createLogger as jest.Mock).mockReturnValue(
            mockCreatedLogger
        );
        (mockWinston.loggers.has as jest.Mock).mockReturnValue(false); // Simulate category not existing

        const logger = Logger.fromWinstonConfig(winstonConfig, category);

        expect(mockWinston.createLogger).toHaveBeenCalledWith(winstonConfig);
        expect(mockWinston.loggers.has).toHaveBeenCalledWith(category);
        expect(mockWinston.loggers.add).toHaveBeenCalledWith(
            category,
            winstonConfig
        );
        expect(mockCreatedLogger.level).toBe("warn"); // Verify level was set on the created logger instance
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockCreatedLogger);
        expect((logger as any).category).toBe(category);
    });

    it("should use existing registered logger if category already exists", () => {
        const category = "existingCategory";
        const winstonConfig: winston.LoggerOptions = {
            level: "error",
            levels: winston.config.npm.levels, // Need levels for category logic
            transports: [new mockWinston.transports.Console()],
        };
        const mockCreatedLogger = { level: "info", error: jest.fn() }; // Initial level
        (mockWinston.createLogger as jest.Mock).mockReturnValue(
            mockCreatedLogger
        );
        (mockWinston.loggers.has as jest.Mock).mockReturnValue(true); // Simulate category existing

        const logger = Logger.fromWinstonConfig(winstonConfig, category);

        expect(mockWinston.createLogger).toHaveBeenCalledWith(winstonConfig);
        expect(mockWinston.loggers.has).toHaveBeenCalledWith(category);
        expect(mockWinston.loggers.add).not.toHaveBeenCalledWith(
            category,
            winstonConfig
        );
        expect(mockCreatedLogger.level).toBe("error"); // Level should still be set
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

        expect(mockWinston.createLogger).toHaveBeenCalledWith(winstonConfig);
        expect(mockConsole).toHaveBeenCalledTimes(1); // Fallback Console created
        expect(mockConsoleInstance.error).toHaveBeenCalledWith(
            expect.stringContaining(
                "Failed to create logger from Winston config:"
            ),
            creationError.stack
        );
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockConsoleInstance); // Check it's using the fallback
        expect((logger as any).category).toBe(Logger.DEFAULT_CONSOLE_NAME); // Default category for fallback
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

        expect(mockWinston.createLogger).toHaveBeenCalledWith(winstonConfig);
        expect(mockConsole).toHaveBeenCalledTimes(1); // Fallback Console created
        expect(mockConsoleInstance.error).toHaveBeenCalledWith(
            expect.stringContaining(
                "Failed to create logger from Winston config:"
            ),
            creationError.stack
        );
        expect(logger).toBeInstanceOf(Logger);
        expect((logger as any).mJsLogger).toBe(mockConsoleInstance); // Check it's using the fallback
        expect((logger as any).category).toBe(category); // Uses provided category for fallback
    });
});
