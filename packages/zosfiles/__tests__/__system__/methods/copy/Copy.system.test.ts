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

import { Create, Upload, Delete, CreateDataSetTypeEnum, Copy, ZosFilesMessages, Get, IDataSet,
    ICrossLparCopyDatasetOptions, IGetOptions, IZosFilesResponse } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { join } from "path";
import { readFileSync } from "fs";

let REAL_SESSION: Session;
let REAL_TARGET_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let defaultTargetSystem: ITestPropertiesSchema;
let fromDataSetName: string;
let toDataSetName: string;

const file1 = "file1";
const file2 = "file2";
const fileLocation = join(__dirname, "testfiles", `${file1}.txt`);

describe("Copy", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_copy" });
        defaultSystem = testEnvironment.systemTestProperties;
        defaultTargetSystem = defaultSystem;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        REAL_TARGET_SESSION = REAL_SESSION;
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
    });

    describe("Data Set Cross LPAR", () => {
        describe("Common Failures", () => {
            it("should fail if no fromDataSet data set name is supplied", async () => {
                let error: any;
                let response: IZosFilesResponse | undefined = undefined;
                const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                const toDataset: IDataSet = { dsn: toDataSetName };
                const fromOptions: IGetOptions = {
                    binary: false,
                    encoding: undefined,
                    record: false
                };
                const options: ICrossLparCopyDatasetOptions = {
                    "from-dataset": { dsn: undefined as any },
                    responseTimeout: 5,
                    replace: false
                };
                try {
                    response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                } catch (err) {
                    error = err;
                }
                expect(response?.success).toBeFalsy();
                expect(error).toBeDefined();
                expect(error.message).toContain("Required object must be defined");
            });

            it("should fail if no toDataSet data set name is supplied", async () => {
                let error: any;
                let response: IZosFilesResponse | undefined = undefined;
                const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                const toDataset: IDataSet = { dsn: undefined as any };
                const fromOptions: IGetOptions = {
                    binary: false,
                    encoding: undefined,
                    record: false
                };
                const options: ICrossLparCopyDatasetOptions = {
                    "from-dataset": { dsn: fromDataSetName },
                    responseTimeout: 5,
                    replace: false
                };
                try {
                    response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                } catch (err) {
                    error = err;
                }
                expect(response?.success).toBeFalsy();
                expect(error).toBeDefined();
                expect(error.message).toContain("Required object must be defined");
            });
        });
        describe("Data Set Sequential", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, fromDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, fromDataSetName);
                    await Delete.dataSet(REAL_SESSION, toDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });

            describe("Failure cases", () => {
                it("should warn and fail if the source data set does not exist", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: `${defaultSystem.zosmf.user.trim().toUpperCase()}.DATA.ORIGINAL.BAD.DS` },
                        responseTimeout: 5,
                        replace: false
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The source data set was not found.");
                });

                it("should warn and fail if the destination data set exists", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5,
                        replace: false
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target data set was not overwritten.");
                });
            });

            describe("Success cases", () => {
                it("should copy the source to the destination data set and allocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    let contents: Buffer;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5,
                        replace: false
                    };
                    try {
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                        contents = await Get.dataSet(TEST_TARGET_SESSION, toDataSetName);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                    expect(contents.toString().trim()).toBe(readFileSync(fileLocation).toString());
                });

                it("should overwrite the destination data set and reallocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    let contents: Buffer;
                    const contentBuffer = Buffer.from("Member contents for test");
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5,
                        replace: true
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                        contents = await Get.dataSet(TEST_TARGET_SESSION, toDataSetName);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                    expect(contents.toString().trim()).not.toContain("Member contents for test");
                    expect(contents.toString().trim()).toBe(readFileSync(fileLocation).toString());
                });
            });
        });

        describe("Data Set Partitioned", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, fromDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, fromDataSetName);
                    await Delete.dataSet(REAL_SESSION, toDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });

            describe("Failure cases", () => {
                it("should warn and fail if the source data set member does not exist", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file2 },
                        responseTimeout: 5,
                        replace: false
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Member not found");
                });

                it("should warn and fail if the destination data set exists", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5,
                        replace: false
                    };
                    const contentBuffer = Buffer.from("Member contents for test");
                    const toDatasetString = `${toDataSetName}(${file1})`;
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDatasetString);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target data set was not overwritten.");
                });
            });

            describe("Success cases", () => {
                it("should copy the source to the destination data set member and allocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    let contents: Buffer;
                    const toDatasetString = `${toDataSetName}(${file1})`;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5,
                        replace: false
                    };
                    try {
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                        contents = await Get.dataSet(TEST_TARGET_SESSION, toDatasetString);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                    expect(contents.toString().trim()).toBe(readFileSync(fileLocation).toString());
                });
                it("should overwrite the source to the destination data set member and reallocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    let contents: Buffer;
                    const contentBuffer = Buffer.from("Member contents for test");
                    const toDatasetString = `${toDataSetName}(${file1})`;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5,
                        replace: true
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDatasetString);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                        contents = await Get.dataSet(TEST_TARGET_SESSION, toDatasetString);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                    expect(contents.toString().trim()).not.toContain("Member contents for test");
                    expect(contents.toString().trim()).toBe(readFileSync(fileLocation).toString());
                });
            });
        });
        describe("Data Set Sequential to Partitioned", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, fromDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, fromDataSetName);
                    await Delete.dataSet(REAL_SESSION, toDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });

            describe("Failure cases", () => {
                it("should warn and fail if the destination data set exists", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5,
                        replace: false
                    };
                    const contentBuffer = Buffer.from("Member contents for test");
                    const toDatasetString = `${toDataSetName}(${file1})`;
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDatasetString);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target data set was not overwritten.");
                });
            });

            describe("Success cases", () => {
                it("should copy the source to the destination data set and allocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    let contents: Buffer;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5,
                        replace: false
                    };
                    const toDataSetString = `${toDataset.dsn}(${toDataset.member})`;
                    try {
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                        contents = await Get.dataSet(TEST_TARGET_SESSION, toDataSetString);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                    expect(contents.toString().trim()).toBe(readFileSync(fileLocation).toString());
                });

                it("should overwrite the destination data set member", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    let contents: Buffer;
                    const toDatasetString = `${toDataSetName}(${file1})`;
                    const contentBuffer = Buffer.from("Member contents for test");
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5,
                        replace: true
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDatasetString);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                        contents = await Get.dataSet(TEST_TARGET_SESSION, toDatasetString);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                    expect(contents.toString().trim()).not.toContain("Member contents for test");
                    expect(contents.toString().trim()).toBe(readFileSync(fileLocation).toString());
                });
            });
        });

        describe("Data Set Partitioned to Sequential", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, fromDataSetName);
                    await Delete.dataSet(REAL_SESSION, toDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });

            describe("Failure cases", () => {
                it("should warn and fail if the destination data set exists", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5,
                        replace: false
                    };
                    const contentBuffer = Buffer.from("Member contents for test");
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target data set was not overwritten.");
                });
            });

            describe("Success cases", () => {
                it("should copy the source to the destination data set and allocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    let contents: Buffer;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5,
                        replace: false
                    };
                    try {
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                        contents = await Get.dataSet(TEST_TARGET_SESSION, toDataSetName);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                    expect(contents.toString().trim()).toBe(readFileSync(fileLocation).toString());
                });
                it("should overwrite the source to the destination data set and reallocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    let contents: Buffer;
                    const contentBuffer = Buffer.from("Member contents for test");
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5,
                        replace: true
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                        contents = await Get.dataSet(TEST_TARGET_SESSION, toDataSetName);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                    expect(contents.toString().trim()).not.toContain("Member contents for test");
                    expect(contents.toString().trim()).toBe(readFileSync(fileLocation).toString());
                });
            });
        });

        describe("Data Set Partitioned with no member to Sequential", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, fromDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, fromDataSetName);
                    await Delete.dataSet(REAL_SESSION, toDataSetName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });

            describe("Failure cases", () => {
                it("should fail in all cases, as copying a whole PDS is not supported", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const TEST_TARGET_SESSION = REAL_TARGET_SESSION;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const options: ICrossLparCopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: undefined },
                        responseTimeout: 5,
                        replace: false
                    };
                    const contentBuffer = Buffer.from("Member contents for test");
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, options, fromOptions, TEST_TARGET_SESSION);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Copying from a PDS to PDS is not supported when using the 'dsclp' option.");
                });
            });
        });
    });
});

describe("Copy - Encoded", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_copy" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        fromDataSetName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.DATA.ENCO#ED.ORIGINAL`;
        toDataSetName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.ENCO#ED.DATA.COPY`;
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
    });
});