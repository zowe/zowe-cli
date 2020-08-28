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

import * as CoreUtils from "../../src/CoreUtils";

jest.mock("fs");
const fs = require("fs");
const chalk = require("chalk");

describe("CoreUtils", () => {
    const dummyString = "test";
    describe("padLeft", () => {
        it("should throw an error if we try to pad with 0 characters", () => {
            let result;
            let caughtError;
            try {
                result = CoreUtils.padLeft("", 1, "");
            } catch (e) {
                caughtError = e;
            }

            expect(result).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Specify at least one character");
        });

        it("should throw an error if we try to pad with more than one character", () => {
            let result;
            let caughtError;
            try {
                result = CoreUtils.padLeft("", 1, "hello");
            } catch (e) {
                caughtError = e;
            }

            expect(result).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Specify only one character");
        });

        it("should return the same string if the desired padding length is less than the current string", () => {
            let result;
            let caughtError;
            try {
                result = CoreUtils.padLeft(dummyString, 1);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual(dummyString);
        });

        it("should return the padded string with length equals to the given length", () => {
            let result;
            let caughtError;
            const finalLength = 5;
            try {
                result = CoreUtils.padLeft(dummyString, finalLength);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result.length).toEqual(finalLength);
            expect(result).toEqual(" " + dummyString);
        });
    });

    describe("trimLineToTerminalWidth", () => {
        // Need to mock this for the test
        const MOCK_STDOUT_COLUMNS = 80;

        // Preserve the real value so we can reset later
        const REAL_STDOUT_COLUMNS = process.stdout.columns;

        // This string is used for testing
        let customPadding: string;

        // Ensure that the columns property is valid (i.e. it meets the assumption)
        beforeAll(() => {
            process.stdout.columns = MOCK_STDOUT_COLUMNS;
            customPadding = CoreUtils.padLeft("", process.stdout.columns - 1, "~");
        });

        afterAll(() => {
            process.stdout.columns = REAL_STDOUT_COLUMNS;
        });

        /**
         * NOTE:
         *  'trimLine' will not trim the string if the terminal width is less than the ellipsis length (e.g. 3)
         *  No need to test this since there are some unknowns as to what will happen if we try to "resize" the stdout of the terminal on-the-fly
         *
         * ASSUMPTION:
         *  'process.stdout.columns' will always be at least 5 ("five") characters long
         */

        it("should not trim the string if its length is less than the terminal width", () => {
            let result;
            let caughtError;
            try {
                result = CoreUtils.trimLineToTerminalWidth(dummyString);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual(dummyString);
        });

        it("should not trim the string if Unicode character don't affect the width", () => {
            let result;
            let caughtError;
            const testingStr = `${chalk.red("`")}${customPadding.slice(0, -1 * (chalk.red("  ").length / 2))}`;
            try {
                result = CoreUtils.trimLineToTerminalWidth(testingStr);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();

            // This demonstrates that the testing string is actually longer than the terminal width but the string won't get trimmed
            expect(testingStr.length).toBeGreaterThan(process.stdout.columns);
            expect(result).toEqual(testingStr);
        });

        it("should trim the string if its length is greater that the terminal width regardless of Unicode characters", () => {
            const ellipsisLength = 3;
            const testStr = dummyString + customPadding;
            const testStrTabs = dummyString + "\t" + customPadding.slice(0, -1);

            // Test without TABS \t
            let result;
            let caughtError;
            try {
                result = CoreUtils.trimLineToTerminalWidth(testStr);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual(dummyString + customPadding.slice(0, -1 * (dummyString.length + ellipsisLength)) + "...");

            // Test with TABS \t
            caughtError = undefined;
            try {
                result = CoreUtils.trimLineToTerminalWidth(testStrTabs);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual(dummyString + " " + customPadding.slice(0, -1 * (dummyString.length + ellipsisLength + 1)) + "...");
        });
    });

    describe("getErrorContext", () => {
        const dummyFileName = "dummyFile";
        const dummyFilePath = "./path/to/" + dummyFileName;
        const dummyFileContent = "test\nwith\r\nmultiple\nlines\r\njust\nbecause\r\nwe\nneed\r\nmore\nthan\r\nten\nlines";
        const actualFileContent = dummyFileContent.split(/\r?\n/);
        const MOCK_FILE_INFO = {
            [dummyFilePath]: dummyFileContent
        };

        beforeEach(() => {
            fs.__setMockFiles(MOCK_FILE_INFO);
        });

        // Need to mock this for the test
        const MOCK_STDOUT_COLUMNS = 80;

        // Preserve the real value so we can reset later
        const REAL_STDOUT_COLUMNS = process.stdout.columns;

        // Ensure that the columns property is valid (i.e. it meets the assumption)
        beforeAll(() => {
            process.stdout.columns = MOCK_STDOUT_COLUMNS;
        });

        afterAll(() => {
            process.stdout.columns = REAL_STDOUT_COLUMNS;
        });

        it("should return an empty string if the line index of the error is less than 0", () => {
            let result;
            let caughtError;
            try {
                result = CoreUtils.getErrorContext(dummyString, -1);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual("");
        });

        it("should throw an error if the file is not found", () => {
            let result;
            let caughtError;
            try {
                result = CoreUtils.getErrorContext(dummyFilePath + "WRONG", 0);
            } catch (e) {
                caughtError = e;
            }

            expect(result).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toEqual(`File ${dummyFilePath}WRONG not found!`);
        });

        it("should output the correct lines when reading from an array", () => {
            let result;
            let caughtError;
            try {
                result = CoreUtils.getErrorContext(actualFileContent, 0);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual(`\n > ${chalk.red(1)} |  ${actualFileContent[0]}\n   2 |  ${actualFileContent[1]}`);
        });

        it("should output only the actual and the next line if linIndex point to the first line", () => {
            let result;
            let caughtError;
            try {
                result = CoreUtils.getErrorContext(dummyFilePath, 0);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual(`\n > ${chalk.red(1)} |  ${actualFileContent[0]}\n   2 |  ${actualFileContent[1]}`);
        });

        it("should output only the previous and the actual line if linIndex points to the last line", () => {
            let result;
            let caughtError;
            const fileLines = actualFileContent.length;
            try {
                result = CoreUtils.getErrorContext(dummyFilePath, fileLines - 1);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual(`\n   ${fileLines - 1} |  ${actualFileContent[fileLines - 2]}` +
                `\n > ${chalk.red(fileLines)} |  ${actualFileContent[fileLines - 1]}`);
        });

        it("should output three lines (before, current, after) and add padding to the line numbers if needed", () => {
            let result;
            let caughtError;

            // Test printing lines 8, 9 and 10 (#9 being the error)
            // Lines 8 and nine should be indented by one space since #10 adds an extra "column"
            const linePad = 8;

            try {
                result = CoreUtils.getErrorContext(dummyFilePath, linePad);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(result).toBeDefined();
            expect(result).toEqual(`\n    ${linePad} |  ${actualFileContent[linePad - 1]}` +
                `\n > ${chalk.red(" " + (linePad + 1).toString())} |  ${actualFileContent[linePad]}` +
                `\n   ${linePad + 2} |  ${actualFileContent[linePad + 1]}`);
        });
    });

    describe("sleep", () => {
        it("should sleep the default amount", async () => {
            const defaultSleepTime = 1000;

            jest.useFakeTimers();

            const waitForSleep = CoreUtils.sleep();

            jest.advanceTimersByTime(defaultSleepTime);

            expect(setTimeout).toHaveBeenCalledTimes(1);
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), defaultSleepTime);

            // If the sleep has finished then waiting for it will resolve immediately.
            // If not then the test will timeout
            await waitForSleep;
        });

        it("should sleep for the specified amount", async () => {
            const specifiedTime = 5000;

            jest.useFakeTimers();

            const waitForSleep = CoreUtils.sleep(specifiedTime);

            jest.advanceTimersByTime(specifiedTime);

            expect(setTimeout).toHaveBeenCalledTimes(1);
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), specifiedTime);

            // If the sleep has finished then waiting for it will resolve immediately.
            // If not then the test will timeout
            await waitForSleep;
        });
    });

    describe("asyncPool", () => {
        it("should allow the execution of many promises in a pool ", async () => {
            const numbers = [1, 1, 1, 1, 1];
            const poolSize = 2;
            let sum = 0;
            const createPromiseFunction = (numberToAdd: number) => {
                return new Promise((resolve, reject) => {
                    sum += numberToAdd;
                    resolve();
                });
            };
            await CoreUtils.asyncPool(poolSize, numbers, createPromiseFunction);
            expect(sum).toEqual(numbers.length);
        });

        it("should reject if any of the promises in the pool reject ", async () => {
            const numbers = [1, 1, -1, 1, 1];
            const poolSize = 2;
            let sum = 0;
            const createPromiseFunction = (numberToAdd: number) => {
                return new Promise((resolve, reject) => {
                    if (numberToAdd > 0) {
                        sum += numberToAdd;
                        resolve();
                    }
                    else {
                        reject(new Error("Number can't be negative"));
                    }
                });
            };
            let err: Error;
            try {
                await CoreUtils.asyncPool(poolSize, numbers, createPromiseFunction);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toContain("negative");
        });
    });
});
