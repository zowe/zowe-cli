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
import * as fs from "fs";
import { Imperative, Headers, AbstractSession } from "@zowe/imperative";
import { ZosmfRestClient } from "../../packages/core/src";
import { ZosFilesConstants, Delete } from "../../packages/zosfiles/src";
import { DeleteJobs, ICommonJobParms, IDeleteJobParms, IJob } from "../../packages/zosjobs/src";
import { promisify } from "util";

/**
 * Delete a local testing file after use
 * @param {string} filePath - File path of temporary file
 */
export function deleteLocalFile(filePath: string): void {
    try {
        fs.unlinkSync(filePath);
    } catch {
        throw new Error(`Error deleting local file: ${filePath}`);
    }
}

/**
 * Delete local directories after use
 * @param {string[]} directories - Array of directories to delete
 */
export function deleteLocalDirectories(directories: string[]): void {
    directories.forEach((dir) => {
        try {
            if (fs.existsSync(dir)) {
                fs.rmdirSync(dir, { recursive: true });
            }
        } catch {
            throw new Error(`Error deleting directory: ${dir}`);
        }
    });
}

/**
 * Deletes a USS file from the mainframe
 * @param {AbstractSession} session - The session object
 * @param {string} fileName - The name of the file to delete
 * @returns {Promise<void>} A promise that resolves when the file is deleted
 */
export async function deleteFiles(session: AbstractSession, fileName: string): Promise<void> {
    await Delete.ussFile(session, fileName, true); //recursive = true
}

/**
 * Deletes a data set from the mainframe
 * @param {AbstractSession} session - The session object
 * @param {string} dataSetName - The name of the data set to delete.
 * @returns {Promise<void>} A promise that resolves when the data set is deleted
 */
export async function deleteDataset(session: AbstractSession, dataSetName: string): Promise<void> {
    await Delete.dataSet(session, dataSetName);
}

/**
 * Delete a job from the mainframe using Zowe SDKs - IJob
 * @param {AbstractSession} session - z/OSMF connection info
 * @param {IJob} job - the job that you want to delete
 * @returns {Promise<void>} A promise that resolves when the job is deleted.
 */
export async function deleteJob(session: AbstractSession, job: IJob): Promise<void> {
    await DeleteJobs.deleteJobForJob(session, job);
}

/**
 * Delete a job from the mainframe using Zowe SDKs - jobid, jobname
 * @param {AbstractSession} session - z/OSMF connection info
 * @param {params} ICommonJobParms - constains jobname and jobid for job to delete
 * @returns {Promise<void>} A promise that resolves when the job is deleted.
 */
export async function deleteJobCommon(session: AbstractSession, params: ICommonJobParms): Promise<void> {
    await DeleteJobs.deleteJobCommon(session, params as IDeleteJobParms);
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
 * This function leverage unix time stamp (ms since epoch), random numbers and user specified
 * high level qualifier to generate unique data set name to be used for testing.
 * @param {string} hlq User specified high level qualify
 * @returns {string} A generated data set name
 */
export function getUniqueDatasetName(hlq: string, encoded = false, maxNodes = 2): string {
    let generatedName: string = "";
    const randomNumber = Math.random();
    const timestampInMsNum = Date.now();
    let timestampInMs = Math.floor(randomNumber * timestampInMsNum).toString();
    let tempStr: string;
    const MAX_NODE_LENGTH = 7;
    let MAX_NODES = maxNodes;
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

/**
 * Pauses execution for a given number of milliseconds.
 * @param {number} ms - Number of milliseconds to wait
 * @returns {Promise<void>} - Resolves after the specified time has passed
 */
export const wait = promisify(setTimeout);
export const waitTime = 2000; //wait 2 seconds

/**
 * Use instead of `util.inspect` to get consistently formatted output that can be used in snapshots.
 * Does not inspect nested objects.
 * @param obj Object to stringify
 */
export function inspect(obj: any) : string {
    return JSON.stringify(Object.keys(obj).reduce((newObj, key) => ({...newObj, [key]: obj[key]}), {}));
}
