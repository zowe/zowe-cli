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

import { Create, CreateDataSetTypeEnum, Delete, IListOptions, IZosFilesResponse, List, Upload } from "../../../../../";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let path: string;
let filename: string;

describe("List command group", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_list"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.LIST`);
        Imperative.console.info("Using dsname:" + dsname);

        const user = `${defaultSystem.zosmf.user.trim()}`.replace(/\./g, "");
        path = `${defaultSystem.unix.testdir}/${user}`;
        filename = "aTestUssFolder.txt";
        Imperative.console.info("Using USS path:" + path + " and filename " + filename);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("All Members", () => {
        describe("Success Scenarios", () => {
            const testString = "test";
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                    await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testString), `${dsname}(${testString})`);
                } catch (err) {
                    throw err;
                }
            });

            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    throw err;
                }
            });

            it("should list all members of a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await List.allMembers(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0].member).toEqual(testString.toUpperCase());
            });

            it("should list all members of a data set with attributes", async () => {
                let error;
                let response: IZosFilesResponse;
                const option: IListOptions = {
                    attributes: true
                };

                try {
                    response = await List.allMembers(REAL_SESSION, dsname, option);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0].member).toEqual(testString.toUpperCase());
                expect(response.apiResponse.items[0].user).toBeDefined();
            });


            it("should display proper message when listing data set members and data set is empty", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    await Delete.dataSet(REAL_SESSION, `${dsname}(${testString})`);
                    response = await List.allMembers(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.commandResponse).toBe(null);
            });
        });

        describe("Failure Scenarios", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await List.allMembers(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper message when listing data set members and data set does not exists", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await List.allMembers(REAL_SESSION, dsname + ".dummy");
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Data set not cataloged");
            });
        });
    });

    describe("Data Set", () => {
        describe("Success Scenarios", () => {
            const testString = "test";
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                } catch (err) {
                    throw err;
                }
            });

            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    throw err;
                }
            });

            it("should list a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await List.dataSet(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0].dsname).toEqual(dsname);
            });

            it("should list a data set with attributes and start options", async () => {
                let error;
                let response: IZosFilesResponse;
                const option: IListOptions = {
                    attributes: true,
                    start: dsname
                };

                try {
                    response = await List.dataSet(REAL_SESSION, dsname, option);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0].dsname).toEqual(dsname);
                expect(response.apiResponse.items[0].dsorg).toBeDefined();
            });
        });

        describe("Failure Scenarios", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await List.dataSet(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper message when listing data set members and data set does not exists", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await List.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeDefined();
                expect(response.commandResponse).toBe(null);
            });
        });
    });

    describe("USS Files", () => {

        describe("Success scenarios", () => {
            beforeEach(async () => {
                let error;
                let response;
                try {
                    response = await Create.uss(REAL_SESSION, path, "directory");
                    response = await Create.uss(REAL_SESSION, `${path}/${filename}`, "file");
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
            });

            afterEach(async () => {
                let error;
                let response;
                try {
                    response = await Delete.ussFile(REAL_SESSION, path, true);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
            });

            it("should list a uss directory", async () => {
                let error;
                let response;

                try {
                    response = await List.fileList(REAL_SESSION, path);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items[0].name).toEqual(".");
                expect(response.apiResponse.items[0].mode.startsWith("d")).toBeTruthy();
                expect(response.apiResponse.items[1].name).toEqual("..");
                expect(response.apiResponse.items[2].name).toEqual(filename);
                expect(response.apiResponse.items[2].mode.startsWith("d")).toBeFalsy();
            });

            it("should list a uss directory but limited to one", async () => {
                let error;
                let response;

                try {
                    response = await List.fileList(REAL_SESSION, path, {maxLength: 1});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items[0].name).toEqual(".");
                expect(response.apiResponse.items[0].mode.startsWith("d")).toBeTruthy();
                expect(response.apiResponse.items.length).toBe(1);
            });
        });

        describe("Failure Scenarios", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;
                try {
                    response = await List.fileList(undefined, path);
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper message when listing path files and file does not exists", async () => {
                let response: IZosFilesResponse;
                let error;
                try {
                    response = await List.fileList(REAL_SESSION, name);
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error).toBeDefined();
                expect(error.message).toContain("name is not defined");
            });
        });
    });

    describe("file System", () => {

        describe("Success scenarios", () => {

            it("should list all files system", async () => {
                let error;
                let response;

                try {
                    response = await List.fs(REAL_SESSION);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBeGreaterThan(0);
                expect(response.apiResponse.items[0]).toHaveProperty("name");
                expect(response.apiResponse.items[0]).toHaveProperty("mountpoint");
            });

            it("should list a uss directory but limited to one", async () => {
                let error;
                let response;

                try {
                    response = await List.fs(REAL_SESSION, {maxLength: 1});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0]).toHaveProperty("name");
                expect(response.apiResponse.items[0]).toHaveProperty("mountpoint");
            });
        });

    });

});
