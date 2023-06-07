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

import { Session } from "@zowe/imperative";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Delete, Create, CreateDataSetTypeEnum, Upload, Get } from "@zowe/zos-files-for-zowe-sdk";
import { join } from "path";

let REAL_SESSION: Session;
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let fromDataSetName: string;
let toDataSetName: string;
let user: string;

const fromMemberName: string = "mem1";
const toMemberName: string = "mem2";
const responseTimeout = `--responseTimeout 5`;
const replaceOption = `--replace`;

describe("Copy data set", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_copy_data_set_cross_lpar"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        fromDataSetName = `${user}.COPY.FROM.SET`;
        toDataSetName = `${user}.COPY.TO.SET`;

    });
    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    afterEach(async () => {
        await Promise.all([
            Delete.dataSet(REAL_SESSION, fromDataSetName),
            Delete.dataSet(REAL_SESSION, toDataSetName)
        ]);
    });
    describe("success scenarios", () => {
        const data = "1234";
        describe("sequential > sequential", () => {
            beforeEach(async () => {
                await Promise.all([
                    Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, fromDataSetName),
                    Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName)
                ]);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(data), fromDataSetName);
            });
            it("should copy a data set from the command", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [fromDataSetName, toDataSetName]
                    );
                    contents = await Get.dataSet(REAL_SESSION, toDataSetName);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
            it("should copy a data set from the command with response timeout", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [fromDataSetName, toDataSetName, responseTimeout]
                    );
                    contents = await Get.dataSet(REAL_SESSION, toDataSetName);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
            it("should copy a data set from the command with replace option", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [fromDataSetName, toDataSetName, replaceOption]
                    );
                    contents = await Get.dataSet(REAL_SESSION, toDataSetName);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
        });
        describe("member > member", () => {
            beforeEach(async () => {
                await Promise.all([
                    Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName),
                    Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName)
                ]);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(data), `${fromDataSetName}(${fromMemberName})`);
            });
            it("should copy a data set from the command", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [`${fromDataSetName}(${fromMemberName})`, `${toDataSetName}(${toMemberName})`]
                    );
                    contents = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${toMemberName})`);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
            it("should copy a data set from the command with response timeout", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [`${fromDataSetName}(${fromMemberName})`, `${toDataSetName}(${toMemberName})`, responseTimeout]
                    );
                    contents = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${toMemberName})`);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
            it("should copy a data set from the command with replace option", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [`${fromDataSetName}(${fromMemberName})`, `${toDataSetName}(${toMemberName})`, replaceOption]
                    );
                    contents = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${toMemberName})`);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
        });
        describe("sequential > member", () => {
            beforeEach(async () => {
                await Promise.all([
                    Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, fromDataSetName),
                    Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, toDataSetName)
                ]);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(data), fromDataSetName);
            });
            it("should copy a data set from the command", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [fromDataSetName, `${toDataSetName}(${toMemberName})`]
                    );
                    contents = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${toMemberName})`);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
            it("should copy a data set from the command with response timeout", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [fromDataSetName, `${toDataSetName}(${toMemberName})`, responseTimeout]
                    );
                    contents = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${toMemberName})`);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
            it("should copy a data set from the command with replace option", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [fromDataSetName, `${toDataSetName}(${toMemberName})`, replaceOption]
                    );
                    contents = await Get.dataSet(REAL_SESSION, `${toDataSetName}(${toMemberName})`);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
        });
        describe("member > sequential", () => {
            beforeEach(async () => {
                await Promise.all([
                    Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, fromDataSetName),
                    Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, toDataSetName)
                ]);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(data), `${fromDataSetName}(${fromMemberName})`);
            });
            it("should copy a data set from the command", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [`${fromDataSetName}(${fromMemberName})`, toDataSetName]
                    );
                    contents = await Get.dataSet(REAL_SESSION, toDataSetName);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
            it("should copy a data set from the command with response timeout", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [`${fromDataSetName}(${fromMemberName})`, toDataSetName, responseTimeout]
                    );
                    contents = await Get.dataSet(REAL_SESSION, toDataSetName);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
            it("should copy a data set from the command with replace option", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_copy_data_set_cross_lpar.sh"),
                        TEST_ENVIRONMENT,
                        [`${fromDataSetName}(${fromMemberName})`, toDataSetName, replaceOption]
                    );
                    contents = await Get.dataSet(REAL_SESSION, toDataSetName);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set copied successfully.");
                expect(contents.toString().trim()).toBe(data);
            });
        });
    });
});
