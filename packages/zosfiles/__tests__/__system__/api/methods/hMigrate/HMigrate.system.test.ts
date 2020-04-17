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

import { Create, Delete, CreateDataSetTypeEnum, HMigrate, ZosFilesMessages } from "../../../../..";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { List, IListOptions } from "../../../../../src/api";
import { IMigrateOptions } from "../../../../../src/api/methods/hMigrate/doc/IMigrateOptions";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dataSet1: string;
let dataSet2: string;

const listOptions: IListOptions = { attributes: true };

describe("Migrate Dataset", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_migrate" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dataSet1 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.SDATA.SET`;
        dataSet2 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.PDATA.SET`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    afterEach(async () => {
        try {
            await Delete.dataSet(REAL_SESSION, dataSet1);
            await Delete.dataSet(REAL_SESSION, dataSet2);
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
                expect(migrateResponse.commandResponse).toContain(ZosFilesMessages.datasetMigratedSuccessfully.message);
            });
            it("should migrate a sequential data set with wait = true", async () => {
                const migrateOptions: IMigrateOptions = { wait: true };
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
                expect(migrateResponse.commandResponse).toContain(ZosFilesMessages.datasetMigratedSuccessfully.message);
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
                expect(migrateResponse.commandResponse).toContain(ZosFilesMessages.datasetMigratedSuccessfully.message);
            });
            it("should migrate a partitioned dataset with wait = true", async () => {
                const migrateOptions: IMigrateOptions = { wait: true };
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
                expect(migrateResponse.commandResponse).toContain(ZosFilesMessages.datasetMigratedSuccessfully.message);
            });
        });
    });
    describe("Failure Scenarios", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSet1);
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
