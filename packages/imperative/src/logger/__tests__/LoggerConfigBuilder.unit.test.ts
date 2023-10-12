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

import { LoggerConfigBuilder } from "../../logger";

import * as os from "os";
import * as path from "path";

const fakeHome = "./someHome";

describe("LoggerConfigBuilder tests", () => {
    beforeAll(() => {
        jest.spyOn(os, "homedir").mockReturnValue("./someHome");
        jest.spyOn(path, "normalize").mockImplementation((p: string) => p);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("Should get a basic log4js configuration from getDefaultIConfigLogging", () => {
        expect(LoggerConfigBuilder.getDefaultIConfigLogging()).toMatchSnapshot();
    });

    it("Should add console appender to basic log4js configuration", () => {
        const config = LoggerConfigBuilder.getDefaultIConfigLogging();
        const testKey = "sampleConsole";
        expect(config).toMatchSnapshot();
    });

    it("Should add file appender to basic log4js configuration", () => {
        let config = LoggerConfigBuilder.getDefaultIConfigLogging();
        const testKey = "sampleFile";
        config = LoggerConfigBuilder.addFileAppender(config, testKey);
        expect(config).toMatchSnapshot();
    });

    it("Should add a console and file appender to basic log4js configuration", () => {
        let config = LoggerConfigBuilder.getDefaultIConfigLogging();
        const fileKey = "sampleFile";
        const consoleKey = "sampleConsole";
        config = LoggerConfigBuilder.addFileAppender(config, fileKey);
        config = LoggerConfigBuilder.addConsoleAppender(config, consoleKey);
        expect(config).toMatchSnapshot();
    });

    it("Should multiple appenders to basic log4js configuration", () => {
        let config = LoggerConfigBuilder.getDefaultIConfigLogging();
        const file1Key = "sampleFile1";
        const file2Key = "sampleFile2";
        const console1Key = "sampleConsole1";
        const console2Key = "sampleConsole2";
        config = LoggerConfigBuilder.addFileAppender(config, file1Key);
        config = LoggerConfigBuilder.addFileAppender(config, file2Key);
        config = LoggerConfigBuilder.addConsoleAppender(config, console1Key);
        config = LoggerConfigBuilder.addConsoleAppender(config, console2Key);
        expect(config).toMatchSnapshot();
    });

    it("Should use getDefaultFileName to append the Imperative CLI home to a passed-in file path", () => {
        const testFile = "test";
        const result = "/" + testFile + "/logs/" + testFile + ".log";
        const builtPath = LoggerConfigBuilder.getDefaultFileName(testFile);
        expect(builtPath).toBe(result);
    });

    it("Should use buildFullLogFile to append the Imperative CLI home to a passed-in file path", () => {
        const testFile = "test.log";
        const result = fakeHome + testFile;
        const builtPath = LoggerConfigBuilder.buildFullLogFile(testFile);
        expect(builtPath).toBe(result);
    });

});
