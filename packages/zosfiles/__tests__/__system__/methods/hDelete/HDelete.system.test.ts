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

import { Create, Delete, CreateDataSetTypeEnum, HDelete, HMigrate, IDeleteOptions, ZosFilesMessages } from "../../../../src";
import { Imperative, Session } from "@zowe/core-for-zowe-sdk";
import { inspect } from "util";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dataSet1: string;
let dataSet2: string;
let dataSet3: string;

describe("Delete Migrated Dataset", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_delete" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dataSet1 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.SDATA.DEL`;
        dataSet2 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.PDATA.DEL`;
        dataSet3 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.FAIL.DEL`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    afterEach(async () => {
        try {
            await Promise.all([
                Delete.dataSet(REAL_SESSION, dataSet1),
                Delete.dataSet(REAL_SESSION, dataSet2),
                Delete.dataSet(REAL_SESSION, dataSet3)]);
        } catch (err) {
            Imperative.console.info(`Error: ${inspect(err)}`);
        }
    });
    describe("Success Scenarios", () => {
        describe("Sequential Data Set", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSet1);
                    await HMigrate.dataSet(REAL_SESSION, dataSet1);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("should delete a migrated sequential data set", async () => {
                let error;
                let response;

                try {
                    response = await HDelete.dataSet(REAL_SESSION, dataSet1);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletionRequested.message);
            });
            it("should delete a migrated sequential data set with response timeout", async () => {
                let error;
                let response;

                try {
                    response = await HDelete.dataSet(REAL_SESSION, dataSet1, {responseTimeout: 5});
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletionRequested.message);
            });
            it("should delete a migrated sequential data set with wait = true", async () => {
                const deleteOptions: IDeleteOptions = { wait: true };
                let error;
                let response;

                try {
                    response = await HDelete.dataSet(REAL_SESSION, dataSet1, deleteOptions);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletionRequested.message);
            });
            it("should delete a migrated sequential data set with purge = true", async () => {
                const deleteOptions: IDeleteOptions = { purge: true };
                let error;
                let response;

                try {
                    response = await HDelete.dataSet(REAL_SESSION, dataSet1, deleteOptions);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletionRequested.message);
            });
        });
        describe("Partitioned Data Set", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSet2);
                    await HMigrate.dataSet(REAL_SESSION, dataSet2);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("should delete a migrated partitioned dataset", async () => {
                let error;
                let response;

                try {
                    response = await HDelete.dataSet(REAL_SESSION, dataSet2);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletionRequested.message);
            });
            it("should delete a migrated partitioned dataset with response timeout", async () => {
                let error;
                let response;

                try {
                    response = await HDelete.dataSet(REAL_SESSION, dataSet2, {responseTimeout: 5});
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletionRequested.message);
            });
            it("should delete a migrated partitioned dataset with wait = true", async () => {
                const deleteOptions: IDeleteOptions = { wait: true };
                let error;
                let response;

                try {
                    response = await HDelete.dataSet(REAL_SESSION, dataSet2, deleteOptions);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletionRequested.message);
            });
            it("should delete a migrated partitioned dataset with purge = true", async () => {
                const deleteOptions: IDeleteOptions = { purge: true };
                let error;
                let response;

                try {
                    response = await HDelete.dataSet(REAL_SESSION, dataSet2, deleteOptions);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletionRequested.message);
            });
        });
    });
    describe("Failure Scenarios", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSet3);
                await HMigrate.dataSet(REAL_SESSION, dataSet3);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        it("should throw an error if data set name is undefined", async () => {
            let error;
            let response;

            try {
                response = await HDelete.dataSet(REAL_SESSION, undefined);
                Imperative.console.info(`Response: ${inspect(response)}`);
            } catch (err) {
                error = err;
                Imperative.console.info(`Error: ${inspect(err)}`);
            }

            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

            expect(response).toBeFalsy();
        });
        it("should throw an error if data set name is missing", async () => {
            let error;
            let response;

            try {
                response = await HDelete.dataSet(REAL_SESSION, "");
                Imperative.console.info(`Response: ${inspect(response)}`);
            } catch (err) {
                error = err;
                Imperative.console.info(`Error: ${inspect(err)}`);
            }

            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

            expect(response).toBeFalsy();
        });
    });
});
