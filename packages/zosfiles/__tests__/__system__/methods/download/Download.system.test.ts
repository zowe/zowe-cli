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
    IUSSListOptions
} from "../../../../src";
import { IO, Session } from "@zowe/imperative";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName, stripNewLines, wait, waitTime } from "../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { posix } from "path";
import { Shell } from "@zowe/zos-uss-for-zowe-sdk";
import { PassThrough } from "stream";
import { text } from "stream/consumers";

const testData = "abcdefghijklmnopqrstuvwxyz";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string; //uss
let dsname_seq: string;
let dsname_part: string;
let dsname_all_po: string;
let dsname_all_ps: string;
let ussname: string;
let ussDirname: string;
let localDirname: string;
let file: string;

describe("All Download System Tests", () => {
    describe("Unencoded", () => {
        describe("Download Data Sets", () => {

            beforeAll(async () => {
                testEnvironment = await TestEnvironment.setUp({
                    testName: "zos_file_download"
                });
                defaultSystem = testEnvironment.systemTestProperties;

                REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
                testEnvironment.resources.session = REAL_SESSION;

                dsname_seq = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
                dsname_part = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
                dsname_all_po = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
                dsname_all_ps = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname_seq);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname_part);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname_all_po);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname_all_ps);
            });

            afterAll(async () => {
                testEnvironment.resources.datasets.push(dsname_seq, dsname_part, dsname_all_po, dsname_all_ps);
                await TestEnvironment.cleanUp(testEnvironment);
            });

            describe("Success Scenarios", () => {

                describe("Physical sequential data set", () => {
                    //this test needs to be first because it requires dir to be created as uppercase (other tests have no requirement)
                    it("should download a data set and create folders and file in original letter case", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        // Upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_seq);
                        await wait(waitTime); // Wait 2 seconds

                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq, { preserveOriginalLetterCase: true });
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain(
                            ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1)
                        );

                        // Convert the data set name to use as a path/file
                        const regex = /\./gi;
                        file = dsname_seq.replace(regex, "/") + ".txt";

                        // Check if folders and file are created in original uppercase
                        file.split("/").reduce((path, pathSegment) => {
                            const pathExists = fs.readdirSync(path).indexOf(pathSegment) !== -1;
                            expect(pathExists).toBeTruthy();
                            return [path, pathSegment].join("/");
                        }, ".");

                        // Add the file to localFiles resources for cleanup
                        testEnvironment.resources.localFiles.push(file);

                        // Compare the downloaded contents to those uploaded
                        const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                        expect(fileContents).toEqual(testData);
                    });

                    it("should download a data set", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        // Upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_seq);
                        await wait(waitTime); // Wait 2 seconds

                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq);
                            await wait(waitTime);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain(
                            ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1)
                        );

                        // Convert the data set name to use as a path/file
                        const regex = /\./gi;
                        file = dsname_seq.replace(regex, "/") + ".txt";
                        file = file.toLowerCase();

                        // Add the file to localFiles resources for cleanup
                        testEnvironment.resources.localFiles.push(file);

                        // Compare the downloaded contents to those uploaded
                        const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                        expect(fileContents).toEqual(testData);
                    });


                    it("should download a data set with response timeout", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_seq);
                        await wait(waitTime); // Wait 2 seconds

                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq, { responseTimeout: 5 });
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain(
                            ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1)
                        );

                        // Convert the data set name to use as a path/file
                        const regex = /\./gi;
                        file = dsname_seq.replace(regex, "/") + ".txt";
                        file = file.toLowerCase();

                        // Add the file to localFiles resources for cleanup
                        testEnvironment.resources.localFiles.push(file);

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
                            response = await Download.dataSet(REAL_SESSION, dsname_seq, options);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain(
                            ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1)
                        );

                        // Convert the data set name to use as a path/file
                        const regex = /\./gi;
                        file = dsname_seq.replace(regex, "/") + ".txt";

                        // Add the file to localFiles resources for cleanup
                        testEnvironment.resources.localFiles.push(file);
                    });
                    it("should download a data set in record mode", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        const options: IDownloadOptions = {
                            record: true
                        };

                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq, options);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain(
                            ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1)
                        );

                        // Convert the data set name to use as a path/file for cleanup
                        const regex = /\./gi;
                        file = dsname_seq.replace(regex, "/") + ".txt";

                        // Add the file to localFiles resources for cleanup
                        testEnvironment.resources.localFiles.push(file);
                    });

                    it("should download a data set and return Etag", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_seq);
                        await wait(waitTime); // Wait 2 seconds

                        const options: IDownloadOptions = {
                            returnEtag: true
                        };

                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq, options);
                        } catch (err) {
                            error = err;
                        }

                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain(
                            ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1)
                        );
                        expect(response.apiResponse.etag).toBeDefined();

                        // Convert the data set name to use as a path/file for cleanup
                        const regex = /\./gi;
                        file = dsname_seq.replace(regex, "/") + ".txt";
                        file = file.toLowerCase();

                        // Add the file to localFiles resources for cleanup
                        testEnvironment.resources.localFiles.push(file);

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

                        // Upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_seq);
                        await wait(waitTime); // Wait 2 seconds

                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq, options);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain(
                            ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1)
                        );

                        // Convert the data set name to use as a path/file
                        const regex = /\./gi;
                        file = dsname_seq.replace(regex, "/") + ".dat";
                        file = file.toLowerCase();

                        // Add the file to localFiles resources for cleanup
                        testEnvironment.resources.localFiles.push(file);

                        // Compare the downloaded contents to those uploaded
                        const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                        expect(fileContents).toEqual(testData);
                    });

                    it("should download a data set to a stream", async () => {
                        let error;
                        let response: IZosFilesResponse;
                        const responseStream = new PassThrough();

                        // Upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_seq);
                        await wait(waitTime); // Wait 2 seconds

                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq, { stream: responseStream });
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain(
                            ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1)
                        );

                        // Compare the downloaded contents to those uploaded
                        const fileContents = stripNewLines(await text(responseStream));
                        expect(fileContents).toEqual(testData);
                    });
                });

                describe("Partitioned data set - all members", () => {

                    it("should download a data set member", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        // upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_part + "(member)");
                        await wait(waitTime); //wait 2 seconds

                        try {
                            response = await Download.allMembers(REAL_SESSION, dsname_part);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("Data set downloaded successfully");

                        // Path file construction and assertion
                        const regex = /\./gi;
                        const file = dsname_part.replace(regex, "/") + "/member.txt";
                        testEnvironment.resources.localFiles.push(file);  // Add file to resources for cleanup

                        // Comparing the downloaded contents
                        const fileContents = stripNewLines(fs.readFileSync(file).toString());
                        expect(fileContents).toEqual(testData);
                    });

                    it("should download a data set and create folders and file in original letter case", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_part + "(member)");
                        await wait(waitTime);

                        try {
                            response = await Download.allMembers(REAL_SESSION, dsname_part, { preserveOriginalLetterCase: true });
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("Data set downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_part.replace(regex, "/") + "/MEMBER.txt";
                        testEnvironment.resources.localFiles.push(file);

                        const fileContents = stripNewLines(fs.readFileSync(file).toString());
                        expect(fileContents).toEqual(testData);
                    });

                    it("should download a data set in binary mode", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_part + "(member)");
                        await wait(waitTime);

                        try {
                            response = await Download.allMembers(REAL_SESSION, dsname_part, { binary: true });
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("Data set downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_part.replace(regex, "/") + "/member.txt";
                        testEnvironment.resources.localFiles.push(file);
                    });

                    it("should download a data set in record mode", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_part + "(member)");
                        await wait(waitTime);

                        try {
                            response = await Download.allMembers(REAL_SESSION, dsname_part, { record: true });
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("Data set downloaded successfully");

                        const regex = /\./gi;
                        file = dsname_part.replace(regex, "/") + "/member.txt";
                        testEnvironment.resources.localFiles.push(file);
                    });

                    it("should download a data set and use file extension specified", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_part + "(member)");
                        await wait(waitTime);

                        try {
                            response = await Download.allMembers(REAL_SESSION, dsname_part, { extension: "dat" });
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("Data set downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_part.replace(regex, "/") + "/member.dat";
                        testEnvironment.resources.localFiles.push(file);
                    });
                });

                describe("Data sets matching - all data sets - PO", () => {

                    it("should download a data set", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_po + "(member)");

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_po, dsorg: "PO", vol: "*" }]);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_all_po.toLowerCase().replace(regex, "/");
                        testEnvironment.resources.localFiles.push(file + "/member.txt");

                        const fileContents = stripNewLines(fs.readFileSync(file + "/member.txt").toString());
                        expect(fileContents).toEqual(testData);
                    });

                    it("should download a data set in binary mode", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_po + "(member)");

                        const options: IDownloadOptions = {
                            binary: true,
                            extension: ".txt",
                            directory: "testDir"
                        };

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_po, dsorg: "PO", vol: "*" }], options);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = "testDir/" + dsname_all_po.replace(regex, "/") + "/member.txt";
                        testEnvironment.resources.localFiles.push(file);
                    });

                    it("should download a data set in record mode", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_po + "(member)");

                        const options: IDownloadOptions = {
                            record: true,
                            extension: ".txt",
                            directory: "testDir"
                        };

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_po, dsorg: "PO", vol: "*" }], options);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = "testDir/" + dsname_all_po.replace(regex, "/") + "/member.txt";
                        testEnvironment.resources.localFiles.push(file);
                    });

                    it("should download a data set with a different extension", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_po + "(member)");

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_po, dsorg: "PO", vol: "*" }], {extension: "jcl"});
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_all_po.toLowerCase().replace(regex, "/");
                        testEnvironment.resources.localFiles.push(file + "/member.jcl");

                        const fileContents = stripNewLines(fs.readFileSync(file + "/member.jcl").toString());
                        expect(fileContents).toEqual(testData);
                    });

                    it("should download a data set with an extension map", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_po + "(member)");
                        const ending = dsname_all_po.split(".").pop().toLowerCase();
                        const extMap: any = {};
                        extMap[ending] = "jcl";

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_po, dsorg: "PO", vol: "*" }], {extensionMap: extMap});
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_all_po.toLowerCase().replace(regex, "/");
                        testEnvironment.resources.localFiles.push(file + "/member.jcl");

                        const fileContents = stripNewLines(fs.readFileSync(file + "/member.jcl").toString());
                        expect(fileContents).toEqual(testData);
                    });
                });

                describe("Data sets matching - all data sets - PS", () => {

                    it("should download a data set", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_ps);

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_ps, dsorg: "PS", vol: "*" }]);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_all_ps.toLowerCase() + ".txt";
                        const fileContents = stripNewLines(fs.readFileSync(file).toString());
                        expect(fileContents).toEqual(testData);
                    });

                    it("should download a data set in binary mode", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_ps);

                        const options: IDownloadOptions = {
                            binary: true,
                            extension: ".txt",
                            directory: "testDir"
                        };

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_ps, dsorg: "PS", vol: "*" }], options);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = "testDir/" + dsname_all_ps.toLowerCase() + ".txt";
                    });

                    it("should download a data set in record mode", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_ps);

                        const options: IDownloadOptions = {
                            record: true,
                            extension: ".txt",
                            directory: "testDir"
                        };

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_ps, dsorg: "PS", vol: "*" }], options);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = "testDir/" + dsname_all_ps.toLowerCase() + ".txt";
                    });

                    it("should download a data set with a different extension", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_ps);

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_ps, dsorg: "PS", vol: "*" }], {extension: "jcl"});
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_all_ps.toLowerCase() + ".jcl";
                        const fileContents = stripNewLines(fs.readFileSync(file).toString());
                        expect(fileContents).toEqual(testData);
                    });

                    it("should download a data set with an extension map", async () => {
                        let error;
                        let response;

                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_ps);
                        const ending = dsname_all_ps.split(".").pop().toLowerCase();
                        const extMap: any = {};
                        extMap[ending] = "jcl";

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_ps, dsorg: "PS", vol: "*" }], {extensionMap: extMap});
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        const regex = /\./gi;
                        const file = dsname_all_ps.toLowerCase() + ".jcl";
                        const fileContents = stripNewLines(fs.readFileSync(file).toString());
                        expect(fileContents).toEqual(testData);
                    });
                });

            });

            describe("Failure Scenarios", () => {
                describe("Physical sequential data set", () => {

                    it("should display proper error message when missing session", async () => {
                        let response;
                        let error;

                        try {
                            response = await Download.dataSet(undefined, dsname_seq);
                        } catch (err) {
                            error = err;
                        }

                        expect(response).toBeFalsy();
                        expect(error).toBeTruthy();
                        expect(error.message).toContain("Expect Error: Required object must be defined");
                    });

                    it("should display proper message when downloading a data set that does not exist", async () => {
                        let response;
                        let error;
                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq+".F");
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
                        let response;
                        let error;

                        try {
                            response = await Download.allMembers(undefined, dsname_part);
                        } catch (err) {
                            error = err;
                        }

                        expect(response).toBeFalsy();
                        expect(error).toBeTruthy();
                        expect(stripNewLines(error.message)).toContain("Expect Error: Required object must be defined");
                    });

                    it("should display a relevant message when downloading data set members and the data set does not exist", async () => {
                        let response;
                        let error;

                        try {
                            response = await Download.allMembers(REAL_SESSION, dsname_part + ".d");
                        } catch (err) {
                            error = err;
                        }

                        expect(response).toBeFalsy();
                        expect(error).toBeTruthy();
                        expect(stripNewLines(error.message)).toContain("Data set not cataloged");
                    });
                });
            });
        });

        describe("Download USS File", () => {
            beforeAll(async () => {
                testEnvironment = await TestEnvironment.setUp({
                    testName: "zos_file_download_uss"
                });
                defaultSystem = testEnvironment.systemTestProperties;

                REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
                testEnvironment.resources.session = REAL_SESSION;

                dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD.USS`);

                // using unique DS function to generate unique USS file name
                ussname = `${defaultSystem.unix.testdir}/${dsname}`;
                ussDirname = `${defaultSystem.unix.testdir}/zos_file_download`;
                localDirname = `${testEnvironment.workingDir}/ussDir`;
            });

            afterAll(async () => {
                // Track local and USS files for cleanup
                testEnvironment.resources.localFiles.push(localDirname);
                testEnvironment.resources.files.push(dsname, ussname, ussDirname);

                await TestEnvironment.cleanUp(testEnvironment);
            });

            describe("Successful scenarios", () => {
                it("should download uss file without any options", async () => {
                    let error;
                    let response: IZosFilesResponse;

                    await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                    await wait(waitTime); //wait 2 seconds

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
                    await wait(waitTime); //wait 2 seconds

                    try {
                        response = await Download.ussFile(REAL_SESSION, ussname, { responseTimeout: 5 });
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
                    await wait(waitTime); //wait 2 seconds

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
                    await wait(waitTime); //wait 2 seconds

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
                });

                it("should download uss file content in binary", async () => {
                    let error;
                    let response: IZosFilesResponse;

                    const options: IDownloadOptions = {
                        binary: true
                    };

                    await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData), { binary: true });
                    await wait(waitTime); //wait 2 seconds

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
                    await wait(waitTime); //wait 2 seconds

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
                    await wait(waitTime); //wait 2 seconds

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

                    const options: IDownloadOptions = { file: `test1.txt` };

                    await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                    await wait(waitTime); //wait 2 seconds

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
                    await wait(waitTime); //wait 2 seconds

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
                    testEnvironment = await TestEnvironment.setUp({
                        testName: "zos_file_download_uss_directory"
                    });
                    defaultSystem = testEnvironment.systemTestProperties;

                    REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
                    testEnvironment.resources.session = REAL_SESSION;

                    ussDirname = `${defaultSystem.unix.testdir}/zos_file_download`;
                    localDirname = `${testEnvironment.workingDir}/ussDir`;

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
                        await Create.uss(REAL_SESSION, directory, "directory");
                    }

                    // Create and mount file system
                    zfsName = getUniqueDatasetName(defaultSystem.zosmf.user);
                    await Create.zfs(REAL_SESSION, zfsName, createZfsOptions);
                    await Mount.fs(REAL_SESSION, zfsName, mountFolder, mountZfsOptions);

                    // Upload files
                    await Upload.bufferToUssFile(REAL_SESSION, testFile, Buffer.from(testFileContents));
                    await Upload.bufferToUssFile(REAL_SESSION, anotherTestFile, Buffer.from(anotherTestFileContents));
                    await Upload.bufferToUssFile(REAL_SESSION, binaryFile, Buffer.from(binaryFileContents), { binary: true });
                    await Utilities.chtag(REAL_SESSION, binaryFile, Tag.BINARY);

                    // Create symlink
                    const SSH_SESSION: any = TestEnvironment.createSshSession(testEnvironment);
                    await Shell.executeSshCwd(SSH_SESSION, `ln -s ${posix.basename(testFile)} ${posix.basename(testSymlink)}`, ussDirname, jest.fn());

                    testEnvironment.resources.files.push(testSymlink);
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
                    // await Delete.ussFile(REAL_SESSION, ussDirname, true);
                    testEnvironment.resources.localFiles.push(localDirname);
                    testEnvironment.resources.files.push(ussDirname);
                    await TestEnvironment.cleanUp(testEnvironment);
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

    describe("Encoded", () => {
        describe("Download Data Set - encoded", () => {

            beforeAll(async () => {
                testEnvironment = await TestEnvironment.setUp({
                    testName: "zos_file_download_encoded"
                });
                defaultSystem = testEnvironment.systemTestProperties;

                REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
                testEnvironment.resources.session = REAL_SESSION;

                dsname_seq = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`, true);
                dsname_part = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`, true);
                dsname_all_po = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`, true);
                dsname_all_ps = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`, true);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname_seq);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname_part);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname_all_po);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname_all_ps);

                // using unique DS function to generate unique USS file name
                ussname = `${defaultSystem.unix.testdir}/ENCO#ED${dsname}`;
                ussDirname = `${defaultSystem.unix.testdir}/ENCO#EDzos_file_download`;
                localDirname = `${testEnvironment.workingDir}/ENCO#EDussDir`;
            });

            afterAll(async () => {
                testEnvironment.resources.localFiles.push(localDirname);
                testEnvironment.resources.datasets.push(ussname, ussDirname);
                await TestEnvironment.cleanUp(testEnvironment);
            });

            describe("Success Scenarios", () => {

                describe("Physical sequential data set", () => {
                    it("should download a data set", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        // upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_seq);
                        await wait(waitTime); //wait 2 seconds

                        try {
                            response = await Download.dataSet(REAL_SESSION, dsname_seq);
                        } catch (err) {
                            error = err;
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
                });

                describe("Partitioned data set - all members", () => {
                    it("should download a data set member", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        // upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_part + "(member)");
                        await wait(waitTime); //wait 2 seconds

                        try {
                            response = await Download.allMembers(REAL_SESSION, dsname_part);
                        } catch (err) {
                            error = err;
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
                        const fileContents = stripNewLines(fs.readFileSync(`${file}/member.txt`).toString());
                        expect(fileContents).toEqual(testData);
                    });
                });

                describe("Data sets matching - all data sets - PO", () => {
                    it("should download a data set", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        // upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_po + "(member)");

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_po, dsorg: "PO", vol: "*" }]);
                        } catch (err) {
                            error = err;
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
                });

                describe("Data sets matching - all data sets - PS", () => {

                    it("should download a data set", async () => {
                        let error;
                        let response: IZosFilesResponse;

                        // upload data to the newly created data set
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testData), dsname_all_ps);

                        try {
                            response = await Download.allDataSets(REAL_SESSION, [{ dsname: dsname_all_ps, dsorg: "PS", vol: "*" }]);
                        } catch (err) {
                            error = err;
                        }
                        expect(error).toBeFalsy();
                        expect(response).toBeTruthy();
                        expect(response.success).toBeTruthy();
                        expect(response.commandResponse).toContain("1 data set(s) downloaded successfully");

                        file = dsname_all_ps.toLowerCase() + ".txt";
                        // Compare the downloaded contents to those uploaded
                        const fileContents = stripNewLines(fs.readFileSync(`${file}`).toString());
                        expect(fileContents).toEqual(testData);
                    });
                });
            });
        });

        describe("Download USS File - encoded", () => {
            beforeAll(async () => {
                testEnvironment = await TestEnvironment.setUp({
                    testName: "zos_file_download_uss_encoded"
                });
                defaultSystem = testEnvironment.systemTestProperties;

                REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
                testEnvironment.resources.session = REAL_SESSION;

                // using unique DS function to generate unique USS file name
                ussname = `${defaultSystem.unix.testdir}/ENCO#ED${getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`, true)}`;
            });

            afterAll(async () => {
                testEnvironment.resources.files.push(ussname);
                await TestEnvironment.cleanUp(testEnvironment);
            });

            describe("Successful scenarios", () => {
                it("should download uss file without any options", async () => {
                    let error;
                    let response: IZosFilesResponse;

                    // Upload the USS file
                    await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                    await wait(waitTime); // wait 2 seconds

                    try {
                        // Download the USS file
                        response = await Download.ussFile(REAL_SESSION, ussname);
                    } catch (err) {
                        error = err;
                    }
                    expect(error).toBeFalsy();
                    expect(response).toBeTruthy();

                    // Compare the downloaded contents to those uploaded
                    const fileContents = stripNewLines(fs.readFileSync(`./${posix.basename(ussname)}`).toString());
                    expect(fileContents).toEqual(testData);

                    // Track the local file created during the download
                    testEnvironment.resources.localFiles.push(`./${posix.basename(ussname)}`);
                });

                it("should download uss file content to local file", async () => {
                    let error;
                    let response: IZosFilesResponse;

                    const options: IDownloadOptions = { file: `test1.txt` };

                    // Upload the USS file
                    await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(testData));
                    await wait(waitTime); // wait 2 seconds

                    try {
                        // Download the USS file to a local file
                        response = await Download.ussFile(REAL_SESSION, ussname, options);
                    } catch (err) {
                        error = err;
                    }
                    expect(error).toBeFalsy();
                    expect(response).toBeTruthy();

                    // Compare the downloaded contents to those uploaded
                    const fileContents = stripNewLines(fs.readFileSync(`test1.txt`).toString());
                    expect(fileContents).toEqual(testData);

                    // Track the local file created during the test
                    testEnvironment.resources.localFiles.push(`test1.txt`);
                });
            });
        });

        describe("Download USS Directory - encoded", () => {
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

                    const depth = options.depth || 0;
                    expect(fs.existsSync(`${dirname}/parentFolder/childFolder`)).toBe(depth !== 1);
                    if (depth !== 1) {
                        expect(fs.readFileSync(`${dirname}/parentFolder/childFolder/anotherTestFile.txt`, "utf-8")).toBe(anotherTestFileContents);
                    }

                    const filesys = options.filesys || false;
                    expect(fs.existsSync(`${dirname}/mountFolder`)).toBe(filesys);
                    if (filesys) {
                        expect(fs.readFileSync(`${dirname}/mountFolder/binaryFile.bin`, "utf-8")).toBe(binaryFileContents);
                    }

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

                    testEnvironment = await TestEnvironment.setUp({
                        testName: "download_uss_dir_encoded"
                    });
                    REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
                    testEnvironment.resources.session = REAL_SESSION;

                    // Create directories
                    for (const directory of [ussDirname, emptyFolder, parentFolder, childFolder, mountFolder]) {
                        await Create.uss(REAL_SESSION, directory, "directory");
                    }

                    // Create and mount file system
                    zfsName = getUniqueDatasetName(defaultSystem.zosmf.user, true);
                    await Create.zfs(REAL_SESSION, zfsName, createZfsOptions);
                    await Mount.fs(REAL_SESSION, zfsName, mountFolder, mountZfsOptions);

                    // Upload files
                    await Upload.bufferToUssFile(REAL_SESSION, testFile, Buffer.from(testFileContents));
                    await Upload.bufferToUssFile(REAL_SESSION, anotherTestFile, Buffer.from(anotherTestFileContents));
                    await Upload.bufferToUssFile(REAL_SESSION, binaryFile, Buffer.from(binaryFileContents), { binary: true });
                    await Utilities.chtag(REAL_SESSION, binaryFile, Tag.BINARY);

                    testEnvironment.resources.files.push(testFile, anotherTestFile, binaryFile);

                    // Create symlink
                    const SSH_SESSION: any = TestEnvironment.createSshSession(testEnvironment);
                    await Shell.executeSshCwd(SSH_SESSION, `ln -s ${posix.basename(testFile)} ${posix.basename(testSymlink)}`, ussDirname, jest.fn());                    testEnvironment.resources.files.push(ussDirname, mountFolder, testFile, anotherTestFile, binaryFile, testSymlink);
                });

                afterAll(async () => {
                    testEnvironment.resources.localFiles.push(localDirname);
                    await TestEnvironment.cleanUp(testEnvironment);
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
        });
    });
});