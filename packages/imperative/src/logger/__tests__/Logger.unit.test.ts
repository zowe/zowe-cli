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

jest.mock("log4js");
jest.mock("fs");
import * as log4js from "log4js";
import { LoggingConfigurer } from "../../imperative/src/LoggingConfigurer";
import { IConfigLogging, ILog4jsConfig, Logger } from "../../logger";
import { LoggerManager } from "../../logger/src/LoggerManager";

import { ImperativeError } from "../../error";

import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { IO } from "../../io";

describe("Logger tests", () => {
    const fakeHome = "/home";
    const name = "sample";
    //
    // // This needs to be mocked before running process function of uninstall handler
    // (Logger as any).writeToLog = jest.fn<string>((data: string) => data);

    beforeAll(() => {
        let configuration: ILog4jsConfig;
        (log4js.configure as any) = jest.fn((config: any) => {
            configuration = config;
        });

        class MockedLoggerInstance {
            private mLevel: string;

            public set level(newLevel: any) {
                this.mLevel = newLevel;
            }

            public get level(): any {
                return this.mLevel;
            }
        }

        (log4js.getLogger as any) = jest.fn((category: string) => {
            let configuredLevel = "debug";
            if (category !== null) {
                for (const configuredCategory of Object.keys(configuration.categories)) {
                    if (configuredCategory === category) {
                        configuredLevel = configuration.categories[configuredCategory].level;
                    }
                }
            }
            const newLogger = new MockedLoggerInstance();
            newLogger.level = configuredLevel;
            return newLogger;
        }
        );

        jest.spyOn(os, "homedir").mockImplementation(() => fakeHome);
        jest.spyOn(path, "normalize").mockImplementation((p: string) => p);
        jest.spyOn(IO, "createDirsSync").mockImplementation();
    });

    afterEach(() => {
        (LoggerManager as any).mInstance = null;
        jest.restoreAllMocks();
    });

    it("Should call underlying service function", () => {

        const config = LoggingConfigurer.configureLogger(fakeHome, {name});
        const logger = Logger.initLogger(config);

        (logger as any).logService.trace = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.info = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.debug = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.warn = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.error = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.fatal = jest.fn<string, any>((data: string) => data);

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
        const expectedSize = 6;
        Logger.setLogInMemory(true);

        logger.trace("test");
        logger.info("test");
        logger.debug("test");
        logger.warn("test");
        logger.error("test");
        logger.fatal("test");

        expect(LoggerManager.instance.QueuedMessages.length).toBe(expectedSize);
    });

    it("Should error if not given a config on initialization", () => {
        const expectMessage = "Input logging config document is required";
        let errorMessage = "";
        try {
            Logger.initLogger(undefined);
        } catch (error) {
            errorMessage = error.message;
        }
        expect(errorMessage).toBe(expectMessage);
    });

    it("Should error if given an incomplete config on initialization", () => {
        const expectMessage = "Input logging config is incomplete, does not contain log4jsConfig";
        let errorMessage = "";
        try {
            Logger.initLogger({});
        } catch (error) {
            errorMessage = error.message;
        }
        expect(errorMessage).toBe(expectMessage);
    });

    it("Should error if given a partially config on initialization", () => {
        const expectMessage = "Input logging config is incomplete, does not contain log4jsConfig.appenders";
        let errorMessage = "";
        try {
            const config = {log4jsConfig: {}};
            Logger.initLogger((config as IConfigLogging));
        } catch (error) {
            errorMessage = error.message;
        }
        expect(errorMessage).toBe(expectMessage);
    });

    it("Should set the level like we say", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {name});
        const logger = Logger.initLogger(config);
        const level = logger.level;

        expect((level as any).toUpperCase()).toMatchSnapshot();
        logger.level = "trace";
        expect((logger.level as any).toUpperCase()).toMatchSnapshot();
    });

    it("Should call underlying services for logError function", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {name});
        const logger = Logger.initLogger(config);

        (logger as any).logService.trace = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.info = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.debug = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.warn = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.error = jest.fn<string, any>((data: string) => data);
        (logger as any).logService.fatal = jest.fn<string, any>((data: string) => data);

        const error = new ImperativeError({msg: "sample error"});

        logger.logError(error);

        expect((logger as any).logService.trace).not.toHaveBeenCalled();
        expect((logger as any).logService.info).not.toHaveBeenCalled();
        expect((logger as any).logService.debug).toHaveBeenCalled();
        expect((logger as any).logService.warn).not.toHaveBeenCalledTimes(1);
        expect((logger as any).logService.fatal).not.toHaveBeenCalled();
        expect((logger as any).logService.error).toHaveBeenCalledTimes(2);
    });

    it("Should get the correct requested logger appender", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {
            logging: {
                appLogging: {
                    level: "trace"
                },
                imperativeLogging: {
                    level: "error"
                }
            },
            name
        });
        Logger.initLogger(config);

        const imperative = Logger.getImperativeLogger();
        const imperativeCategory = Logger.getLoggerCategory("imperative");
        const app = Logger.getAppLogger();
        const console = Logger.getConsoleLogger();

        // these should match config
        expect((imperative.level as any).toUpperCase()).toMatchSnapshot();
        expect((app.level as any).toUpperCase()).toMatchSnapshot();

        // this should be identical to imperative
        expect((imperative.level as any).toUpperCase()).toBe((imperativeCategory.level as any).toUpperCase());
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
        expect(LoggerManager.instance.QueuedMessages[0].message.toString()).toContain(message1);

        appLogger.debug(message2);
        expect(LoggerManager.instance.QueuedMessages.length).toBe(2);
        expect(LoggerManager.instance.QueuedMessages[0].message.toString()).toContain(message2);
        expect(LoggerManager.instance.QueuedMessages[1].message.toString()).toContain(message1);
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
        expect(LoggerManager.instance.QueuedMessages[0].message.toString()).toContain(message1);

        appLogger.debug(message2);
        expect(LoggerManager.instance.QueuedMessages.length).toBe(1);
    });

    it("Should allow check if log level value is valid", () => {
        expect(Logger.isValidLevel("TRACE")).toBeTruthy();
        expect(Logger.isValidLevel("bad value")).toBeFalsy();
        expect(Logger.isValidLevel(" ")).toBeFalsy();
        expect(Logger.isValidLevel(null)).toBeFalsy();
        expect(Logger.isValidLevel(undefined)).toBeFalsy();
    });

    it("Should support writing all of the message in memory to file", () => {
        const logger = Logger.getImperativeLogger();
        const expectedSize = 6;
        Logger.setLogInMemory(true);

        logger.trace("test");
        logger.info("test");
        logger.debug("test");
        logger.warn("test");
        logger.error("test");
        logger.fatal("test");

        expect(LoggerManager.instance.QueuedMessages.length).toBe(expectedSize);

        (fs as any).appendFileSync = jest.fn();
        Logger.writeInMemoryMessages("testing.txt");
        expect(fs.appendFileSync).toHaveBeenCalledTimes(expectedSize);
    });

});
