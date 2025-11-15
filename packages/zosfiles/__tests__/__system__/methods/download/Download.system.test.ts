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

import {
    Create,
    CreateDataSetTypeEnum,
    Delete,
    Download,
    Upload,
    IDownloadOptions,
    IZosFilesResponse,
    Tag,
    Utilities,
    ZosFilesMessages,
    ICreateZfsOptions,
    IMountFsOptions,
    Mount,
    Unmount,
    IUSSListOptions,
} from "../../../../src";
import { Imperative, IO, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { deleteFiles, getUniqueDatasetName, stripNewLines, wait } from "../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { posix, join } from "path";
import { Shell } from "@zowe/zos-uss-for-zowe-sdk";
import { PassThrough } from "stream";
import { text } from "stream/consumers";
import { runCliScript } from "@zowe/cli-test-utils";

const rimraf = require("rimraf").sync;
const waitTime = 2000;
const testData = "abcdefghijklmnopqrstuvwxyz";
const specialCharTestData = fs.readFileSync(__dirname+"/__resources__/testfiles/specialCharTestData.txt");

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let ussname: string;
let ussDirname: string;
let localDirname: string;
let file: string;

describe.each([false, true])("Download Data Set - Encoded: %s", (encoded: boolean) => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_download"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSTEST.DOWNLOAD`, encoded);
        Imperative.console.info("Using dsname:" + dsname);

        // using unique DS function to generate unique USS file name
        if (encoded) {
            ussname = `${defaultSystem.unix.testdir}/ENCO#ED${dsname}`;
            ussDirname = `${defaultSystem.unix.testdir}/ENCO#EDzos_file_download`;
            localDirname = `${testEnvironment.workingDir}/ENCO#EDussDir`;
        } else {
            ussname = `${defaultSystem.unix.testdir}/${dsname}`;
            ussDirname = `${defaultSystem.unix.testdir}/zos_file_download`;
            localDirname = `${testEnvironment.workingDir}/ussDir`;
        }
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success Scenarios", () => {

        describe("Physical sequential data set", () => {

            beforeEach(async () => {

                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                    await wait(waitTime);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {

                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                    await wait(waitTime);
                } catch (err) {
                    // Do nothing
                }

                // Cleanup
                const files = fs.readdirSync(testEnvironment.workingDir);
                for (const file of files) {
                    if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                        const filePath = join(testEnvironment.workingDir, file);
                        fs.rmSync(filePath, {recursive: true});
                    }
                }
            });

            it("should download a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);
                await wait(waitTime);

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".txt";
                file = file.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);
                await wait(waitTime);

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, {responseTimeout: 5});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".txt";
                file = file.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set and create folders and file in original letter case", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);
                await wait(waitTime);

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, { preserveOriginalLetterCase: true });
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".txt";

                // Check if folders and file are created in original uppercase
                file.split("/").reduce((path, pathSegment) => {
                    const pathExists = fs.readdirSync(path).indexOf(pathSegment) !== -1;
                    expect(pathExists).toBeTruthy();
                    return [path, pathSegment].join("/");
                }, ".");

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {
                    binary: true
                };

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".txt";
            });

            it("should download a data set in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {
                    record: true
                };

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".txt";
            });


            it("should download a data set and return Etag", async () => {
                let error;
                let response: IZosFilesResponse;

                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);
                await wait(waitTime);

                const options: IDownloadOptions = {
                    returnEtag: true
                };

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));
                expect(response.apiResponse.etag).toBeDefined();
                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".txt";
                file = file.toLowerCase();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set that has been populated by upload and use file extension specified", async () => {
                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {
                    extension: "dat"
                };

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);
                await wait(waitTime);

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".dat";
                file = file.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set to a stream", async () => {
                let error;
                let response: IZosFilesResponse;
                const responseStream = new PassThrough();

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);
                await wait(waitTime);

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, { stream: responseStream });
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(await text(responseStream));
                expect(fileContents).toEqual(testData);
            });
        });

        describe("Partitioned data set - all members", () => {

            beforeEach(async () => {

                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                    await wait(waitTime);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {

                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                    await wait(waitTime);
                } catch (err) {
                    // Do nothing
                }

                // Cleanup
                const files = fs.readdirSync(testEnvironment.workingDir);
                for (const file of files) {
                    if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                        const filePath = join(testEnvironment.workingDir, file);
                        fs.rmSync(filePath, {recursive: true});
                    }
                }
            });

            it("should download a data set member", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");
                await wait(waitTime);

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/");
                file = file.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}/member.txt`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set member with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");
                await wait(waitTime);

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, {responseTimeout: 5});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/");
                file = file.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}/member.txt`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set and create folders and file in original letter case", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");
                await wait(waitTime);

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, { preserveOriginalLetterCase: true });
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/MEMBER.txt";

                // Check if folders and file are created in original uppercase
                file.split("/").reduce((path, pathSegment) => {
                    const pathExists = fs.readdirSync(path).indexOf(pathSegment) !== -1;
                    expect(pathExists).toBeTruthy();
                    return [path, pathSegment].join("/");
                }, ".");

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(file).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");
                await wait(waitTime);

                const options: IDownloadOptions = {
                    binary: true
                };

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/member.txt";
            });

            it("should download a data set in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");
                await wait(waitTime);

                const options: IDownloadOptions = {
                    record: true
                };

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/member.txt";
            });

            it("should download a data set and use file extension specified", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");
                await wait(waitTime);

                const options: IDownloadOptions = {
                    extension: "dat"
                };

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/member.dat";
            });
            it("should download a data set member full of special characters to test buffer chunk concatenation", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(specialCharTestData), dsname + "(member)");
                await wait(waitTime);

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // Convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/");
                file = file.toLowerCase();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}/member.txt`).toString());
                const uniqueFileChars = Array.from(new Set(fileContents)).join('');
                const expectedUniqueChars = "àèéìòùÀÈÉÌÒÙ° "; // Expected unique characters

                // Ensure the file only contains the unique characters and nothing else
                expect(uniqueFileChars).toEqual(expectedUniqueChars);
            });

            it("should download a data set member using extensionMap with dot and without dot", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(MEMX)");
                await wait(waitTime);

                // Use extensionMap with and without dot
                const options: IDownloadOptions = {
                    extensionMap: {
                        memx: ".abc",
                        MEMX: "xyz"
                    }
                };

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                const baseDir = dsname.replace(regex, "/").toLowerCase();
                // Should use ".abc" for memx (lowercase) by default
                const memxAbc = fs.existsSync(`${baseDir}/memx.abc`);
                const memxXyz = fs.existsSync(`${baseDir}/memx.xyz`);
                const MEMXAbc = fs.existsSync(`${baseDir}/MEMX.abc`);
                const MEMXXyz = fs.existsSync(`${baseDir}/MEMX.xyz`);
                expect(memxAbc || memxXyz || MEMXAbc || MEMXXyz).toBeTruthy();
                // Check file contents
                const filePath = fs.existsSync(`${baseDir}/memx.abc`) ? `${baseDir}/memx.abc`
                    : fs.existsSync(`${baseDir}/memx.xyz`) ? `${baseDir}/memx.xyz`
                        : fs.existsSync(`${baseDir}/MEMX.abc`) ? `${baseDir}/MEMX.abc`
                            : `${baseDir}/MEMX.xyz`;
                const fileContents = stripNewLines(fs.readFileSync(filePath).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set member using extensionMap with preserveOriginalLetterCase", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(MEMUP)");
                await wait(waitTime);

                // Use extensionMap with uppercase key and preserveOriginalLetterCase
                const options: IDownloadOptions = {
                    extensionMap: {
                        MEMUP: "UPP"
                    },
                    preserveOriginalLetterCase: true
                };

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                const baseDir = dsname.replace(regex, "/") + "/";
                // Should use "UPP" extension for MEMUP
                expect(fs.existsSync(`${baseDir}MEMUP.UPP`)).toBeTruthy();
                const fileContents = stripNewLines(fs.readFileSync(`${baseDir}MEMUP.UPP`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should fall back to default extension if extensionMap does not match", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(MEMDEF)");
                await wait(waitTime);

                // Use extensionMap with no matching key
                const options: IDownloadOptions = {
                    extensionMap: {
                        other: "zzz"
                    }
                };

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("member(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                const baseDir = dsname.replace(regex, "/").toLowerCase();
                // Should use default extension ".txt"
                expect(fs.existsSync(`${baseDir}/memdef.txt`)).toBeTruthy();
                const fileContents = stripNewLines(fs.readFileSync(`${baseDir}/memdef.txt`).toString());
                expect(fileContents).toEqual(testData);
            });
        });

        describe("Data sets matching - all data sets - PO", () => {

            beforeEach(async () => {

                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                    await wait(waitTime);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                    await wait(waitTime);
                } catch (err) {
                    Imperative.console.info("Error: " + inspect(err));
                }

                // Cleanup
                const files = fs.readdirSync(testEnvironment.workingDir);
                for (const file of files) {
                    if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                        const filePath = join(testEnvironment.workingDir, file);
                        fs.rmSync(filePath, {recursive: true});
                    }
                }
            });

            it("should download a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PO", vol: "*" }]);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.toLowerCase().replace(regex, "/");
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}/member.txt`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");

                const options: IDownloadOptions = {
                    binary: true,
                    extension: ".txt",
                    directory: "testDir"
                };

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PO", vol: "*" }], options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = "testDir/" + dsname.replace(regex, "/") + "/member.txt";
            });

            it("should download a data set in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");

                const options: IDownloadOptions = {
                    record: true,
                    extension: ".txt",
                    directory: "testDir"
                };

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PO", vol: "*" }], options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = "testDir/" + dsname.replace(regex, "/") + "/member.txt";
            });

            it("should download a data set with a different extension", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PO", vol: "*" }], {extension: "jcl"});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.toLowerCase().replace(regex, "/");
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}/member.jcl`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set with an extension map", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname + "(member)");
                const ending = dsname.split(".").pop().toLowerCase();
                const extMap: any = {};
                extMap[ending] = "jcl";

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PO", vol: "*" }], {extensionMap: extMap});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.toLowerCase().replace(regex, "/");
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}/member.jcl`).toString());
                expect(fileContents).toEqual(testData);
            });
        });

        describe("Data sets matching - all data sets - PS", () => {

            beforeEach(async () => {

                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                    await wait(waitTime);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                    await wait(waitTime);
                } catch (err) {
                    // Do nothing
                }

                // Cleanup
                const files = fs.readdirSync(testEnvironment.workingDir);
                for (const file of files) {
                    if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                        const filePath = join(testEnvironment.workingDir, file);
                        fs.rmSync(filePath, {recursive: true});
                    }
                }
            });

            it("should download a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PS", vol: "*" }]);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                // convert the data set name to use as a path/file

                file = dsname.toLowerCase() + ".txt";
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);

                const options: IDownloadOptions = {
                    binary: true,
                    extension: ".txt",
                    directory: "testDir"
                };

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PS", vol: "*" }], options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                file = "testdir/" + dsname.toLowerCase() + ".txt";
            });

            it("should download a data set in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);

                const options: IDownloadOptions = {
                    record: true,
                    extension: ".txt",
                    directory: "testDir"
                };

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PS", vol: "*" }], options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                file = "testdir/" + dsname.toLowerCase() + ".txt";
            });

            it("should download a data set with a different extension", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PS", vol: "*" }], {extension: "jcl"});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                file = dsname.toLowerCase() + ".jcl";
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download a data set with an extension map", async () => {
                let error;
                let response: IZosFilesResponse;

                // upload data to the newly created data set
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname);
                const ending = dsname.split(".").pop().toLowerCase();
                const extMap: any = {};
                extMap[ending] = "jcl";

                try {
                    response = await Download.allDataSets(REAL_SESSION, [{ dsname, dsorg: "PS", vol: "*" }], {extensionMap: extMap});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                file = dsname.toLowerCase() + ".jcl";
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(testData);
            });
        });
    });

    describe("Failure Scenarios", () => {
        afterAll(() => {
            // delete the top-level folder and the folders and file below
            if (file != null) {
                const folders = dsname.split(".");
                rimraf(folders[0].toLowerCase());
            }
        });

        describe("Physical sequential data set", () => {

            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.dataSet(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper message when downloading a data set that does not exist", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Data set not found.");
            });
        });

        describe("Partitioned data set - all members", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.allMembers(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Expect Error: Required object must be defined");
            });

            it("should display a relevant message when downloading data set members and the data set does not exist", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname + ".d");
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Data set not cataloged");
            });
        });
    });

    describe("Download USS File", () => {
        afterAll(async () => {
            // Delete created uss file
            await deleteFiles(REAL_SESSION, ussname);

            // Delete created local file
            IO.deleteFile(`./${posix.basename(ussname)}`);
        });

        afterEach(() => {
            // Cleanup
            const files = fs.readdirSync(testEnvironment.workingDir);
            for (const file of files) {
                if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                    const filePath = join(testEnvironment.workingDir, file);
                    fs.rmSync(filePath, {recursive: true});
                }
            }
        });

        describe("Successful scenarios", () => {
            it("should download uss file without any options", async () => {
                let error;
                let response: IZosFilesResponse;

                await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                await wait(waitTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(testData);

            });

            it("should download uss file with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                await wait(waitTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, {responseTimeout: 5});
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(testData);

            });

            it("should download uss file and return Etag", async () => {
                let error;
                let response: IZosFilesResponse;

                await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                await wait(waitTime);

                const options: IDownloadOptions = {
                    returnEtag: true
                };

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.apiResponse.etag).toBeDefined();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(testData);

            });
            describe.each([false, true])(
                "Download Data Set - Binary: %s",
                (binary: boolean) => {
                    it("should upload and download file with correct encoding", async () => {
                        let response: any;

                        // Upload binary or encoded file
                        const uploadFile: string = binary
                            ? "downloadEncodingCheck.txt"
                            : "downloadEncodingCheckBinary.txt";
                        let downloadResponse: any;
                        let error: any;

                        // Use text file as to get proper response from getRemoteEncoding()
                        const ussnameAsTxt = ussname + ".txt";
                        try {
                            response = runCliScript(
                                __dirname +
                                    `/__resources__/${
                                        binary
                                            ? "upload_file_to_uss.sh"
                                            : "upload_file_to_uss_binary.sh"
                                    }`,
                                testEnvironment,
                                [
                                    defaultSystem.tso.account,
                                    defaultSystem.zosmf.host,
                                    defaultSystem.zosmf.port,
                                    defaultSystem.zosmf.user,
                                    defaultSystem.zosmf.password,
                                    defaultSystem.zosmf.rejectUnauthorized,
                                    __dirname +
                                        "/__resources__/testfiles/" +
                                        uploadFile,
                                    ussnameAsTxt,
                                    binary ? "1047" : true,
                                ]
                            );
                            downloadResponse = runCliScript(
                                __dirname + "/__resources__/download_file.sh",
                                testEnvironment,
                                [
                                    defaultSystem.tso.account,
                                    defaultSystem.zosmf.host,
                                    defaultSystem.zosmf.port,
                                    defaultSystem.zosmf.user,
                                    defaultSystem.zosmf.password,
                                    defaultSystem.zosmf.rejectUnauthorized,
                                    ussnameAsTxt,
                                    __dirname +
                                        `/__resources__/${
                                            binary
                                                ? ".zosattributes"
                                                : ".zosattributes-binary"
                                        }`,
                                ]
                            );
                        } catch (err) {
                            error = err;
                        }

                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(downloadResponse).toBeTruthy();

                        // Compare the downloaded contents to those uploaded
                        const fileContents = fs
                            .readFileSync(
                                `${testEnvironment.workingDir}/${posix.basename(
                                    ussnameAsTxt
                                )}`
                            )
                            .toString();
                        expect(fileContents).toEqual(
                            fs
                                .readFileSync(
                                    __dirname +
                                        "/__resources__/testfiles/" +
                                        uploadFile
                                )
                                .toString()
                        );
                    });
                }
            );
            // When requesting etag, z/OSMF has a limit on file size when it stops to return etag by default (>8mb)
            // We are passing X-IBM-Return-Etag to force z/OSMF to always return etag, but testing here for case where it would be optional
            it("should download a 10mb uss file and return Etag", async () => {
                let error;
                let response: IZosFilesResponse;

                // Create a 10 mb buffer
                const bufferSize = 10000000;
                const buffer = new ArrayBuffer(bufferSize);
                const data = Buffer.from(buffer);

                await Upload.bufferToUssFile(REAL_SESSION, ussname, data);
                await wait(waitTime);

                const options: IDownloadOptions = {
                    returnEtag: true
                };

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.apiResponse.etag).toBeDefined();
                Imperative.console.info(response.apiResponse.etag);
            });

            it("should download uss file content in binary", async () => {
                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {
                    binary: true
                };

                await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData), { binary: true });
                await wait(waitTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download ISO8859-1 uss file in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;
                const options: IDownloadOptions = {};

                await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData), { binary: true });
                await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "ISO8859-1");
                await wait(waitTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(testData);
            });

            it("should download IBM-1147 uss file with encoding mode", async () => {
                let error;
                let response: IZosFilesResponse;
                const options: IDownloadOptions = {};

                const data: string = "Hello, world¤";
                await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(data));
                await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "IBM-1147");
                await wait(waitTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(data.slice(0, -1) + "€");
            });

            it("should download uss file content to local file", async () => {

                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {file: `test1.txt`};

                await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                await wait(waitTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(fs.readFileSync(`test1.txt`).toString());
                expect(fileContents).toEqual(testData);

                // Delete created local file
                IO.deleteFile("test1.txt");
            });

            it("should download uss file to a stream", async () => {
                let error;
                let response: IZosFilesResponse;
                const responseStream = new PassThrough();

                await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                await wait(waitTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, { stream: responseStream });
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(await text(responseStream));
                expect(fileContents).toEqual(testData);
            });
        });

        describe("Failure scenarios", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.ussFile(undefined, ussname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper error message when missing uss file name", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.ussFile(REAL_SESSION, undefined);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Specify the USS file name.");
            });

            it("should display proper error message when uss file name is empty string", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.ussFile(REAL_SESSION, "");
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Specify the USS file name.");
            });

            it("should display proper error message when uss file data type is record", async () => {
                let response: IZosFilesResponse;
                let error;

                const options: IDownloadOptions = {file: `test1.txt`, record: true};

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Unsupported data type 'record' specified for USS file operation.");
            });
        });
    });

    describe("Download USS Directory", () => {
        afterEach(() => {
            // Cleanup
            const files = fs.readdirSync(testEnvironment.workingDir);
            for (const file of files) {
                if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                    const filePath = join(testEnvironment.workingDir, file);
                    fs.rmSync(filePath, {recursive: true});
                }
            }
        });
        describe("Success Scenarios", () => {
            const testFileContents = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const anotherTestFileContents = testFileContents.toLowerCase();
            const binaryFileContents = String.fromCharCode(...Array(256).keys());
            const createZfsOptions: ICreateZfsOptions = {
                perms: 755,
                cylsPri: 10,
                cylsSec: 2,
                timeout: 20
            };
            const mountZfsOptions: IMountFsOptions = {
                "fs-type": "ZFS",
                mode: "rdwr"
            };
            let zfsName: string;

            const expectDownloaded = (dirname: string, options: IUSSListOptions = {}) => {
                expect(fs.existsSync(`${dirname}/emptyFolder`)).toBe(true);
                expect(fs.readdirSync(`${dirname}/emptyFolder`).length).toBe(0);
                expect(fs.existsSync(`${dirname}/parentFolder`)).toBe(true);
                expect(fs.readFileSync(`${dirname}/testFile.txt`, "utf-8")).toBe(testFileContents);

                // Test depth option
                const depth = options.depth || 0;
                expect(fs.existsSync(`${dirname}/parentFolder/childFolder`)).toBe(depth !== 1);
                if (depth !== 1) {
                    expect(fs.readFileSync(`${dirname}/parentFolder/childFolder/anotherTestFile.txt`, "utf-8")).toBe(anotherTestFileContents);
                }

                // Test filesys option
                const filesys = options.filesys || false;
                expect(fs.existsSync(`${dirname}/mountFolder`)).toBe(filesys);
                if (filesys) {
                    expect(fs.readFileSync(`${dirname}/mountFolder/binaryFile.bin`, "utf-8")).toBe(binaryFileContents);
                }

                // Test symlinks option
                const symlinks = options.symlinks || false;
                expect(fs.existsSync(`${dirname}/testFile.lnk`)).toBe(!symlinks);
                if (!symlinks) {
                    expect(fs.readFileSync(`${dirname}/testFile.lnk`, "utf-8")).toBe(testFileContents);
                }
            };

            beforeAll(async () => {
                const emptyFolder = posix.join(ussDirname, "emptyFolder");
                const parentFolder = posix.join(ussDirname, "parentFolder");
                const childFolder = posix.join(parentFolder, "childFolder");
                const testFile = posix.join(ussDirname, "testFile.txt");
                const anotherTestFile = posix.join(childFolder, "anotherTestFile.txt");
                const mountFolder = posix.join(ussDirname, "mountFolder");
                const binaryFile = posix.join(mountFolder, "binaryFile.bin");
                const testSymlink = posix.join(ussDirname, "testFile.lnk");

                // Create directories
                for (const directory of [ussDirname, emptyFolder, parentFolder, childFolder, mountFolder]) {
                    try {
                        await Create.uss(REAL_SESSION, directory, "directory");
                    } catch (err) {
                        // Do nothing - if it already exists, great. If not, the test will fail.
                    }
                }

                // Create and mount file system
                zfsName = getUniqueDatasetName(defaultSystem.zosmf.user + ".ZOSTEST", encoded);
                await Create.zfs(REAL_SESSION, zfsName, { ...createZfsOptions, volumes: [defaultSystem.datasets.vol]} );
                await Mount.fs(REAL_SESSION, zfsName, mountFolder, mountZfsOptions);

                // Upload files
                await Upload.bufferToUssFile(REAL_SESSION, testFile, Buffer.from(testFileContents));
                await Upload.bufferToUssFile(REAL_SESSION, anotherTestFile, Buffer.from(anotherTestFileContents));
                await Upload.bufferToUssFile(REAL_SESSION, binaryFile, Buffer.from(binaryFileContents), { binary: true });
                await Utilities.chtag(REAL_SESSION, binaryFile, Tag.BINARY);

                // Create symlink
                const SSH_SESSION: any = TestEnvironment.createSshSession(testEnvironment);
                await Shell.executeSshCwd(SSH_SESSION, `ln -s ${posix.basename(testFile)} ${posix.basename(testSymlink)}`, ussDirname, jest.fn());
            });

            afterEach(() => {
                IO.deleteDirTree(localDirname);
            });

            afterAll(async () => {
                // Unmount and delete file system
                await Unmount.fs(REAL_SESSION, zfsName);
                await Delete.zfs(REAL_SESSION, zfsName);

                // Delete directory recursively
                const SSH_SESSION: any = TestEnvironment.createSshSession(testEnvironment);
                await Shell.executeSshCwd(SSH_SESSION, `rm testFile.lnk`, ussDirname, jest.fn());
                await Delete.ussFile(REAL_SESSION, ussDirname, true);
            });

            it("should download directory recursively", async () => {
                let caughtError;
                try {
                    await Download.ussDir(REAL_SESSION, ussDirname, { directory: localDirname });
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeUndefined();
                expectDownloaded(localDirname);
            });

            it("should download directory with depth of 1", async () => {
                const listOptions: IUSSListOptions = { depth: 1 };
                let caughtError;
                try {
                    await Download.ussDir(REAL_SESSION, ussDirname, { directory: localDirname }, listOptions);
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeUndefined();
                expectDownloaded(localDirname, listOptions);
            });

            it("should download directory including all filesystems", async () => {
                const listOptions: IUSSListOptions = { filesys: true };
                let caughtError;
                try {
                    await Download.ussDir(REAL_SESSION, ussDirname, { directory: localDirname }, listOptions);
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeUndefined();
                expectDownloaded(localDirname, listOptions);
            });

            it("should download directory excluding symlinks", async () => {
                const listOptions: IUSSListOptions = { symlinks: true };
                let caughtError;
                try {
                    await Download.ussDir(REAL_SESSION, ussDirname, { directory: localDirname }, listOptions);
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeUndefined();
                expectDownloaded(localDirname, listOptions);
            });

            it("should not download files that already exist", async () => {
                let caughtError;
                const testFile = posix.join(localDirname, "testFile.txt");
                try {
                    fs.mkdirSync(localDirname);
                    fs.writeFileSync(testFile, "test");
                    await Download.ussDir(REAL_SESSION, ussDirname, { directory: localDirname });
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeUndefined();
                expect(fs.readFileSync(testFile).toString()).toEqual("test");
            });

            it("should download files that already exist when overwrite is true", async () => {
                let caughtError;
                const testFile = posix.join(localDirname, "testFile.txt");
                try {
                    fs.mkdirSync(localDirname);
                    fs.writeFileSync(testFile, "test");
                    await Download.ussDir(REAL_SESSION, ussDirname, { directory: localDirname, overwrite: true });
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeUndefined();
                expect(fs.readFileSync(testFile).toString()).toEqual(testFileContents);
            });
        });

        describe("Failure Scenarios", () => {
            it("should throw error when session is undefined", async () => {
                let caughtError;
                try {
                    await Download.ussDir(undefined, ussDirname);
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toBe("Expect Error: Required object must be defined");
            });

            it("should throw error when USS dir name is undefined", async () => {
                let caughtError;
                try {
                    await Download.ussDir(REAL_SESSION, undefined);
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toBe("Expect Error: Specify the USS directory name.");
            });

            it("should throw error when USS dir name is empty string", async () => {
                let caughtError;
                try {
                    await Download.ussDir(REAL_SESSION, "");
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toBe("Expect Error: Specify the USS directory name.");
            });

            it("should fail to download directory that does not exist", async () => {
                let caughtError;
                try {
                    await Download.ussDir(REAL_SESSION, posix.join(ussDirname, "invalidDir"), { directory: testEnvironment.workingDir });
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeDefined();
                expect(stripNewLines(caughtError.message)).toContain("Path name not found");
            });
        });
    });
});
