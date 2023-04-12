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
    ICrossLparCopyDatasetOptions, IGetOptions, ICopyDatasetOptions, IZosFilesResponse } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment, TempTestProfiles } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { join } from "path";

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
        describe("Common Failure Scenarios", () => {
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

            it("should warn and fail if there isn't enough information to create a target session 1", async () => {
                let error: any;
                let response: IZosFilesResponse | undefined = undefined;
                const toDataset: IDataSet = { dsn: toDataSetName };
                const toOptions: ICrossLparCopyDatasetOptions = {
                    targetHost: "example.com",
                    targetPort: 443,
                    targetUser: "fakeuser"
                };
                const fromDataset: ICopyDatasetOptions = {
                    "from-dataset": { dsn: fromDataSetName },
                    responseTimeout: 5
                };
                const fromOptions: IGetOptions = {
                    binary: false,
                    encoding: undefined,
                    record: false
                };
                try {
                    response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                } catch (err) {
                    error = err;
                }
                expect(response?.success).toBeFalsy();
                expect(error).toBeDefined();
                expect(error.message).toContain("Must have user & password OR base64 encoded credentials");
            });

            it("should warn and fail if there isn't enough information to create a target session 2", async () => {
                process.env["ZOWE_CLI_HOME"] = testEnvironment.workingDir;
                let error: any;
                let response: IZosFilesResponse | undefined = undefined;
                const toDataset: IDataSet = { dsn: toDataSetName };
                const toOptions: ICrossLparCopyDatasetOptions = {
                    targetZosmfProfile: "fake"
                };
                const fromDataset: ICopyDatasetOptions = {
                    "from-dataset": { dsn: fromDataSetName },
                    responseTimeout: 5
                };
                const fromOptions: IGetOptions = {
                    binary: false,
                    encoding: undefined,
                    record: false
                };
                try {
                    response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                } catch (err) {
                    error = err;
                } finally {
                    process.env["ZOWE_CLI_HOME"] = "";
                }
                expect(response?.success).toBeFalsy();
                expect(error).toBeDefined();
                expect(error.message).toContain("There are no known z/OSMF profiles.");
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
                it("should warn and fail if the source dataset does not exist", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const toOptions: ICrossLparCopyDatasetOptions = {
                        targetHost: testEnvironment.systemTestProperties.zosmf.host,
                        targetPort: testEnvironment.systemTestProperties.zosmf.port,
                        targetUser: testEnvironment.systemTestProperties.zosmf.user,
                        targetPassword: testEnvironment.systemTestProperties.zosmf.password,
                        rejectUnauthorized: testEnvironment.systemTestProperties.zosmf.rejectUnauthorized
                    };
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: `${defaultSystem.zosmf.user.trim().toUpperCase()}.DATA.ORIGINAL.BAD.DS` },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set not found.");
                });

                it("should warn and fail if the destination dataset exists (session explicit)", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const toOptions: ICrossLparCopyDatasetOptions = {
                        targetHost: testEnvironment.systemTestProperties.zosmf.host,
                        targetPort: testEnvironment.systemTestProperties.zosmf.port,
                        targetUser: testEnvironment.systemTestProperties.zosmf.user,
                        targetPassword: testEnvironment.systemTestProperties.zosmf.password,
                        rejectUnauthorized: testEnvironment.systemTestProperties.zosmf.rejectUnauthorized
                    };
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target dataset was not overwritten.");
                });

                it("should warn and fail if the destination dataset exists (session implicit)", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const toOptions: ICrossLparCopyDatasetOptions = {};
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target dataset was not overwritten.");
                });

                it("should warn and fail if the destination dataset exists (using profile)", async() => {
                    const tempTestProfiles = await TempTestProfiles.createProfiles(testEnvironment, ["zosmf"]);
                    process.env["ZOWE_CLI_HOME"] = testEnvironment.workingDir;
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const toOptions: ICrossLparCopyDatasetOptions = {
                        targetZosmfProfile: tempTestProfiles['zosmf'][0] // This should be the first z/OSMF profile
                    };
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    } finally {
                        TempTestProfiles.deleteProfiles(testEnvironment);
                        process.env["ZOWE_CLI_HOME"] = "";
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target dataset was not overwritten.");
                });
            });

            describe("Success cases", () => {
                it("should copy the source to the destination dataset and allocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const toOptions: ICrossLparCopyDatasetOptions = {
                        targetHost: testEnvironment.systemTestProperties.zosmf.host,
                        targetPort: testEnvironment.systemTestProperties.zosmf.port,
                        targetUser: testEnvironment.systemTestProperties.zosmf.user,
                        targetPassword: testEnvironment.systemTestProperties.zosmf.password,
                        rejectUnauthorized: testEnvironment.systemTestProperties.zosmf.rejectUnauthorized
                    };
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    try {
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
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
                it("should warn and fail if the source dataset member does not exist", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const toOptions: ICrossLparCopyDatasetOptions = {
                        targetHost: testEnvironment.systemTestProperties.zosmf.host,
                        targetPort: testEnvironment.systemTestProperties.zosmf.port,
                        targetUser: testEnvironment.systemTestProperties.zosmf.user,
                        targetPassword: testEnvironment.systemTestProperties.zosmf.password,
                        rejectUnauthorized: testEnvironment.systemTestProperties.zosmf.rejectUnauthorized
                    };
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: "file3" },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, toDataSetName);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Member not found");
                });

                it("should warn and fail if the destination dataset exists (session explicit)", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const toOptions: ICrossLparCopyDatasetOptions = {
                        targetHost: testEnvironment.systemTestProperties.zosmf.host,
                        targetPort: testEnvironment.systemTestProperties.zosmf.port,
                        targetUser: testEnvironment.systemTestProperties.zosmf.user,
                        targetPassword: testEnvironment.systemTestProperties.zosmf.password,
                        rejectUnauthorized: testEnvironment.systemTestProperties.zosmf.rejectUnauthorized
                    };
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const contentBuffer = Buffer.from("Member contents for test");
                    const toDatasetString = `${toDataSetName}(${file1})`;
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDatasetString);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target dataset was not overwritten.");
                });

                it("should warn and fail if the destination dataset exists (session implicit)", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName };
                    const toOptions: ICrossLparCopyDatasetOptions = {};
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const contentBuffer = Buffer.from("Member contents for test");
                    const toDatasetString = `${toDataSetName}(${file1})`;
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDatasetString);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target dataset was not overwritten.");
                });

                it("should warn and fail if the destination dataset exists (using profile)", async() => {
                    const tempTestProfiles = await TempTestProfiles.createProfiles(testEnvironment, ["zosmf"]);
                    process.env["ZOWE_CLI_HOME"] = testEnvironment.workingDir;
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const toOptions: ICrossLparCopyDatasetOptions = {
                        targetZosmfProfile: tempTestProfiles['zosmf'][0] // This should be the first z/OSMF profile
                    };
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    const contentBuffer = Buffer.from("Member contents for test");
                    const toDatasetString = `${toDataSetName}(${file1})`;
                    try {
                        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, toDataSetName);
                        await Upload.bufferToDataSet(REAL_SESSION, contentBuffer, toDatasetString);
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    } finally {
                        TempTestProfiles.deleteProfiles(testEnvironment);
                        process.env["ZOWE_CLI_HOME"] = "";
                    }
                    expect(response?.success).toBeFalsy();
                    expect(error).toBeDefined();
                    expect(error.message).toContain("Data set copied aborted. The existing target dataset was not overwritten.");
                });
            });

            describe("Success cases", () => {
                it("should copy the source to the destination dataset member and allocate the dataset", async() => {
                    let error: any;
                    let response: IZosFilesResponse | undefined = undefined;
                    const toDataset: IDataSet = { dsn: toDataSetName, member: file1 };
                    const toOptions: ICrossLparCopyDatasetOptions = {
                        targetHost: testEnvironment.systemTestProperties.zosmf.host,
                        targetPort: testEnvironment.systemTestProperties.zosmf.port,
                        targetUser: testEnvironment.systemTestProperties.zosmf.user,
                        targetPassword: testEnvironment.systemTestProperties.zosmf.password,
                        rejectUnauthorized: testEnvironment.systemTestProperties.zosmf.rejectUnauthorized
                    };
                    const fromDataset: ICopyDatasetOptions = {
                        "from-dataset": { dsn: fromDataSetName, member: file1 },
                        responseTimeout: 5
                    };
                    const fromOptions: IGetOptions = {
                        binary: false,
                        encoding: undefined,
                        record: false
                    };
                    try {
                        response = await Copy.dataSetCrossLPAR(REAL_SESSION, toDataset, toOptions, fromOptions, fromDataset);
                    } catch (err) {
                        error = err;
                    }
                    expect(response?.success).toBeTruthy();
                    expect(error).not.toBeDefined();
                    expect(response?.errorMessage).not.toBeDefined();
                    expect(response?.commandResponse).toContain("Data set copied successfully");
                });
            });
        });
    });
});
