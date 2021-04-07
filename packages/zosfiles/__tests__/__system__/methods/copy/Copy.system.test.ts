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

import { Create, Upload, Delete, CreateDataSetTypeEnum, Copy, ZosFilesMessages, Get } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let fromDataSetName: string;
let toDataSetName: string;

const file1 = "file1";
const file2 = "file2";
const fileLocation = join(__dirname, "testfiles", `${file1}.txt`);

describe("Copy", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_copy" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        fromDataSetName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.DATA.ORIGINAL`;
        toDataSetName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.DATA.COPY`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Data Set", () => {
        afterEach(async () => {
            try {
                await Delete.dataSet(REAL_SESSION, fromDataSetName);
                await Delete.dataSet(REAL_SESSION, toDataSetName);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        describe("Success Scenarios", () => {
            describe("Sequential > Sequential", () => {
                beforeEach(async () => {
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, fromDataSetName);
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from("1234"), fromDataSetName);
                    } catch (err) {
                        Imperative.console.info(`Error: ${inspect(err)}`);
                    }
                });
                it("Should copy a data set", async () => {
                    let error;
                    let response;
                    let contents1;
                    let contents2;

                    try {
                        response = await Copy.dataSet(
                            REAL_SESSION,
                            { dsn: toDataSetName },
                            { "from-dataset": { dsn: fromDataSetName } }
                        );
                        contents1 = await Get.dataSet(REAL_SESSION, fromDataSetName);
                        contents2 = await Get.dataSet(REAL_SESSION, toDataSetName);
                        Imperative.console.info(`Response: ${inspect(response)}`);
                    } catch (err) {
                        error = err;
                        Imperative.console.info(`Error: ${inspect(err)}`);
                    }

                    expect(error).toBeFalsy();

                    expect(response).toBeTruthy();
                    expect(response.success).toBe(true);
                    expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message);

                    expect(contents1).toBeTruthy();
                    expect(contents2).toBeTruthy();
                    expect(contents1.toString()).toEqual(contents2.toString());
                });
            });
            describe("Member > Member", () => {
                beforeEach(async () => {
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName);
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName);
                        await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                    } catch (err) {
                        Imperative.console.info(`Error: ${inspect(err)}`);
                    }
                });
                it("Should copy a data set", async () => {
                    let error;
                    let response;
                    let contents1;
                    let contents2;

                    try {
                        response = await Copy.dataSet(
                            REAL_SESSION,
                            { dsn: toDataSetName, member: file2 },
                            { "from-dataset": { dsn: fromDataSetName, member: file1 } }
                        );
                        contents1 = await Get.dataSet(REAL_SESSION, `${fromDataSetName}(${file1})`);
                        contents2 = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${file2})`);
                        Imperative.console.info(`Response: ${inspect(response)}`);
                    } catch (err) {
                        error = err;
                        Imperative.console.info(`Error: ${inspect(err)}`);
                    }

                    expect(error).toBeFalsy();

                    expect(response).toBeTruthy();
                    expect(response.success).toBe(true);
                    expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message);

                    expect(contents1).toBeTruthy();
                    expect(contents2).toBeTruthy();
                    expect(contents1.toString()).toEqual(contents2.toString());
                });
            });
            describe("Sequential > Member", () => {
                beforeEach(async () => {
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, fromDataSetName);
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, Buffer.from("1234"), fromDataSetName);
                    } catch (err) {
                        Imperative.console.info(`Error: ${inspect(err)}`);
                    }
                });
                it("Should copy a data set", async () => {
                    let error;
                    let response;
                    let contents1;
                    let contents2;

                    try {
                        response = await Copy.dataSet(
                            REAL_SESSION,
                            { dsn: toDataSetName, member: file2 },
                            { "from-dataset": { dsn: fromDataSetName } }
                        );
                        contents1 = await Get.dataSet(REAL_SESSION, fromDataSetName);
                        contents2 = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${file2})`);
                        Imperative.console.info(`Response: ${inspect(response)}`);
                    } catch (err) {
                        error = err;
                        Imperative.console.info(`Error: ${inspect(err)}`);
                    }

                    expect(error).toBeFalsy();

                    expect(response).toBeTruthy();
                    expect(response.success).toBe(true);
                    expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message);

                    expect(contents1).toBeTruthy();
                    expect(contents2).toBeTruthy();
                    expect(contents1.toString()).toEqual(contents2.toString());
                });
            });
            describe("Member > Sequential", () => {
                beforeEach(async () => {
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName);
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                    } catch (err) {
                        Imperative.console.info(`Error: ${inspect(err)}`);
                    }
                });
                it("Should copy a data set", async () => {
                    let error;
                    let response;
                    let contents1;
                    let contents2;

                    try {
                        response = await Copy.dataSet(
                            REAL_SESSION,
                            { dsn: toDataSetName },
                            { "from-dataset": { dsn: fromDataSetName, member: file1 } }
                        );
                        contents1 = await Get.dataSet(REAL_SESSION, `${fromDataSetName}(${file1})`);
                        contents2 = await Get.dataSet(REAL_SESSION, toDataSetName);
                        Imperative.console.info(`Response: ${inspect(response)}`);
                    } catch (err) {
                        error = err;
                        Imperative.console.info(`Error: ${inspect(err)}`);
                    }

                    expect(error).toBeFalsy();

                    expect(response).toBeTruthy();
                    expect(response.success).toBe(true);
                    expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message);

                    expect(contents1).toBeTruthy();
                    expect(contents2).toBeTruthy();
                    expect(contents1.toString()).toEqual(contents2.toString());
                });
            });
        });
        describe("Enq option", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName);
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should succeed with enq SHR", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    response = await Copy.dataSet(
                        REAL_SESSION,
                        { dsn: toDataSetName, member: file2 },
                        {
                            "from-dataset": { dsn: fromDataSetName, member: file1 },
                            "enq": "SHR"
                        }
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDataSetName}(${file1})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${file2})`);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message);

                expect(contents1).toBeTruthy();
                expect(contents2).toBeTruthy();
                expect(contents1.toString()).toEqual(contents2.toString());
            });
            it("Should result in error with invalid enq value", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSet(
                        REAL_SESSION,
                        { dsn: toDataSetName, member: file2 },
                        {
                            "from-dataset": { dsn: fromDataSetName, member: file1 },
                            "enq": "invalid"
                        }
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(response).toBeFalsy();
            });
        });
        describe("Replace option", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName);
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                    await Copy.dataSet(
                        REAL_SESSION,
                        { dsn: toDataSetName, member: file2 },
                        { "from-dataset": { dsn: fromDataSetName, member: file1 } }
                    );
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should result in error without replace option", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSet(
                        REAL_SESSION,
                        { dsn: toDataSetName, member: file2 },
                        {
                            "from-dataset": { dsn: fromDataSetName, member: file1 },
                            "replace": false
                        }
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Like-named member already exists");
                expect(response).toBeFalsy();
            });
            it("Should succeed with replace option", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    response = await Copy.dataSet(
                        REAL_SESSION,
                        { dsn: toDataSetName, member: file2 },
                        {
                            "from-dataset": { dsn: fromDataSetName, member: file1 },
                            "replace": true
                        }
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDataSetName}(${file1})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${file2})`);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message);

                expect(contents1).toBeTruthy();
                expect(contents2).toBeTruthy();
                expect(contents1.toString()).toEqual(contents2.toString());
            });
        });
        describe("responseTimeout option", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName);
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should succeed with responseTimeout option", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    response = await Copy.dataSet(
                        REAL_SESSION,
                        { dsn: toDataSetName, member: file2 },
                        {
                            "from-dataset": { dsn: fromDataSetName, member: file1 },
                            responseTimeout: 5
                        }
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDataSetName}(${file1})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${file2})`);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message);

                expect(contents1).toBeTruthy();
                expect(contents2).toBeTruthy();
                expect(contents1.toString()).toEqual(contents2.toString());
            });
        });
        describe("responseTimeout option", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName);
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should succeed with responseTimeout option", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    response = await Copy.dataSet(
                        REAL_SESSION,
                        { dsn: toDataSetName, member: file2 },
                        {
                            "from-dataset": { dsn: fromDataSetName, member: file1 },
                            responseTimeout: 5
                        }
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDataSetName}(${file1})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${file2})`);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetCopiedSuccessfully.message);

                expect(contents1).toBeTruthy();
                expect(contents2).toBeTruthy();
                expect(contents1.toString()).toEqual(contents2.toString());
            });
        });
    });
});
