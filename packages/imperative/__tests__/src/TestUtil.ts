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

// This class imports and exports a lot of code that is used throughout a lot of the tests.
// It's ugly but makes it easier to write new tests without  needing to have a long list of imports in each file.
// Unfortunately it's not possible to import all of the names as is, so try:
//  import * as T from "../TestUtil";
//  and then using each of its fields like T.readSync, expect, and so on.
/**
 * Module imports for TestUtils and testing infrastructure
 */
import * as spawn from "cross-spawn";
import { SpawnSyncReturns } from "child_process";
import { inspect, isArray, isNullOrUndefined, isString } from "util";
import { Constants } from "../../packages/constants";
import { ICommandResponse } from "../../packages/cmd";
import { ICompareParms } from "./doc/ICompareParms";
import { TestLogger } from "../TestLogger";
import * as nodePath from "path";
import { mkdirpSync } from "fs-extra";
import * as fs from "fs";
import { randomBytes } from "crypto";

/**
 * Requires for non-typed.
 */
const yargs = require("yargs").argv;
const yaml = require("js-yaml");
const diff = require("deep-diff").diff;
const uuidv4 = require("uuid/v4");

/**
 * Exports for usage in tests
 */
export { resolve, basename, dirname } from "path";


export const rimraf = (dir: string) => {

    const rimrafExecutable = __dirname + "/../../node_modules/rimraf/bin.js";
    const rimrafProcess = spawn.sync("node", [rimrafExecutable, dir]);
    if (rimrafProcess.status !== 0) {
        throw new Error("Error deleting directory with rimraf CLI: \n" + rimrafProcess.output.join(" "));
    }
};
export * from "fs";


export { inspect } from "util";

export * from "path";
export { sync } from "cross-spawn";
export { SpawnSyncReturns } from "child_process";
export const DataObjectParser = require("dataobject-parser");
export * from "fs";

export const TEST_HOME: string = process.cwd() + "/__tests__/__results__/data/.testHomeDir";

export const TEST_RESULT_DIR = nodePath.resolve(__dirname + "/../__results__");

/**
 * This function strips any new lines out of the string passed.
 * @param {string} str A string to remove new lines
 * @returns {string} A string without new lines
 */
export function stripNewLines(str: string): string {
    return str
        .replace(/\n+/g, " ")
        .trim();
    // .replace(/\S\S+/g, " "); // Strips out areas of more than one space
}

export function compareIgnoringTrailingBlanks(a: string, b: string): boolean {
    const testLogger = TestLogger.getTestLogger();
    const aLines: string[] = a.split(/\r?\n/);
    const bLines: string [] = b.split(/\r?\n/);
    if (aLines.length !== bLines.length) {
        testLogger.info("compareIgnoringTrailingBlanks: a and b have a different number of lines. a:" +
            aLines.length + "b:" + bLines.length);
        return false;
    }
    for (let i = 0; i < aLines.length; i++) {
        if (aLines[i].trim().localeCompare(bLines[i].trim()) !== 0) {
            let diffString = "d:";

            // find and point to the different character
            for (let j = 0; j < aLines[i].length && j < bLines[i].length; j++) {
                if (aLines[i].charAt(j) === bLines[i].charAt(j)) {
                    diffString += " ";
                }
                else {
                    diffString += "^";
                    break;
                }
            }

            testLogger.info("compareIgnoringTrailingBlanks: lines differ:\n a:" + aLines[i]
                + "\nb:" + bLines[i] + "\n" + diffString);
            return false;
        }
    }
    return true;
}

export function generateRandomContent(numLines: number, lineLength: number): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?!@#$%^&**() ";
    let result = "";

    for (let currentLine = 1; currentLine <= numLines; currentLine++) {
        for (let i = 1; i < lineLength; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        result += "\n";
    }
    return result;
}

/**
 *
 * @param {number} length - how long should the string be
 * @param {boolean} upToLength -  if true, length is the maximum length of the string.
 *                               (generate a string 'up to' length characters long)
 * @returns {string} the random string
 */
export function generateRandomAlphaNumericString(length: number, upToLength: boolean = false): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    if (upToLength) {
        length = Math.floor(Math.random() * length) + 1;
    }
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Get a buffer full of random data
 * @param dataSize - the number of bytes to generate
 */
export function getRandomBytes(dataSize: number): Promise<Buffer> {
    return new Promise<Buffer>((resolveBytes, reject) => {
        randomBytes(dataSize, (randomErr: Error, randomData: Buffer) => {
            if (randomErr != null) {
                reject(randomErr);
                return;
            }
            resolveBytes(randomData);
        });
    });
}


export enum CMD_TYPE {
    JSON, // only  with the json flag
    INTERACTIVE, // only in the default/interactive mode
    ALL  // all ways
}

export function executeTestCLICommand(cliBinModule: string, testContext: any, args: string[],
    execDir?: string, pipeContent?: string | Buffer,
    env: { [key: string]: string } = process.env): SpawnSyncReturns<string> {
    const testLogger = TestLogger.getTestLogger();
    const nodeCommand = "node";
    // run the command with ts-node/register if we're not running via gulp
    // nyc already is configured to require ts-node/register so duplicating that here
    // causes problems
    const starterArguments = isNullOrUndefined(process.env.INVOKED_VIA_GULP) ?
        ["--require", "ts-node/register", cliBinModule] : [cliBinModule];
    args = starterArguments.concat(args);

    const commandExecutionMessage = "Executing " + nodeCommand + " " + args.join(" ");

    testLogger.info(commandExecutionMessage);
    if (!isNullOrUndefined(testContext)) {
        TestLogger.getTestLogger().debug(testContext, commandExecutionMessage);
    }
    const childEnv = JSON.parse(JSON.stringify(env)); // copy current env
    childEnv.FORCE_COLOR = "0";
    const child = spawn.sync(nodeCommand, args, {
        cwd: execDir,
        encoding: "utf8",
        input: pipeContent,
        env: childEnv
    });

    if (child.status === null) {
        testLogger.error(inspect(child, {depth: null}));
        throw new Error("Error spawning child process to execute command: " + child.error);
    }

    const commandResultMessage = "Command output: \n" + child.output.join(" ") +
        "\nexit code: " + child.status;

    if (!isNullOrUndefined(testContext)) {
        TestLogger.getTestLogger().debug(commandResultMessage);
    }

    return child;
}

/**
 * Test the interactive and JSON versions of a command for whether they contain expected output
 * @param cliBinModule - path to the module that is the main entry point of your test CLI
 * @param args - everything that comes after the bin name in the command you're testing
 * @param expectedContent - what the output should contain -- leave empty if you just want success or failure
 * @param jsonFieldForContent - what field the content should be in e.g. "stdout" or "response.results";
 * @param shouldSucceed - true: command should succeed. false: command should fail
 * @param testContext - the value of 'this' in your test
 * @param {CMD_TYPE} variationsToRun - which ways to run the command (optional, defaults to CMD_TYPE.ALL,
 *                                     which means that by default this will run twice, so if the command
 *                                     is destructive you will want to pick JSON or INTERACTIVE)
 * @param compareOptions - options to use when comparing the expected content to the command output
 * @param pipeContent  - content to pipe into the command
 * @param env
 * @returns  {ICommandResponse} response - the JSON response from the command -
 *                                    (if you have used CMD_TYPE.ALL or CMD_TYPE.JSON)
 */
export function findExpectedOutputInCommand(cliBinModule: string,
    args: string[],
    expectedContent: string | string[],
    jsonFieldForContent: string,
    shouldSucceed: boolean,
    testContext: any,
    variationsToRun: CMD_TYPE = CMD_TYPE.ALL,
    compareOptions: {
        ignoreCase?: boolean,
        ignoreSpaces?: boolean
    } = {ignoreCase: false, ignoreSpaces: false},
    pipeContent?: string | Buffer,
    env: { [key: string]: string } = process.env): ICommandResponse {

    let interactiveCommand: SpawnSyncReturns<string>;
    const testLogger = TestLogger.getTestLogger();
    let commandOutput;
    if (variationsToRun === CMD_TYPE.ALL || variationsToRun === CMD_TYPE.INTERACTIVE) {
        interactiveCommand = executeTestCLICommand(cliBinModule, testContext, args, undefined, pipeContent);
        commandOutput = interactiveCommand.output.join("");
        if (compareOptions.ignoreCase) {
            commandOutput = commandOutput.toLowerCase();
        }
    }
    let jsonCommand: SpawnSyncReturns<string>;
    let jsonOutput: ICommandResponse;
    const jsonOption = "--" + Constants.JSON_OPTION;
    let dataObjectParser;
    if (variationsToRun === CMD_TYPE.ALL || variationsToRun === CMD_TYPE.JSON) {
        jsonCommand = executeTestCLICommand(cliBinModule, testContext, args.concat([jsonOption]),
            undefined, pipeContent);
        try {
            jsonOutput = JSON.parse(jsonCommand.stdout);
        } catch (e) {
            const message = ("Error parsing JSON output: stdout:'" + jsonCommand.stdout + "' stderr: '" + jsonCommand.stderr +
                "'\n status code " + jsonCommand.status) + " " + e.message;
            throw new Error(message);
        }
        dataObjectParser = new DataObjectParser(jsonOutput);
        // verify the dot-notation object passed in exists in the output JSON
        if (isNullOrUndefined(dataObjectParser.get(jsonFieldForContent))) {
            throw new Error("Requested field " + jsonFieldForContent + " was not available in the JSON response");
        }
    }


    if (shouldSucceed) {
        if (variationsToRun === CMD_TYPE.ALL || variationsToRun === CMD_TYPE.INTERACTIVE) {
            if (interactiveCommand.status !== 0) {
                throw new Error("Command should have succeeded: " + interactiveCommand.output.join(" "));
            }
        }
        if (variationsToRun === CMD_TYPE.ALL || variationsToRun === CMD_TYPE.JSON) {
            if (jsonCommand.status !== 0) {
                throw new Error("Command should have succeeded: " + jsonCommand.output.join(" "));
            }
            if (jsonOutput.success !== true) {
                throw new Error("JSON success should be true");
            }
        }
    }
    else {
        if (variationsToRun === CMD_TYPE.ALL || variationsToRun === CMD_TYPE.INTERACTIVE) {
            if (interactiveCommand.status === 0) {
                throw new Error("Command should have failed");
            }
        }
        if (variationsToRun === CMD_TYPE.ALL || variationsToRun === CMD_TYPE.JSON) {
            if (jsonCommand.status === 0) {
                throw new Error("Command should have failed");
            }
            if (jsonOutput.success !== false) {
                throw new Error("JSON success should be false");
            }

        }
    }

    expectedContent = expectedContent || "";

    if (!isArray(expectedContent)) {
        // convert single expected content to an array
        expectedContent = [expectedContent];
    }
    if (compareOptions.ignoreSpaces) {
        let newExpectedContent: string[] = [];
        for (const content of expectedContent) {
            newExpectedContent = newExpectedContent.concat(content.split(/\s/g));
        }
        expectedContent = newExpectedContent;
    }
    testLogger.info(commandOutput);
    testLogger.info(inspect(expectedContent, {depth: null}));
    for (let content of expectedContent) {
        if (compareOptions.ignoreCase) {
            content = content.toLowerCase();
        }

        if (variationsToRun === CMD_TYPE.ALL || variationsToRun === CMD_TYPE.INTERACTIVE) {
            expect(commandOutput).toContain(content);
        }
        if (variationsToRun === CMD_TYPE.ALL || variationsToRun === CMD_TYPE.JSON) {
            let objectSummary = dataObjectParser.get(jsonFieldForContent);
            if (!isString(objectSummary)) {
                objectSummary = inspect(objectSummary);
            }
            if (compareOptions.ignoreCase) {
                objectSummary = objectSummary.toLowerCase();
            }
            expect(objectSummary).toContain(content);
        }
    }

    // if we've executed a JSON command, return the parsed response object in case people
    // want to do further tests on it
    return jsonOutput;
}

/**
 * Allows you to compare two objects for differences. You can also optionally ignore properties/paths and in addition,
 * you can opt to do Regex compare (rather than compare the objects to one another).
 * @param actual - The actual object that was created during the test
 * @param expected - the Expected or "gold" copy that the object should match
 * @param {ICompareParms} parms - control parameters - see the ICompareParms object for details
 * @return {any[]} - Returns a null array if the objects match, otherwise it'll return a set of diffs - see the format
 * of the output from deep-diff package for more information about responses.
 */
export function compareJsonObjects(actual: any, expected: any, parms?: ICompareParms): any[] {
    const testLogger = TestLogger.getTestLogger();
    const diffs = diff(actual, expected);
    let returnDiffs: any = [];
    if (parms) {
        diffs.forEach((difference: any) => {
            const path = difference.path.join(".");
            if (isNullOrUndefined(parms.ignorePaths) || (parms.ignorePaths.indexOf(path) < 0)) {
                if (!isNullOrUndefined(parms.pathRegex)) {
                    let regexPathMatch: boolean = false;
                    for (const reg of parms.pathRegex) {
                        if (path === reg.path) {
                            let toMatch: any = difference.lhs;
                            if (difference.lhs instanceof Buffer) {
                                toMatch = difference.lhs.toString();
                            }
                            if (!reg.regex.test(toMatch)) {
                                difference.imperativeRegexTest = "failed";
                                returnDiffs.push(difference);
                            } else {
                                difference.imperativeRegexTest = "succeeded";
                            }
                            regexPathMatch = true;
                            break;
                        }
                    }

                    if (!regexPathMatch) {
                        returnDiffs.push(difference);
                    }
                }
            } else {
                testLogger.info("ignored: " + path);
            }
        });
    } else {
        if (!isNullOrUndefined(diffs)) {
            returnDiffs = returnDiffs.concat(diffs);
        }
    }

    return returnDiffs;
}

/**
 * Create a directory under the test results directory /data/ area (with an optional prepend argument)
 * and a uuid, this allows us to execute tests in parallel that require filesystem isolation.
 * @export
 * @param {string} [prepend=""]
 */
export function createUniqueTestDataDir(append = ""): string {
    const app = uuidv4() + "/" + append + "/";
    const path = nodePath.resolve(TEST_RESULT_DIR + "/data/" + app);
    mkdirpSync(path);
    return path;
}

/**
 * Execute a CLI script
 * @export
 * @param {string} scriptPath - the path to the script
 * @param {string} cwd - the current working directory
 * @param {any} [args=[]] - set of script args
 * @returns
 */
export function runCliScript(scriptPath: string, cwd: string, args: any = [], envVars?: any) {
    if (fs.existsSync(scriptPath)) {

        // We force the color off to prevent any oddities in the snapshots or expected values
        // Color can vary OS/terminal
        const childEnv = JSON.parse(JSON.stringify(process.env));
        childEnv.FORCE_COLOR = "0";

        // Add the ENV vars if any are specified
        if (envVars != null) {
            Object.keys(envVars).forEach((property) => {
                childEnv[property] = envVars[property];
            });
        }

        // Execute the command synchronously
        return spawn.sync("sh", [`${scriptPath}`].concat(args), {cwd, env: childEnv});
    } else {
        throw new Error("The script directory doesn't exist");
    }
}
