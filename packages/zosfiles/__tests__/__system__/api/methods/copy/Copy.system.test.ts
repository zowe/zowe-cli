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

import { Create, Upload, Delete, CreateDataSetTypeEnum, Copy, ZosFilesMessages, Get, ICreateDataSetOptions, IUploadOptions } from "../../../../..";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { List, ICopyDatasetOptions, enqueue } from "../../../../../src/api";
import { IZosmfListResponse } from "../../../../../src/api/methods/list/doc/IZosmfListResponse";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let fromDsName: string;
let toDsName: string;

const missingDatasetName = "missing";
const missingDatasetMember = "missing";

describe("Copy Dataset", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_copy" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        fromDsName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.DATA.ORIGINAL`;
        toDsName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.DATA.COPY`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Sequential", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, fromDsName);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDsName);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from("1234"), fromDsName);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        afterEach(async () => {
            try {
                await Delete.dataSet(REAL_SESSION, fromDsName);
                await Delete.dataSet(REAL_SESSION, toDsName);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        describe("Success Scenarios", () => {
            it("copy", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    response = await Copy.dataSet(REAL_SESSION, fromDsName, toDsName);
                    contents1 = await Get.dataSet(REAL_SESSION, fromDsName);
                    contents2 = await Get.dataSet(REAL_SESSION, toDsName);
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
            it("enqueue type set to `SHR`", async () => {
                const options: ICopyDatasetOptions = { enq: enqueue.SHR };
                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    response = await Copy.dataSet(REAL_SESSION, fromDsName, toDsName, options);
                    contents1 = await Get.dataSet(REAL_SESSION, fromDsName);
                    contents2 = await Get.dataSet(REAL_SESSION, toDsName);
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
            it("alias set to `true`", async () => {
                const options: ICopyDatasetOptions = { alias: true };
                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    response = await Copy.dataSet(REAL_SESSION, fromDsName, toDsName, options);
                    contents1 = await Get.dataSet(REAL_SESSION, fromDsName);
                    contents2 = await Get.dataSet(REAL_SESSION, toDsName);
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
            it("'from' and 'to' volume specified", async () => {
                let fromVolume: string;
                let toVolume: string;
                let options: ICopyDatasetOptions;

                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    const listOfToDataSets = await List.dataSet(REAL_SESSION, toDsName, {attributes: true});
                    listOfToDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => toVolume = dataSetObj.vol);

                    const listOfFromDataSets = await List.dataSet(REAL_SESSION, fromDsName, {attributes: true});
                    listOfFromDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => fromVolume = dataSetObj.vol);

                    options = {
                        fromVolume,
                        toVolume,
                    };

                    response = await Copy.dataSet(REAL_SESSION, fromDsName, toDsName, options);

                    contents1 = await Get.dataSet(REAL_SESSION, fromDsName);
                    contents2 = await Get.dataSet(REAL_SESSION, toDsName);
                } catch(err) {
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
        describe("Failure Scenarios", () => {
            it("no 'from' dataset", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSet(REAL_SESSION, missingDatasetName, toDsName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("data set not found");

                expect(response).toBeFalsy();
            });
            it("no 'to' dataset", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSet(REAL_SESSION, fromDsName, missingDatasetName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("data set not found");

                expect(response).toBeFalsy();
            });
            it("invalid data set name", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSet(REAL_SESSION, fromDsName, undefined);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

                expect(response).toBeFalsy();
            });
            it("empty data set name", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSet(REAL_SESSION, "", toDsName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

                expect(response).toBeFalsy();
            });
            it("missing session", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSet(undefined, fromDsName, toDsName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");

                expect(response).toBeFalsy();
            });
            it("set enqueue as 'SHRW'", async () => {
                let error;
                let response;
                const options: ICopyDatasetOptions = { enq: enqueue.SHRW };
                try {
                    response = await Copy.dataSet(REAL_SESSION, fromDsName, toDsName, options);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                // TODO: Right message?
                expect(error.message).toContain(ZosFilesMessages.unsupportedDatasetType.message);

                expect(response).toBeFalsy();
            });
            it("Wrong 'from' volume", async () => {
                let toVolume: string;
                let options: ICopyDatasetOptions;

                let error;
                let response;

                try {
                    const listOfToDataSets = await List.dataSet(REAL_SESSION, toDsName, {attributes: true});
                    listOfToDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => toVolume = dataSetObj.vol);

                    options = {
                        fromVolume: "123456",
                        toVolume,
                    };

                    response = await Copy.dataSet(REAL_SESSION, fromDsName, toDsName, options);
                } catch(err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Volume not available");

                expect(response).toBeFalsy();
            });
            it("Wrong 'to' volume", async () => {
                let fromVolume: string;
                let options: ICopyDatasetOptions;

                let error;
                let response;

                try {
                    const listOfFromDataSets = await List.dataSet(REAL_SESSION, fromDsName, {attributes: true});
                    listOfFromDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => fromVolume = dataSetObj.vol);

                    options = {
                        fromVolume,
                        toVolume: "123456",
                    };

                    response = await Copy.dataSet(REAL_SESSION, fromDsName, toDsName, options);
                } catch(err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Volume not available");

                expect(response).toBeFalsy();
            });

        });
    });

    describe("Partitioned", () => {
        const memberName = "upload";
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDsName);
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDsName);

                await Upload.fileToDataset(REAL_SESSION, `${__dirname}/../upload/testfiles/upload.txt`, fromDsName);
            } catch (err) {
                Imperative.console.info("Error: " + inspect(err));
            }
        });
        afterEach(async () => {
            try {
                await Delete.dataSet(REAL_SESSION, fromDsName);
                await Delete.dataSet(REAL_SESSION, toDsName);
            } catch (err) {
                Imperative.console.info("Error: " + inspect(err));
            }
        });

        describe("Success Scenarios", () => {
            it("copy", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                try {
                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDsName}(${memberName})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDsName}(${memberName})`);
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
                expect(contents1).toEqual(contents2);
            });
            it("replace members with same name", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                const options: ICopyDatasetOptions = { replace: true };

                try {
                    await Upload.fileToDataset(REAL_SESSION, `${__dirname}/../upload/testfiles/upload.txt`, toDsName);

                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDsName}(${memberName})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDsName}(${memberName})`);
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
                expect(contents1).toEqual(contents2);
            });
            it("enqueue type set to `SHRW`", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                const options: ICopyDatasetOptions = { enq: enqueue.SHRW };

                try {
                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDsName}(${memberName})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDsName}(${memberName})`);
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
                expect(contents1).toEqual(contents2);
            });
            it("alias set to `true`", async () => {
                let error;
                let response;
                let contents1;
                let contents2;

                const options: ICopyDatasetOptions = { alias: true };

                try {
                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDsName}(${memberName})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDsName}(${memberName})`);
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
                expect(contents1).toEqual(contents2);
            });
            it("'from' and 'to' volume specified", async () => {
                let error;
                let response;
                let contents1;
                let contents2;
                let fromVolume: string;
                let toVolume: string;
                let options: ICopyDatasetOptions;

                try {
                    const listOfFromDataSets = await List.dataSet(REAL_SESSION, fromDsName, {attributes: true});
                    listOfFromDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => fromVolume = dataSetObj.vol);

                    const listOfToDataSet = await List.dataSet(REAL_SESSION, toDsName, {attributes: true});
                    listOfToDataSet.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => toVolume = dataSetObj.vol);

                    options = {
                        fromVolume,
                        toVolume,
                    };

                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );
                    contents1 = await Get.dataSet(REAL_SESSION, `${fromDsName}(${memberName})`);
                    contents2 = await Get.dataSet(REAL_SESSION, `${toDsName}(${memberName})`);
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
                expect(contents1).toEqual(contents2);
            });
        });
        describe("Failure Scenarios", () => {
            it("no 'from' dataset", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        missingDatasetName,
                        memberName,
                        toDsName,
                        memberName,
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("data set not found");

                expect(response).toBeFalsy();
            });
            it("no 'to' dataset", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        missingDatasetName,
                        memberName,
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("data set not found");

                expect(response).toBeFalsy();
            });
            it("missing 'from' dataset member", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        missingDatasetMember,
                        toDsName,
                        memberName,
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Member not found");

                expect(response).toBeFalsy();
            });
            it("invalid data set name", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        undefined,
                        memberName,
                        toDsName,
                        memberName,
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

                expect(response).toBeFalsy();
            });
            it("empty data set name", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        "",
                        memberName,
                        toDsName,
                        memberName,
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

                expect(response).toBeFalsy();
            });
            it("missing session", async () => {
                let error;
                let response;

                try {
                    response = await Copy.dataSetMember(
                        undefined,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");

                expect(response).toBeFalsy();
            });
            it("member already exists", async () => {
                let error;
                let response;

                try {
                    await Upload.fileToDataset(REAL_SESSION, `${__dirname}/../upload/testfiles/upload.txt`, toDsName);

                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
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
            it("Wrong 'from' volume", async () => {
                let error;
                let response;
                let toVolume: string;
                let options: ICopyDatasetOptions;

                try {
                    const listOfToDataSets = await List.dataSet(REAL_SESSION, toDsName, {attributes: true});
                    listOfToDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => toVolume = dataSetObj.vol);

                    options = {
                        fromVolume: "123456",
                        toVolume,
                    };

                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Volume not available");

                expect(response).toBeFalsy();
            });
            it("Wrong 'to' volume", async () => {
                let error;
                let response;
                let fromVolume: string;
                let options: ICopyDatasetOptions;

                try {
                    const listOfFromDataSets = await List.dataSet(REAL_SESSION, fromDsName, {attributes: true});
                    listOfFromDataSets.apiResponse.items.forEach((dataSetObj: IZosmfListResponse) => fromVolume = dataSetObj.vol);

                    options = {
                        fromVolume,
                        toVolume: "123456",
                    };

                    response = await Copy.dataSetMember(
                        REAL_SESSION,
                        fromDsName,
                        memberName,
                        toDsName,
                        memberName,
                        options,
                    );
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Volume not available");

                expect(response).toBeFalsy();
            });
        });
    });
});
