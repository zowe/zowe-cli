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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { join } from "path";
import { Session, Imperative } from "@zowe/core-for-zowe-sdk";
import { List, Delete, Create, CreateDataSetTypeEnum, IListOptions, IMigrateOptions } from "@zowe/zos-files-for-zowe-sdk";
import { inspect } from "util";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dataSetName1: string;
let dataSetName2: string;
let dataSetName3: string;
let user: string;
let REAL_SESSION: Session;

const listOptions: IListOptions = { attributes: true };

const scriptsLocation = join(__dirname, "__scripts__", "command");
const migrateScript = join(scriptsLocation, "command_migrate_data_set.sh");
const migrateScriptWait = join(scriptsLocation, "command_migrate_data_set_wait.sh");
const migrateScriptResponseTimeout = join(scriptsLocation, "command_migrate_data_set_response_timeout.sh");

describe("Migrate Dataset", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_migrate_data_set"
        });
        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        dataSetName1 = `${user}.SDATAC.MIGR`;
        dataSetName2 = `${user}.PDATAC.MIGR`;
        dataSetName3 = `${user}.FAIL.MIGR`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    afterEach(async () => {
        try {
            await Promise.all([
                Delete.dataSet(REAL_SESSION, dataSetName1),
                Delete.dataSet(REAL_SESSION, dataSetName2),
                Delete.dataSet(REAL_SESSION, dataSetName3)]);
        } catch (err) {
            Imperative.console.info(`Error: ${inspect(err)}`);
        }
    });

    describe("Success scenarios", () => {
        describe("Sequential Data Set", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSetName1);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should migrate a data set", async () => {
                const response = runCliScript(migrateScript, TEST_ENVIRONMENT, [dataSetName1]);
                const list1 = await List.dataSet(REAL_SESSION, dataSetName1, listOptions);

                expect(list1.apiResponse.items[0].migr).toBe("YES");

                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set migraton requested.");
            });
            it("Should migrate a data set with response timeout", async () => {
                const response = runCliScript(migrateScriptResponseTimeout, TEST_ENVIRONMENT, [dataSetName1]);
                const list1 = await List.dataSet(REAL_SESSION, dataSetName1, listOptions);

                expect(list1.apiResponse.items[0].migr).toBe("YES");

                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set migraton requested.");
            });
            it("Should migrate a data set with wait = true", async () => {
                const migrateOptions: IMigrateOptions = { wait: true };
                const response = runCliScript(migrateScriptWait, TEST_ENVIRONMENT, [dataSetName1, migrateOptions]);
                const list1 = await List.dataSet(REAL_SESSION, dataSetName1, listOptions);

                expect(list1.apiResponse.items[0].migr).toBe("YES");

                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set migraton requested.");
            });
        });
        describe("Partitioned Data Set", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSetName2);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should migrate a data set", async () => {
                const response = runCliScript(migrateScript, TEST_ENVIRONMENT, [dataSetName2]);
                const list2 = await List.dataSet(REAL_SESSION, dataSetName2, listOptions);

                expect(list2.apiResponse.items[0].migr).toBe("YES");

                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set migraton requested.");
            });
            it("Should migrate a data set with response timeout", async () => {
                const response = runCliScript(migrateScriptResponseTimeout, TEST_ENVIRONMENT, [dataSetName2]);
                const list2 = await List.dataSet(REAL_SESSION, dataSetName2, listOptions);

                expect(list2.apiResponse.items[0].migr).toBe("YES");

                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set migraton requested.");
            });
            it("Should migrate a data set with wait = true", async () => {
                const migrateOptions: IMigrateOptions = { wait: true };
                const response = runCliScript(migrateScriptWait, TEST_ENVIRONMENT, [dataSetName2, migrateOptions]);
                const list2 = await List.dataSet(REAL_SESSION, dataSetName2, listOptions);

                expect(list2.apiResponse.items[0].migr).toBe("YES");

                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Data set migraton requested.");
            });
        });
    });
    describe("Failure scenarios", () => {
        describe("Sequential Data Set", () => {
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSetName3);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should throw an error if a missing data set name is selected", async () => {
                const response = runCliScript(migrateScript, TEST_ENVIRONMENT, ["", dataSetName3]);

                expect(response.stderr.toString()).toBeTruthy();
                expect(response.status).toBe(1);
                expect(response.stdout.toString()).not.toContain("Data set migraton requested.");
            });
        });
    });
});
