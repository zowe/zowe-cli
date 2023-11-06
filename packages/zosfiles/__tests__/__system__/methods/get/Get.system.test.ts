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

import { Create, CreateDataSetTypeEnum, Delete, Get, IGetOptions, List, ZosFilesConstants } from "../../../../src";
import { Imperative, Session } from "@zowe/core-for-zowe-sdk";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getRandomBytes, getUniqueDatasetName, stripNewLines } from "../../../../../../__tests__/__src__/TestUtils";
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { IZosmfListResponse } from "../../../../src/methods/list/doc/IZosmfListResponse";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let ussname: string;

describe("Get", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_view"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.VIEW`);
        Imperative.console.info("Using dsname:" + dsname);

        // using unique DS function to generate unique USS file name
        ussname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
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
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                try {
                    response = await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }
            });

            it("should get data set content", async () => {
                let error;
                let response: Buffer;

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.toString()).toEqual(data);
            });

            it("should get data set content with response timeout", async () => {
                let error;
                let response: Buffer;

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname, {responseTimeout: 5});
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.toString()).toEqual(data);
            });


            it("should get data set content with volume option", async () => {
                let error;
                let response: Buffer;

                const options: IGetOptions = {};
                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);
                const listOfDataSets = await List.dataSet(REAL_SESSION, dsname, {attributes: true});
                listOfDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => {
                    options.volume = dataSetObj.vol;
                });

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.toString()).toEqual(data);
            });

            it("should get data set content in binary mode", async () => {
                let error;
                let response: Buffer;

                const options: IGetOptions = {
                    binary: true
                };

                const randomByteLength = 60;
                const data: Buffer = await getRandomBytes(randomByteLength);
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [ZosmfHeaders.X_IBM_BINARY], data);

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.subarray(0, data.length)).toEqual(data);
            });
            it("should get data set content in record mode", async () => {
                let error;
                let response: Buffer;

                const bufferLength = 84;
                const options: IGetOptions = {
                    record: true
                };

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.length).toEqual(bufferLength);
                expect(response.subarray(0, 4)).toEqual(Buffer.from("00000050", "hex")); // Data size
                expect(response.subarray(4, 30)).toEqual(Buffer.from("818283848586878889919293949596979899a2a3a4a5a6a7a8a9", "hex")); // Our data
                // Empty space
                expect(response.subarray(30, 60)).toEqual(Buffer.from("404040404040404040404040404040404040404040404040404040404040", "hex"));
                expect(response.subarray(60, 81)).toEqual(Buffer.from("404040404040404040404040404040404040404040", "hex"));
            });
        });
        describe("USS File", () => {
            beforeEach(async () => {
                let response;
                let error;
                const data = "{\"type\":\"file\",\"mode\":\"RWXRW-RW-\"}";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

                try {
                    response = await ZosmfRestClient.postExpectString(REAL_SESSION, endpoint, [], data);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

                try {
                    response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint);
                } catch (err) {
                    error = err;
                }
            });

            it("should get uss file content", async () => {
                let error;
                let response: Buffer;

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.toString()).toEqual(data);
            });

            it("should get uss file content in binary", async () => {
                let error;
                let response: Buffer;

                const options: IGetOptions = {
                    binary: true
                };

                const randomByteLength = 60;
                const data: Buffer = await getRandomBytes(randomByteLength);
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [ZosmfHeaders.X_IBM_BINARY], data);

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.subarray(0, data.length)).toEqual(data);
            });

            it("should get uss file content range", async () => {
                let error;
                let response: Buffer;

                const data: string = "abcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname, {range: "0,1"});
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.toString()).toEqual("abcdefghijklmnopqrstuvwxyz\n");
            });
        });
    });

    describe("Failure Scenarios", () => {

        describe("Physical sequential data set", () => {

            it("should display a proper error message when missing the session", async () => {
                let response: Buffer;
                let error;

                try {
                    response = await Get.dataSet(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display a proper message when getting the content of a data set that does not exist", async () => {
                let response: Buffer;
                let error;

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Data set not found.");
            });
        });

        describe("USS File", () => {

            it("should display a proper error message when missing the session", async () => {
                let response: Buffer;
                let error;

                try {
                    response = await Get.USSFile(undefined, ussname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display a proper message when getting the content of a file that does not exist", async () => {
                let response: Buffer;
                let error;

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname);
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("No such file or directory.");
            });

            it("should display a proper message when getting the content of a file with record option", async () => {
                let response: Buffer;
                let error;
                const record = true;

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname, {record});
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Unsupported data type 'record' specified for USS file operation.");
            });
        });
    });
});


describe("Get - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_view"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.VIEW`, true);
        Imperative.console.info("Using dsname:" + dsname);

        // using unique DS function to generate unique USS file name
        ussname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${ussname + "Encod#d"}`;
        Imperative.console.info("Using ussfile:" + ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success Scenarios", () => {

        describe("Physical sequential data set", () => {

            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
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

            it("should get data set content", async () => {
                let error;
                let response: Buffer;

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + encodeURIComponent(dsname);
                await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.toString()).toEqual(data);
            });
        });

        describe("USS File", () => {
            beforeEach(async () => {
                const data = "{\"type\":\"file\",\"mode\":\"RWXRW-RW-\"}";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + encodeURIComponent(ussname);

                try {
                    await ZosmfRestClient.postExpectString(REAL_SESSION, endpoint, [], data);
                } catch (err) {
                    // Do nothing
                }
            });

            afterEach(async () => {
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + encodeURIComponent(ussname);

                try {
                    await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint);
                } catch (err) {
                    // Do nothing
                }
            });

            it("should get uss file content", async () => {
                let error;
                let response: Buffer;

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + encodeURIComponent(ussname);
                await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.toString()).toEqual(data);
            });

        });
    });
});