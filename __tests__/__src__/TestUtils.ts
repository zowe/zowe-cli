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
import { spawnSync, SpawnSyncReturns } from "child_process";
import { ITestEnvironment } from "./environment/doc/response/ITestEnvironment";
import { randomBytes } from "crypto";
import { ZosFilesConstants } from "../../packages/zosfiles/src/api";
import { Imperative, Headers, AbstractSession } from "@zowe/imperative";
import { ZosmfRestClient } from "../../packages/rest";

/**
 * Execute a CLI script
 * @export
 * @param {string} scriptPath - the path to the script
 * @param {string} testEnvironment - the test environment with env
 * @param {any[]} [args=[]] - set of script args (optional)
 * @returns {SpawnSyncReturns<Buffer>}  node.js details about the results of
 *                                               executing the script, including exit code and output
 */
export function runCliScript(scriptPath: string, testEnvironment: ITestEnvironment, args: any[] = []): SpawnSyncReturns<Buffer> {
    if (fs.existsSync(scriptPath)) {

        // We force the color off to prevent any oddities in the snapshots or expected values
        // Color can vary OS/terminal
        const childEnv = JSON.parse(JSON.stringify(process.env));
        childEnv.FORCE_COLOR = "0";
        for (const key of Object.keys(testEnvironment.env)) {
            // copy the values from the env
            childEnv[key] = testEnvironment.env[key];
        }

        // Execute the command synchronously
        return spawnSync("sh", [`${scriptPath}`].concat(args), {cwd: testEnvironment.workingDir, env: childEnv});
    } else {
        throw new Error(`The script file  ${scriptPath} doesn't exist`);
    }
}


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

/**
 * This function leverage unix time stamp (ms since epoch) along with user specified
 * high level qualify to generate unique data set name to be used for testing.
 * @param {string} hlq User specified high level qualify
 * @returns {string} A generated data set name
 */
export function getUniqueDatasetName(hlq: string): string {
    let newDatasetName: string;
    let generatedName: string = "";
    let timestampInMs: string = Date.now().toString();
    let tempStr: string;
    const MAX_NODE_LENGTH = 7;

    while (timestampInMs.length > 0) {
        tempStr = timestampInMs.substr(0, MAX_NODE_LENGTH);
        generatedName += `A${tempStr}`;
        timestampInMs = timestampInMs.slice(tempStr.length, timestampInMs.length);

        if (timestampInMs.length > 0) {
            generatedName += ".";
        }
    }

    newDatasetName = `${hlq.trim()}.${generatedName}`;
    return newDatasetName.toUpperCase();
}

/**
 * Get a buffer full of random data
 * @param dataSize - the number of bytes to generate
 */
export function getRandomBytes(dataSize: number): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        randomBytes(dataSize, (randomErr: Error, randomData: Buffer) => {
            if (randomErr != null) {
                reject(randomErr);
                return;
            }
            resolve(randomData);
        });
    });
}

export async function getTag(session: AbstractSession, ussPath: string) {
    const request: object = {
        request: "chtag",
        action: "list"
    };
    const url = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES
        + "/" + ussPath;
    Imperative.console.info("z/OSMF URL: " + url);
    const response = await ZosmfRestClient.putExpectJSON<any>(session,
        url,
        [Headers.APPLICATION_JSON, {[Headers.CONTENT_LENGTH]: JSON.stringify(request).length.toString()}],
        request);
    return response.stdout[0];
}
