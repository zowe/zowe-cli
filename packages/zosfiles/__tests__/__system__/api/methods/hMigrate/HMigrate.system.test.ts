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

import { Create, Delete, CreateDataSetTypeEnum, HMigrate, ZosFilesMessages, Get } from "../../../../..";
import { Imperative, Session } from "@brightside/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { List, IZosFilesResponse, IListOptions } from "../../../../../src/api";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dataSet1: string;
let dataSet2: string;

const options: IListOptions = { attributes: true };

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

    beforeEach(async () => {
        try {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSet1);
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSet2);
        } catch (err) {
            Imperative.console.info(`Error: ${inspect(err)}`);
        }
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
        it("Migrate sequential", async () => {
            let error;
            let migrateResponse;
            let listResponse;

            try {
                migrateResponse = await HMigrate.dataSet(REAL_SESSION, dataSet1);
                listResponse = await List.dataSet(REAL_SESSION, dataSet1, options);
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
        it("Migrate partitioned", async () => {
            let error;
            let migrateResponse;
            let listResponse;

            try {
                migrateResponse = await HMigrate.dataSet(REAL_SESSION, dataSet2);
                listResponse = await List.dataSet(REAL_SESSION, dataSet2, options);
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
    describe("Failure Scenarios", () => {
        it("Undefined data set name", async () => {
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
        it("Missing data set name", async () => {
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
