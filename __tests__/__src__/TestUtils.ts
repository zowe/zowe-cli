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

import { randomBytes } from "crypto";

import { ZosFilesConstants } from "../../packages/zosfiles/src/constants/ZosFiles.constants";
import { Imperative, Headers, AbstractSession, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";

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
 * This function leverage unix time stamp (ms since epoch), random numbers and user specified
 * high level qualifier to generate unique data set name to be used for testing.
 * @param {string} hlq User specified high level qualify
 * @returns {string} A generated data set name
 */
export function getUniqueDatasetName(hlq: string, encoded = false): string {
    let generatedName: string = "";
    const randomNumber = Math.random();
    const timestampInMsNum = Date.now();
    let timestampInMs = Math.floor(randomNumber * timestampInMsNum).toString();
    let tempStr: string;
    const MAX_NODE_LENGTH = 7;
    let MAX_NODES = 2;
    let currNodes = 0;

    if (encoded) {MAX_NODES = 1;}

    while (timestampInMs.length > 0) {
        let anotherNode = false;
        currNodes++;
        tempStr = timestampInMs.substring(0, MAX_NODE_LENGTH);
        generatedName += `A${tempStr}`;
        timestampInMs = timestampInMs.slice(tempStr.length, timestampInMs.length);

        if (timestampInMs.length > 0) {
            anotherNode = true;
            generatedName += ".";
        }

        if (currNodes == MAX_NODES && anotherNode) {
            currNodes--;
            const generatedNameArray = generatedName.split(".");
            generatedNameArray.shift();
            generatedName = generatedNameArray.join(".");
        }
    }

    let newDatasetName: string = `${hlq.trim()}.${generatedName}`;
    if (encoded) {newDatasetName = newDatasetName + ".ENCO#ED";}
    return newDatasetName.toUpperCase();
}

/**
 * Get a buffer full of random data
 * @param dataSize - the number of bytes to generate
 */
export function getRandomBytes(dataSize: number): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        randomBytes(dataSize, (randomErr: Error | null, randomData: Buffer) => {
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

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms) );
}

export const delTime = 500;

/**
 * Use instead of `util.inspect` to get consistently formatted output that can be used in snapshots.
 * Does not inspect nested objects.
 * @param obj Object to stringify
 */
export function inspect(obj: any) : string {
    return JSON.stringify(Object.keys(obj).reduce((newObj, key) => ({...newObj, [key]: obj[key]}), {}));
}
