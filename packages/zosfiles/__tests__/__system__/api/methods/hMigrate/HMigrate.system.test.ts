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

import { Create, Delete, CreateDataSetTypeEnum, ZosFilesMessages } from "../../../../..";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { List, IListOptions, IMigrateOptions, HMigrate } from "../../../../../src/api";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dataSet1: string;
let dataSet2: string;
let dataSet3: string;

const listOptions: IListOptions = { attributes: true };

describe("Migrate Dataset", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_migrate" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dataSet1 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.SDATA.MIGR`;
        dataSet2 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.PDATA.MIGR`;
        dataSet3 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.FAIL.MIGR`;
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
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("should migrate a sequential data set", async () => {
                let error;
                let migrateResponse;
                let listResponse;

                try {
                    migrateResponse = await HMigrate.dataSet(REAL_SESSION, dataSet1);
                    listResponse = await List.dataSet(REAL_SESSION, dataSet1, listOptions);
                    Imperative.console.info(`Response: ${inspect(migrateResponse)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(migrateResponse).toBeTruthy();
                expect(migrateResponse.success).toBe(true);
                expect(listResponse.apiResponse.items[0].migr).toBe("YES");
                expect(migrateResponse.commandResponse).toContain(ZosFilesMessages.datasetMigrationRequested.message);
            });
            it("should migrate a sequential data set with wait = true", async () => {
                const migrateOptions: IMigrateOptions = { "request": "hmigrate", "wait": true };
                let error;
                let migrateResponse;
                let listResponse;

                try {
                    migrateResponse = await HMigrate.dataSet(REAL_SESSION, dataSet1, migrateOptions);
                    listResponse = await List.dataSet(REAL_SESSION, dataSet1, listOptions);
                    Imperative.console.info(`Response: ${inspect(migrateResponse)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(migrateResponse).toBeTruthy();
                expect(migrateResponse.success).toBe(true);
                expect(listResponse.apiResponse.items[0].migr).toBe("YES");
                expect(migrateResponse.commandResponse).toContain(ZosFilesMessages.datasetMigrationRequested.message);
            });
        });
        describe("Partitioned Data Set", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSet2);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("should migrate a partitioned dataset", async () => {
                let error;
                let migrateResponse;
                let listResponse;

                try {
                    migrateResponse = await HMigrate.dataSet(REAL_SESSION, dataSet2);
                    listResponse = await List.dataSet(REAL_SESSION, dataSet2, listOptions);
                    Imperative.console.info(`Response: ${inspect(migrateResponse)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(migrateResponse).toBeTruthy();
                expect(migrateResponse.success).toBe(true);
                expect(listResponse.apiResponse.items[0].migr).toBe("YES");
                expect(migrateResponse.commandResponse).toContain(ZosFilesMessages.datasetMigrationRequested.message);
            });
            it("should migrate a partitioned dataset with wait = true", async () => {
                const migrateOptions: IMigrateOptions = { "request": "hmigrate", "wait": true };
                let error;
                let migrateResponse;
                let listResponse;

                try {
                    migrateResponse = await HMigrate.dataSet(REAL_SESSION, dataSet2, migrateOptions);
                    listResponse = await List.dataSet(REAL_SESSION, dataSet2, listOptions);
                    Imperative.console.info(`Response: ${inspect(migrateResponse)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(migrateResponse).toBeTruthy();
                expect(migrateResponse.success).toBe(true);
                expect(listResponse.apiResponse.items[0].migr).toBe("YES");
                expect(migrateResponse.commandResponse).toContain(ZosFilesMessages.datasetMigrationRequested.message);
            });
        });
    });
    describe("Failure Scenarios", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSet3);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        it("should throw an error if data set name is undefined", async () => {
            let error;
            let migrateResponse;

            try {
                migrateResponse = await HMigrate.dataSet(REAL_SESSION, undefined);
                Imperative.console.info(`Response: ${inspect(migrateResponse)}`);
            } catch (err) {
                error = err;
                Imperative.console.info(`Error: ${inspect(err)}`);
            }

            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

            expect(migrateResponse).toBeFalsy();
        });
        it("should throw an error if data set name is missing", async () => {
            let error;
            let migrateResponse;

            try {
                migrateResponse = await HMigrate.dataSet(REAL_SESSION, "");
                Imperative.console.info(`Response: ${inspect(migrateResponse)}`);
            } catch (err) {
                error = err;
                Imperative.console.info(`Error: ${inspect(err)}`);
            }

            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

            expect(migrateResponse).toBeFalsy();
        });
    });
});
