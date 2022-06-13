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
    ZosFilesConstants,
    ZosFilesMessages
} from "../../../../src";
import { Imperative, IO, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName, stripNewLines, delay } from "../../../../../../__tests__/__src__/TestUtils";
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { readdirSync, readFileSync, existsSync } from "fs";
import { posix } from "path";

const rimraf = require("rimraf").sync;
const delayTime = 2000;

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let ussname: string;
let file: string;

describe("Download Data Set", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_download"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
        Imperative.console.info("Using dsname:" + dsname);

        // using unique DS function to generate unique USS file name
        ussname = `${defaultSystem.unix.testdir}/${dsname}`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success Scenarios", () => {

        describe("Physical sequential data set", () => {

            beforeEach(async () => {
                let error;
                let response;

                try {
                    response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                    await delay(delayTime);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                try {
                    response = await Delete.dataSet(REAL_SESSION, dsname);
                    await delay(delayTime);
                } catch (err) {
                    error = err;
                }

                // delete the top-level folder and the folders and file below
                // variable 'file' should be set in the test
                const folders = file.split("/");
                const rc = rimraf(folders[0]);
            });

            it("should download a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                const fileContents = stripNewLines(readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                const fileContents = stripNewLines(readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set and create folders and file in original letter case", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                    const pathExists = readdirSync(path).indexOf(pathSegment) !== -1;
                    expect(pathExists).toBeTruthy();
                    return [path, pathSegment].join("/");
                }, ".");

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(data);
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

                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                const fileContents = stripNewLines(readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set that has been populated by upload and use file extension specified", async () => {
                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {
                    extension: "dat"
                };

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                const fileContents = stripNewLines(readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(data);
            });
        });

        describe("Partitioned data set - all members", () => {

            beforeEach(async () => {
                let error;
                let response;

                try {
                    response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                    await delay(delayTime);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                try {
                    response = await Delete.dataSet(REAL_SESSION, dsname);
                    await delay(delayTime);
                } catch (err) {
                    error = err;
                }

                // delete the top-level folder and the folders and file below
                const folders = file.split("/");
                const rc = rimraf(folders[0]);
            });

            it("should download a data set member", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/");
                file = file.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}/member.txt`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set member with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/");
                file = file.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}/member.txt`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set and create folders and file in original letter case", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/MEMBER.txt";

                // Check if folders and file are created in original uppercase
                file.split("/").reduce((path, pathSegment) => {
                    const pathExists = readdirSync(path).indexOf(pathSegment) !== -1;
                    expect(pathExists).toBeTruthy();
                    return [path, pathSegment].join("/");
                }, ".");

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(file).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/member.txt";
            });

            it("should download a data set in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/member.txt";
            });

            it("should download a data set and use file extension specified", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                await delay(delayTime);

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
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/member.dat";
            });
        });
        describe("Data sets matching - all data sets - PO", () => {

            beforeEach(async () => {
                let error;
                let response;

                try {
                    response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                    await delay(delayTime);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                try {
                    response = await Delete.dataSet(REAL_SESSION, dsname);
                    await delay(delayTime);
                } catch (err) {
                    error = err;
                }

                // delete the top-level folder and the folders and file below
                try {
                    const folders = file.split("/");
                    const rc = rimraf(folders[0]);
                } catch {
                    // Do nothing, sometimes the files are not created.
                }
            });

            it("should download a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname]);
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
                const fileContents = stripNewLines(readFileSync(`${file}/member.txt`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                const options: IDownloadOptions = {
                    binary: true,
                    extension: ".txt",
                    directory: "testDir",
                    excludePatterns: ["TEST.DATA.SET"]
                };

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], options);
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
                file = dsname.replace(regex, "/") + "/member.txt";
            });

            it.only("should download a data set in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                const options: IDownloadOptions = {
                    record: true,
                    extension: ".txt",
                    directory: "testDir",
                    excludePatterns: ["TEST.DATA.SET"]
                };

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], options);
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
                file = dsname.replace(regex, "/") + "/member.txt";
            });

            it("should download a data set with a different extension", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], {extension: "jcl"});
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
                const fileContents = stripNewLines(readFileSync(`${file}/member.jcl`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set with an extension map", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                const ending = dsname.split(".").pop().toLowerCase();
                const extMap: any = {};
                extMap[ending] = "jcl";

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], {extensionMap: extMap});
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
                const fileContents = stripNewLines(readFileSync(`${file}/member.jcl`).toString());
                expect(fileContents).toEqual(data);
            });

            it.only("should not download a data set if it is in the exclude map", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                const ending = dsname.split(".").pop();
                const excludePattern = defaultSystem.zosmf.user + ".ZOSFILE.DOWNLOAD.**." + ending;

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], {excludePatterns: [excludePattern]});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeFalsy();
                expect(response.commandResponse).toContain("No data sets left after excluded pattern(s) were filtered");

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.toLowerCase().replace(regex, "/");
                // Compare the downloaded contents to those uploaded
                const fileExists = existsSync(`${file}/member.jcl`);
                expect(fileExists).toEqual(false);
            });
        });

        describe("Data sets matching - all data sets - PS", () => {

            beforeEach(async () => {
                let error;
                let response;

                try {
                    response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                    await delay(delayTime);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                try {
                    response = await Delete.dataSet(REAL_SESSION, dsname);
                    await delay(delayTime);
                } catch (err) {
                    error = err;
                }

                // delete the top-level folder and the folders and file below
                const folders = file.split("/");
                const rc = rimraf(folders[0]);
            });

            it("should download a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname]);
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
                file = dsname.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}.txt`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                const options: IDownloadOptions = {
                    binary: true,
                    extension: ".txt",
                    directory: "testDir",
                    excludePatterns: ["TEST.DATA.SET"]
                };

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], options);
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
                file = dsname.replace(regex, "/") + "txt";
            });

            it.only("should download a data set in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                const options: IDownloadOptions = {
                    record: true,
                    extension: ".txt",
                    directory: "testDir",
                    excludePatterns: ["TEST.DATA.SET"]
                };

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], options);
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
                file = dsname.replace(regex, "/") + "txt";
            });

            it("should download a data set with a different extension", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], {extension: "jcl"});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                file = dsname.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}.jcl`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set with an extension map", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                const ending = dsname.split(".").pop().toLowerCase();
                const extMap: any = {};
                extMap[ending] = "jcl";

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], {extensionMap: extMap});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                file = dsname.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}.jcl`).toString());
                expect(fileContents).toEqual(data);
            });

            it.only("should not download a data set if it is in the exclude map", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                const ending = dsname.split(".").pop();
                const excludePattern = defaultSystem.zosmf.user + ".ZOSFILE.DOWNLOAD.**." + ending;

                try {
                    response = await Download.dataSetsMatchingPattern(REAL_SESSION, [dsname], {excludePatterns: [excludePattern]});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeFalsy();
                expect(response.commandResponse).toContain("No data sets left after excluded pattern(s) were filtered");

                file = dsname.toLowerCase();
                // Compare the downloaded contents to those uploaded
                const fileExists = existsSync(`${file}.jcl`);
                expect(fileExists).toEqual(false);
            });
        });
    });

    describe("Failure Scenarios", () => {
        afterAll(() => {
            // delete the top-level folder and the folders and file below
            const folders = dsname.split(".");
            rimraf(folders[0].toLowerCase());
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
            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                (await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint));
                await delay(delayTime);
            } catch (err) {
                Imperative.console.error(err);
            }

            // Delete created local file
            IO.deleteFile(`./${posix.basename(ussname)}`);
        });

        describe("Successful scenarios", () => {
            it("should download uss file without any options", async () => {
                let error;
                let response: IZosFilesResponse;

                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                (await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data));
                await delay(delayTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(data);

            });

            it("should download uss file with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                (await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data));
                await delay(delayTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, {responseTimeout: 5});
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(data);

            });

            it("should download uss file and return Etag", async () => {
                let error;
                let response: IZosFilesResponse;

                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

                (await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data));
                await delay(delayTime);

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
                const fileContents = stripNewLines(readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(data);

            });

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
                await delay(delayTime);

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

                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [ZosmfHeaders.X_IBM_BINARY], data);
                await delay(delayTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download ISO8859-1 uss file in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;
                const options: IDownloadOptions = {};

                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [ZosmfHeaders.X_IBM_BINARY], data);
                await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "ISO8859-1");
                await delay(delayTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download IBM-1147 uss file with encoding mode", async () => {
                let error;
                let response: IZosFilesResponse;
                const options: IDownloadOptions = {};

                const data: string = "Hello, world¤";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [ZosmfHeaders.X_IBM_TEXT], data);
                await Utilities.chtag(REAL_SESSION, ussname, Tag.TEXT, "IBM-1147");
                await delay(delayTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`./${posix.basename(ussname)}`).toString());
                expect(fileContents).toEqual(data.slice(0, -1) + "€");
            });

            it("should download uss file content to local file", async () => {

                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {file: `test1.txt`};

                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                (await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data));
                await delay(delayTime);

                try {
                    response = await Download.ussFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();

                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`test1.txt`).toString());
                expect(fileContents).toEqual(data);

                // Delete created local file
                IO.deleteFile("test1.txt");
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
});
