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

import { Create, CreateDataSetTypeEnum, Delete, IUploadOptions, IZosFilesResponse,
    Upload, ZosFilesMessages, Download, Get, IUploadMap, Utilities } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { deleteFiles, getUniqueDatasetName, stripNewLines, wait, waitTime } from "../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { runCliScript } from "../../../../../../__tests__/__packages__/cli-test-utils/src";
import { Readable } from "stream";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let ussname: string;
const inputfile = __dirname + "/testfiles/upload.txt";
const testdata = "abcdefghijklmnopqrstuvwxyz";
const encodedTestData = "á é í ó ú ñ Ç ß 12345 !@#$% ^ [ ] $ £";
const uploadOptions: IUploadOptions = {} as any;

describe("Upload Data Set", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_upload"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`);
        Imperative.console.info("Using dsname:" + dsname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success Scenarios", () => {

        describe("Physical sequential", () => {

            beforeEach(async () => {
                uploadOptions.etag = undefined;
                uploadOptions.returnEtag = undefined;

                try {
                    await Create.dataSet(REAL_SESSION,
                        CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {

                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    // Do nothing
                }
            });

            it("should upload a file to a physical sequential data set using full path", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a physical sequential data set with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname, {responseTimeout: 5});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a physical sequential data set while passing correct Etag", async () => {
                let error;
                let response: IZosFilesResponse;

                // first we have to get the Etag, so we can compare it. We do it by preemtively downloading the file and requesting Etag
                await Upload.fileToDataset(REAL_SESSION, __dirname + "/testfiles/upload.txt", dsname);
                const downloadOptions = {file: __dirname + "/testfiles/upload.txt", returnEtag: true};
                const downloadResponse = await Download.dataSet(REAL_SESSION, dsname, downloadOptions);
                expect(downloadResponse.success).toBeTruthy();
                expect(downloadResponse.apiResponse.etag).toBeDefined();

                try {
                    uploadOptions.etag = downloadResponse.apiResponse.etag;
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION, __dirname + "/testfiles/upload.txt", dsname, uploadOptions);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a physical sequential data set and return the Etag", async () => {
                let error;
                let response: IZosFilesResponse;
                uploadOptions.returnEtag = true;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname, uploadOptions);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
                expect(response.apiResponse[0].etag).toBeDefined();
            });

            it("should upload a file to a physical sequential data set using relative path", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        "./packages/zosfiles/__tests__/__system__/methods/upload/testfiles/upload.txt", dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            // Since this test is platform specific, only run it on Windows
            (process.platform === "win32" ? it : it.skip)("should upload a file to a physical sequential data set using Windows relative path",
                async () => {
                    let error;
                    let response: IZosFilesResponse;

                    try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                        response = await Upload.fileToDataset(REAL_SESSION,
                            ".\\packages\\zosfiles\\__tests__\\__system__\\methods\\upload\\testfiles\\upload.txt", dsname);
                        Imperative.console.info("Response: " + inspect(response));
                    } catch (err) {
                        error = err;
                        Imperative.console.info("Error: " + inspect(error));
                    }
                    expect(error).toBeFalsy();
                    expect(response).toBeTruthy();
                    expect(response.success).toBeTruthy();
                    expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
                });

            it("should upload a file to a physical sequential data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                uploadOptions.binary = true;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname, uploadOptions);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a physical sequential data set in binary mode with record specified", async () => {
                let error;
                let response: IZosFilesResponse;

                uploadOptions.binary = true;
                uploadOptions.record = true;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname, uploadOptions);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a physical sequential data set in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                uploadOptions.record = true;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname, uploadOptions);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should display proper error when specifying dir instead of a file", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles", dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingInputFile.message);
            });
        });

        describe("Partitioned data set", () => {

            beforeEach(async () => {

                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {

                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    // Do nothing
                }
            });

            it("should upload a PDS file - bufferToDataSet()", async () => {
                let error;
                let uploadResponse;
                let getResponse;
                const data: Buffer = Buffer.from(testdata);

                try {
                    uploadResponse = await Upload.bufferToDataSet(REAL_SESSION, data, dsname+"(TEST)");
                    getResponse = await Get.dataSet(REAL_SESSION, dsname+"(TEST)");
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();

                expect(uploadResponse.apiResponse).toMatchObject({
                    success: true,
                    from: "<Buffer 61 62 63 64 65 66 67 68 69 6a...>",
                    to: dsname + "(TEST)",
                });
                expect(Buffer.from(getResponse.toString().trim())).toEqual(data);
            });

            it("should upload a PDS file - streamToDataSet()", async () => {
                let error;
                let uploadResponse;
                let getResponse;

                const inputStream = new Readable();
                inputStream.push(testdata);
                inputStream.push(null);

                try {
                    uploadResponse = await Upload.streamToDataSet(REAL_SESSION, inputStream, dsname+"(TEST)");
                    getResponse = await Get.dataSet(REAL_SESSION, dsname+"(TEST)");
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();

                expect(uploadResponse.apiResponse).toMatchObject({"success": true, "from": "[Readable]","to": dsname+"(TEST)"});
                expect(getResponse.toString().trim()).toEqual(testdata);
            });

            it("should upload a file to a partitioned data set member using full path", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname + "(member)");
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a partitioned data set member with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname + "(member)", {responseTimeout: 5});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a partitioned data set member using relative path", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        "./packages/zosfiles/__tests__/__system__/methods/upload/testfiles/upload.txt", dsname + "(member)");
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            // Since this test is platform specific, only run it on Windows
            (process.platform === "win32" ? it : it.skip)("should upload a file to a partitioned data set member using Windows relative path",
                async () => {
                    let error;
                    let response: IZosFilesResponse;

                    try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                        response = await Upload.fileToDataset(REAL_SESSION,
                            ".\\packages\\zosfiles\\__tests__\\__system__\\methods\\upload\\testfiles\\upload.txt", dsname + "(member)");
                        Imperative.console.info("Response: " + inspect(response));
                    } catch (err) {
                        error = err;
                        Imperative.console.info("Error: " + inspect(error));
                    }
                    expect(error).toBeFalsy();
                    expect(response).toBeTruthy();
                    expect(response.success).toBeTruthy();
                    expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
                });

            it("should upload a file to a partitioned data set member in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                uploadOptions.binary = true;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname + "(member)", uploadOptions);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a partitioned data set member in binary mode with record specified", async () => {
                let error;
                let response: IZosFilesResponse;

                uploadOptions.binary = true;
                uploadOptions.record = true;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname + "(member)", uploadOptions);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload a file to a partitioned data set member in record mode", async () => {
                let error;
                let response: IZosFilesResponse;

                uploadOptions.record = true;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname + "(member)", uploadOptions);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });

            it("should upload files in a directory to a partitioned data set member using full path", async () => {
                let error;
                let response: IZosFilesResponse;

                try {

                    response = await Upload.dirToPds(REAL_SESSION, __dirname + "/testfiles", dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });
        });
    });

    describe("Failure Scenarios", () => {

        beforeEach(async () => {

            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            } catch (err) {
                // Do nothing
            }
        });

        afterEach(async () => {

            try {
                await Delete.dataSet(REAL_SESSION, dsname);
            } catch (err) {
                // Do nothing
            }
        });

        it("should display proper error when not specifying file", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                response = await Upload.fileToDataset(REAL_SESSION,
                    __dirname + "/testfiles", dsname);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingInputFile.message);
        });

        it("should display proper error when not specifying data set", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                response = await Upload.fileToDataset(REAL_SESSION,
                    __dirname + "/testfiles/upload.text", "");
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should display proper error when specifying file instead of directory", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                response = await Upload.dirToPds(REAL_SESSION,
                    __dirname + "/testfiles/upload.txt", dsname);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(stripNewLines(error.message)).toContain("is not a directory"); // pathIsNotDirectory error
        });

        it("should display proper error when specifying dir instead of a file", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                response = await Upload.fileToDataset(REAL_SESSION,
                    __dirname + "/testfiles", dsname);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingInputFile.message);
        });

        it("should display proper error when uploading the contents of a dir to a partitioned data set member", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                // packages/zosfiles/__tests__/__system__/api/methods/upload/
                response = await Upload.dirToPds(REAL_SESSION,
                    __dirname + "/testfiles", dsname + "(member)");
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.uploadDirectoryToDatasetMember.message);
        });

        it("should display proper error is line in file exceeds record length of data set", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                response = await Upload.fileToDataset(REAL_SESSION,
                    __dirname + "/testfiles//longline/longline.txt", dsname);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(response).toBeTruthy();
            expect(response.success).toBeFalsy();
            expect(stripNewLines(response.commandResponse)).toContain("Truncation of a record occurred during an I/O operation");
        });
    });
});

describe("Upload Data Set - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_upload"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`, true);
        Imperative.console.info("Using dsname:" + dsname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success Scenarios", () => {

        describe("Physical sequential", () => {

            beforeEach(async () => {
                uploadOptions.etag = undefined;
                uploadOptions.returnEtag = undefined;

                try {
                    await Create.dataSet(REAL_SESSION,
                        CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    // Do nothing
                }
            });

            it("should upload a file to a physical sequential data set using full path", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });
        });

        describe("Partitioned data set", () => {

            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    // Do nothing
                }
            });

            it("should upload a file to a partitioned data set member using full path", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    // packages/zosfiles/__tests__/__system__/api/methods/upload/
                    response = await Upload.fileToDataset(REAL_SESSION,
                        __dirname + "/testfiles/upload.txt", dsname + "(member)");
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetUploadedSuccessfully.message);
            });
        });
    });
});

describe("Upload USS file", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_upload_uss"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`);
        ussname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success Scenarios", () => {

        beforeEach(async () => {
            uploadOptions.etag = undefined;
            fs.writeFileSync(inputfile, testdata);
        });

        afterEach(async () => {
            await deleteFiles(REAL_SESSION, ussname);
        });

        it("should upload a USS file - bufferToUssFile()", async () => {
            let error;
            let uploadResponse;
            let getResponse;
            const data: Buffer = Buffer.from(testdata);

            try {
                uploadResponse = await Upload.bufferToUssFile(REAL_SESSION, ussname, data);
                getResponse = await Get.USSFile(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();

            expect(uploadResponse.apiResponse).toMatchObject({"success": true, "from": "<Buffer 61 62 63 64 65 66 67 68 69 6a...>","to": ussname});
            expect(getResponse).toEqual(Buffer.from(data.toString()));
        });

        it("should upload a USS file - streamToUssFile()", async () => {
            let error;
            let uploadResponse;
            let getResponse;
            const inputStream = new Readable();
            inputStream.push(testdata);
            inputStream.push(null);

            try {
                uploadResponse = await Upload.streamToUssFile(REAL_SESSION, ussname, inputStream);
                getResponse = await Get.USSFile(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();

            expect(uploadResponse.apiResponse).toMatchObject({"success": true, "from": "[Readable]","to": ussname});
            expect(getResponse).toEqual(Buffer.from(testdata));
        });

        it("should upload a USS file in binary mode", async () => {
            let error;
            let getResponse;
            let tagResponse;

            const data: Buffer = Buffer.from(testdata);

            try {
                await Upload.bufferToUssFile(REAL_SESSION, ussname, data, { binary: true });
                getResponse = await Get.USSFile(REAL_SESSION, ussname, {binary: true});
                tagResponse = await Utilities.isFileTagBinOrAscii(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(getResponse).toEqual(Buffer.from(data.toString()));
            expect(tagResponse).toBe(true);
        });
        it("should upload a USS file from local file", async () => {
            let error;
            let getResponse;
            let tagResponse;

            try {
                await Upload.fileToUssFile(REAL_SESSION, inputfile, ussname);
                getResponse = await Get.USSFile(REAL_SESSION, ussname);
                tagResponse = await Utilities.isFileTagBinOrAscii(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(getResponse).toEqual(Buffer.from(testdata));
            expect(tagResponse).toBe(false);
        });
        it("should upload a USS file from local file in binary mode", async () => {
            let error;
            let getResponse;
            let tagResponse;

            try {
                await Upload.fileToUssFile(REAL_SESSION, inputfile, ussname, { binary: true });
                getResponse = await Get.USSFile(REAL_SESSION, ussname, {binary: true});
                tagResponse = await Utilities.isFileTagBinOrAscii(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(getResponse).toEqual(Buffer.from(testdata));
            expect(tagResponse).toBe(true);

        });
        it("should upload a USS file while passing correct Etag", async () => {
            let error;
            let uploadResponse;

            // first we have to get the Etag, so we can compare it. We do it by preemtively downloading the file and requesting Etag
            await Upload.fileToUssFile(REAL_SESSION, inputfile, ussname, {returnEtag: false});
            const downloadResponse = await Download.ussFile(REAL_SESSION, ussname, {file: inputfile, returnEtag: true});
            expect(downloadResponse.success).toBeTruthy();
            expect(downloadResponse.apiResponse.etag).toBeDefined();

            try {
                uploadResponse = await Upload.fileToUssFile(REAL_SESSION, inputfile, ussname, {etag: downloadResponse.apiResponse.etag});
                Imperative.console.info("Response: " + inspect(uploadResponse));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeTruthy();
            expect(uploadResponse.success).toBeTruthy();
            expect(uploadResponse.commandResponse).toContain(ZosFilesMessages.ussFileUploadedSuccessfully.message);
        });
        it("should upload a USS file and return Etag", async () => {
            let error;
            let uploadResponse;

            try {
                uploadResponse = await Upload.fileToUssFile(REAL_SESSION, inputfile, ussname, {returnEtag: true});
                await Get.USSFile(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeTruthy();
            expect(uploadResponse.success).toBeTruthy();
            expect(uploadResponse.apiResponse.etag).toBeDefined();
        });
        it("should upload local file to USS using .zosattributes file", async () => {
            let response: any;
            let error;
            let readResponseGood: any;
            let readResponseBad: any;
            try {
                // Upload file
                response = runCliScript(__dirname + "/__resources__/upload_file_to_uss.sh", testEnvironment,[
                    defaultSystem.tso.account,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    __dirname + "/testfiles/encodingCheck.txt",
                    ussname,
                    __dirname + "/__resources__/.zosattributes",
                ]);
                // View file with matching encoding
                readResponseGood = runCliScript(__dirname + "/__resources__/view_file_uss.sh", testEnvironment,[
                    defaultSystem.tso.account,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    ussname,
                    1047
                ]);
                // View file with not matching encoding
                readResponseBad = runCliScript(__dirname + "/__resources__/view_file_uss.sh", testEnvironment,[
                    defaultSystem.tso.account,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    ussname,
                    1147
                ]);
            }
            catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            // Get contents of file that was uploaded
            const fileContents = fs.readFileSync(__dirname + "/testfiles/encodingCheck.txt").toString();

            // Ensure upload was successful
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toBeDefined();
            expect(response.stdout.toString()).toContain("USS file uploaded successfully.");

            // Compare file view with not matching upload and view encoding (1047 vs 1147).
            expect(readResponseBad.stdout.toString()).not.toContain(fileContents);

            // Compare file view with matching upload and view encoding (1047).
            expect(readResponseGood.stdout.toString()).toContain(fileContents);
        });
        it("should upload local file to USS using .zosattributes file - binary", async () => {
            let response: any;
            let error;
            let readResponseGood: any;
            let readResponseBad: any;
            try {
                // Upload file
                response = runCliScript(__dirname + "/__resources__/upload_file_to_uss.sh", testEnvironment,[
                    defaultSystem.tso.account,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    __dirname + "/testfiles/encodingCheckBinary.txt",
                    ussname,
                    __dirname + "/__resources__/.zosattributes-binary",
                ]);
                // View file with .txt binary encoding in .zosattributes
                readResponseGood = runCliScript(__dirname + "/__resources__/view_file_uss_binary.sh", testEnvironment,[
                    defaultSystem.tso.account,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    ussname,
                    true
                ]);
                readResponseBad = runCliScript(__dirname + "/__resources__/view_file_uss.sh", testEnvironment,[
                    defaultSystem.tso.account,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    ussname,
                    "1047"
                ]);
            }
            catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            const fileContents = fs.readFileSync(__dirname + "/testfiles/encodingCheckBinary.txt").toString();

            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toBeDefined();
            expect(response.stdout.toString()).toContain("USS file uploaded successfully.");

            // Compare file view with not matching upload and view encoding (1047 vs 1147).
            expect(readResponseBad.stdout.toString()).not.toContain(fileContents);

            // Compare file view with matching upload and view encoding (1047).
            expect(readResponseGood.stdout.toString()).toContain(fileContents);
        });
    });
});

describe("Upload USS file - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_upload_uss"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`, true);
        ussname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/ENCO#ED${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success Scenarios", () => {

        beforeEach(async () => {
            uploadOptions.etag = undefined;
            fs.writeFileSync(inputfile, testdata);
        });

        afterEach(async () => {
            await deleteFiles(REAL_SESSION, ussname);
        });

        it("should upload a USS file", async () => {
            let error;
            let getResponse;
            const data: Buffer = Buffer.from(testdata);

            try {
                await Upload.bufferToUssFile(REAL_SESSION, ussname, data);
                getResponse = await Get.USSFile(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(getResponse).toEqual(Buffer.from(data.toString()));

        });

        it("should upload a USS file from local file", async () => {
            let error;
            let getResponse;
            let tagResponse;

            try {
                await Upload.fileToUssFile(REAL_SESSION, inputfile, ussname);
                getResponse = await Get.USSFile(REAL_SESSION, ussname);
                tagResponse = await Utilities.isFileTagBinOrAscii(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(getResponse).toEqual(Buffer.from(testdata));
            expect(tagResponse).toBe(false);

        });
    });
});

describe("Upload a local directory to USS directory", () => {
    describe("Success scenarios", () => {
        const localDir = `${__dirname}/testfiles`;
        const localDirWithSpaces = `${__dirname}/testfiles/space dir`;
        let tempUssname: string;
        beforeAll(async () => {
            testEnvironment = await TestEnvironment.setUp({
                testName: "zos_file_upload_dir_to_uss"
            });
            defaultSystem = testEnvironment.systemTestProperties;

            REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

            dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`);
            ussname = dsname.replace(/\./g, "");
            ussname = `${defaultSystem.unix.testdir}/${ussname}`;
            Imperative.console.info("Using ussfile:" + ussname);
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
        });

        beforeEach(() => {
            tempUssname = null;
        });

        afterEach(async () => {
            await deleteFiles(REAL_SESSION, tempUssname ?? ussname);
        });

        it("should upload local directory to USS", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: boolean;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, localDir, ussname);
                await wait(waitTime);
                Imperative.console.info(`THIS IS USS ${ussname}/testfiles`);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
        });

        it("should upload local directory (with space in name) to USS", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: boolean;
            try {
                tempUssname = ussname + " space dir";
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, localDirWithSpaces, tempUssname);
                await wait(waitTime);
                Imperative.console.info(`THIS IS USS ${tempUssname}`);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, tempUssname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
        });

        it("should upload local directory to USS recursively", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: any;
            try {
                uploadResponse = await Upload.dirToUSSDirRecursive(REAL_SESSION, localDir, ussname, {binary: false});
                await wait(waitTime);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, `${ussname}/longline`);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
        });

        it("should upload local directory to USS with an encoding", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: any;
            let getResponse;
            let getResponseBinary;
            let getResponseDiffEncoding;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, localDir, ussname, {encoding: "IBM-1047"});
                await wait(waitTime);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, ussname);
                getResponse = await Get.USSFile(REAL_SESSION, `${ussname}/file4.txt`, {encoding: "IBM-1047"});
                getResponseBinary = await Get.USSFile(REAL_SESSION, `${ussname}/file4.txt`, {binary: true});
                getResponseDiffEncoding = await Get.USSFile(REAL_SESSION, `${ussname}/file4.txt`, {encoding: "IBM-1147"});
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
            expect(getResponse).toEqual(Buffer.from(encodedTestData));
            expect(getResponseBinary).not.toEqual(Buffer.from(encodedTestData));
            expect(getResponseDiffEncoding).not.toEqual(Buffer.from(encodedTestData));
        });
        it("should upload local directory to USS in binary mode", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: any;
            let getResponse;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, localDir, ussname, {binary: true});
                await wait(waitTime);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, ussname);
                getResponse = await Get.USSFile(REAL_SESSION, `${ussname}/file1.txt`, {binary: true});
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
            expect(getResponse).toEqual(Buffer.from(testdata));
        });

        it("should upload local directory to USS recursively and all files in binary mode", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            const magicNum = 6;
            let isDirectoryExist: any;
            let getResponse;
            let longResponse: string = "";
            try {
                uploadResponse = await Upload.dirToUSSDirRecursive(REAL_SESSION, localDir, ussname, {binary: true});
                await wait(waitTime);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, ussname);
                getResponse = await Get.USSFile(REAL_SESSION, `${ussname}/longline/longline.txt`, {binary: true});
                for (let i = 0; i < magicNum; i++) {
                    longResponse += testdata;
                }
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
            expect(getResponse).toEqual(Buffer.from(longResponse));
        });

        it("should upload local directory to USS some files need to be uploaded as binary", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: any;
            let getResponseFile3;
            let getResponseFile1;
            let getResponseLongFile;
            let longResponse: string = "";
            const magicNum = 6;
            const fileMap: IUploadMap = {binary: true, fileNames: ["file3.txt", "longline.txt"]};
            try {
                uploadResponse = await Upload.dirToUSSDirRecursive(REAL_SESSION, localDir, ussname, {binary: false, filesMap: fileMap});
                await wait(waitTime);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, `${ussname}/longline`);
                // file3.txt should be binary as it is mentioned in filesMap
                getResponseFile3 = await Get.USSFile(REAL_SESSION, `${ussname}/file3.txt`, {binary: true});
                // longline/longline.txt should be binary as it is mentioned in filesMap
                getResponseLongFile = await Get.USSFile(REAL_SESSION, `${ussname}/longline/longline.txt`, {binary: true});
                // file1.txt should be ASCII like other files not mentioned in filesMap
                getResponseFile1 = await Get.USSFile(REAL_SESSION, `${ussname}/file1.txt`, {binary: false});
                for (let i = 0; i < magicNum; i++) {
                    longResponse += testdata;
                }
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
            expect(getResponseFile3).toEqual(Buffer.from(testdata));
            expect(getResponseLongFile).toEqual(Buffer.from(longResponse));
            expect(getResponseFile1.toString()).toEqual(testdata);
        });

        it("should upload local directory to USS some files need to be uploaded as ASCII", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: any;
            let getResponseFile3;
            let getResponseFile1;
            let getResponseLongFile;
            let longResponse: string = "";
            const magicNum = 6;
            const filesMap: IUploadMap = {binary: false, fileNames: ["file3.txt", "longline.txt"]};
            try {
                uploadResponse = await Upload.dirToUSSDirRecursive(REAL_SESSION, localDir, ussname, {binary: true, filesMap});
                await wait(waitTime);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, `${ussname}/longline`);
                // file3.txt should be ASCII as it is mentioned in filesMap
                getResponseFile3 = await Get.USSFile(REAL_SESSION, `${ussname}/file3.txt`, {binary: false});
                // longline/longline.txt should be ASCII as it is mentioned in filesMap
                getResponseLongFile = await Get.USSFile(REAL_SESSION, `${ussname}/longline/longline.txt`, {binary: false});
                // file1.txt should be binary like other files not mentioned in filesMap
                getResponseFile1 = await Get.USSFile(REAL_SESSION, `${ussname}/file1.txt`, {binary: true});
                for (let i = 0; i < magicNum; i++) {
                    longResponse += testdata;
                }
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
            expect(getResponseFile3).toEqual(Buffer.from(testdata));
            expect(getResponseLongFile).toEqual(Buffer.from(longResponse));
            expect(getResponseFile1).toEqual(Buffer.from(testdata));
        });
    });

    describe("Fail scenarios", () => {
        beforeAll(async () => {
            testEnvironment = await TestEnvironment.setUp({
                testName: "zos_file_upload_dir_to_uss"
            });
            defaultSystem = testEnvironment.systemTestProperties;

            REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

            Imperative.console.info("Using ussfile:" + ussname);
            testEnvironment.resources.files.push(ussname);
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
        });

        it("should throw an error if local directory is null", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, null, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeDefined();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingInputDirectory.message);
            expect(uploadResponse).not.toBeDefined();
        });

        it("should throw an error if local directory is empty string", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, "", ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeDefined();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingInputDirectory.message);
            expect(uploadResponse).not.toBeDefined();
        });

        it("should throw an error if passed local directory doesn't exist", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, "some/path", ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeDefined();
            expect(stripNewLines(error.message)).toContain("no such file or directory");
            expect(uploadResponse).not.toBeDefined();
        });

        it("should throw an error if passed local directory is file", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, `${__dirname}/testfiles/file1.txt`, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeDefined();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingInputDirectory.message);
            expect(uploadResponse).not.toBeDefined();
        });

        it("should throw an error if USS directory path is null", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, "some/path", null);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeDefined();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingUSSDirectoryName.message);
            expect(uploadResponse).not.toBeDefined();
        });

        it("should throw an error if USS directory path is empty string", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, "some/path", "");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeDefined();
            expect(stripNewLines(error.message)).toContain(ZosFilesMessages.missingUSSDirectoryName.message);
            expect(uploadResponse).not.toBeDefined();
        });

        it("should throw an error if uploading file is binary but we are uploading it as ASCII", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, `${__dirname}/failtestfiles`, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeDefined();
            expect(error.message).toContain("Illegal character sequence detected by iconv()");
            expect(uploadResponse).toBeUndefined();
        });
    });
});


describe("Upload a local directory to USS directory - encoded", () => {
    describe("Success scenarios", () => {
        const localDir = `${__dirname}/testfiles`;
        const localDirWithSpaces = `${__dirname}/testfiles/space dir`;
        let tempUssname: string;
        beforeAll(async () => {
            testEnvironment = await TestEnvironment.setUp({
                testName: "zos_file_upload_dir_to_uss"
            });
            defaultSystem = testEnvironment.systemTestProperties;

            REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

            dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`, true);
            ussname = dsname.replace(/\./g, "");
            ussname = `${defaultSystem.unix.testdir}/ENCO#ED${ussname}`;
            Imperative.console.info("Using ussfile:" + ussname);
        });

        beforeEach(() => {
            tempUssname = null;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
        });

        afterEach(async () => {
            await deleteFiles(REAL_SESSION, tempUssname ?? ussname);
        });

        it("should upload local directory to USS", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: boolean;
            try {
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, localDir, ussname);
                await wait(waitTime);
                Imperative.console.info(`THIS IS USS ${ussname}/testfiles`);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, ussname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
        });

        it("should upload local directory (with space in name) to USS", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: boolean;
            try {
                tempUssname = ussname + " space dir";
                uploadResponse = await Upload.dirToUSSDir(REAL_SESSION, localDirWithSpaces, tempUssname);
                await wait(waitTime);
                Imperative.console.info(`THIS IS USS ${tempUssname}`);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, tempUssname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
        });

        it("should upload local directory to USS recursively", async () => {
            let error;
            let uploadResponse: IZosFilesResponse;
            let isDirectoryExist: any;
            try {
                uploadResponse = await Upload.dirToUSSDirRecursive(REAL_SESSION, localDir, ussname, {binary: false});
                await wait(waitTime);
                isDirectoryExist = await Upload.isDirectoryExist(REAL_SESSION, `${ussname}/longline`);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(uploadResponse).toBeDefined();
            expect(uploadResponse.success).toBeTruthy();
            expect(isDirectoryExist).toBeDefined();
            expect(isDirectoryExist).toBeTruthy();
        });

    });
});
