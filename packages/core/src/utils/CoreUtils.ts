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

import * as fs from "fs";
import { IImperativeError, Logger, TextUtils } from "@zowe/imperative";

const stringWidth = require("string-width");

/**
 * Adds padding in case you want a longer string.
 *
 * @param {string} str              - string to add the padding to
 * @param {number} len              - final length of the padded string
 * @param {string} [padChar=" "]    - Padding character
 * @return {string} Padded string
 */
export function padLeft(str: string, len: number, padChar: string = " "): string {
    if (str.length >= len) {
        return str;
    }

    // Only allow single character padding
    if (padChar.length > 1) {
        throw new Error("Specify only one character");
    }

    // Should be at least one character
    if (padChar.length === 0) {
        throw new Error("Specify at least one character");
    }

    return padChar.repeat(len - str.length) + str;
}

/**
 * Trims a given line based on the terminal's width. It also replaces tabs with spaces.
 *
 * @param {string} str - string to be trimmed
 * @return {string} Trimmed string
 */
export function trimLineToTerminalWidth(str: string): string {
    const terminalWidth = process.stdout.columns - 1;
    const ellipsisLength = 3;
    str = str.replace(/\t/g, " ");

    // No need to trim this string
    // The second part of this if statement will only happen IFF the terminal width is also less than (or equal to) the ellipsisLength (e.g. 3)
    if (stringWidth(str) < terminalWidth || stringWidth(str) <= ellipsisLength) {
        return str;
    }

    return `${str.slice(0, -1 * (stringWidth(str) - terminalWidth + ellipsisLength))}...`;
}

/**
 * Produces formatted context of a given error in the specified location of the contents
 *
 * NOTE:
 *      The lineIndex is zero-based indexed
 *
 * @param {string | string[]} content   - Indicates the contents or the file path to the file containing the contents to get the error from
 * @param {number} lineIndex            - Zero-basd indexed location of the error to be printed
 * @return {string} Few lines (separated by \n) containing error context
 */
export function getErrorContext(content: string | string[], lineIndex: number): string {
    let retValue = "";

    if (lineIndex < 0) {
        // No error location provided
        return retValue;
    }

    let lines = content;
    if (typeof content === "string") {
        // Try reading from a file
        if (fs.existsSync(content)) {
            lines = fs.readFileSync(content).toString().split(/\r?\n/);
        } else {
            throw new Error(`File ${content} not found!`);
        }
    }

    // Get the possible padding length for the line numbers
    const maxLineIndexLength = Math.max((lineIndex + 1).toString().length, (lineIndex + 2).toString().length);

    // Gather the line before in case we are able to get it
    if (lineIndex > 0) {
        retValue += trimLineToTerminalWidth(`\n   ${padLeft(lineIndex.toString(), maxLineIndexLength)} |  ${lines[lineIndex - 1]}`);
    }

    // Format the current line of the
    retValue +=
        trimLineToTerminalWidth(`\n > ${TextUtils.chalk.red(padLeft((lineIndex + 1).toString(), maxLineIndexLength))} |  ${lines[lineIndex]}`);

    // Gather the next line in case we are able to get it
    if (lineIndex + 1 < lines.length) {
        retValue += trimLineToTerminalWidth(`\n   ${padLeft((lineIndex + 2).toString(), maxLineIndexLength)} |  ${lines[lineIndex + 1]}`);
    }

    return retValue;
}

/**
 * This is a simple sleep function to help when waiting for a certain period of
 * time before continuing.
 *
 * @param {number} [ms=1000] The number of milliseconds to sleep.
 *
 * @returns {Promise<void>} Resolves after the specified time is up.
 *
 * @example <caption>Sleeping within code</caption>
 *
 * async function doStuff() {
 *   await CoreUtils.sleep(10000);
 *   console.log("You will see this message 10 seconds after function was entered");
 * }
 */
export function sleep(ms = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility function to read complete standard in contents from a handler
 * Can be awaited from async methods
 */
export function readStdin(): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        let stdinContent: Buffer = Buffer.from([]);
        const stream = process.stdin;
        const log = Logger.getAppLogger();
        stream.resume();

        stream.on("data", (chunk: Buffer) => {
            log.trace(`Read data from stdin: ${chunk.toString()}`);
            log.debug(`Read ${chunk.length} bytes of data from stdin`);
            stdinContent = Buffer.concat([stdinContent, chunk]);
        });

        stream.once("end", () => {
            log.info("Finished reading stdin");
            resolve(stdinContent);
        });

        stream.on("error", (error: Error) => {
            const stdinReadError: IImperativeError = {
                msg: "Error encountered while reading from stdin",
                causeErrors: error,
                additionalDetails: (error == null) ? undefined : error.message
            };
            reject(stdinReadError);
        });
    });
}

/**
 * Execute multiple promises in a pool with a maximum number of promises
 * executing at once
 * @param poolLimit - limit of how many promises should execute at once
 * @param array - array of objects to convert to promises with iteratorFn
 * @param iteratorFn - the function that turns an entry in the array into a promise
 */
export function asyncPool(poolLimit: number, array: any[],
    iteratorFn: (item: any, array: any[]) => Promise<any>): Promise<any> {
    let i = 0;
    const ret: any[] = [];
    const executing: any[] = [];
    const enqueue: any = () => {
        if (i === array.length) {
            return Promise.resolve();
        }
        const item = array[i++];
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        ret.push(p);
        const e: any = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        let r = Promise.resolve();
        if (executing.length >= poolLimit) {
            r = Promise.race(executing);
        }
        return r.then(() => enqueue());
    };
    return enqueue().then(() => Promise.all(ret));
}
