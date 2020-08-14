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

import { Create, Delete, CreateDataSetTypeEnum, HRecall, ZosFilesMessages } from "../../../../..";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { List, IListOptions, IRecallOptions, HMigrate } from "../../../../src";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dataSet1: string;
let dataSet2: string;
let dataSet3: string;

const listOptions: IListOptions = { attributes: true };

describe("Recall Dataset", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_recall" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dataSet1 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.SDATA.REC`;
        dataSet2 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.PDATA.REC`;
        dataSet3 = `${defaultSystem.zosmf.user.trim().toUpperCase()}.FAIL.REC`;
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
            it("should recall a sequential data set", async () => {
                let error;
                let recallResponse;
                let listResponse;

                try {
                    recallResponse = await HRecall.dataSet(REAL_SESSION, dataSet1);
                    listResponse = await List.dataSet(REAL_SESSION, dataSet1, listOptions);
                    Imperative.console.info(`Response: ${inspect(recallResponse)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(recallResponse).toBeTruthy();
                expect(recallResponse.success).toBe(true);
                expect(listResponse.apiResponse.items[0].migr).toBe("NO");
                expect(recallResponse.commandResponse).toContain(ZosFilesMessages.datasetRecallRequested.message);
            });
            it("should recall a sequential data set with wait = true", async () => {
                const recallOptions: IRecallOptions = { wait: true };
                let error;
                let recallResponse;
                let listResponse;

                try {
                    recallResponse = await HRecall.dataSet(REAL_SESSION, dataSet1, recallOptions);
                    listResponse = await List.dataSet(REAL_SESSION, dataSet1, listOptions);
                    Imperative.console.info(`Response: ${inspect(recallResponse)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(recallResponse).toBeTruthy();
                expect(recallResponse.success).toBe(true);
                expect(listResponse.apiResponse.items[0].migr).toBe("NO");
                expect(recallResponse.commandResponse).toContain(ZosFilesMessages.datasetRecallRequested.message);
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
            it("should recall a partitioned dataset", async () => {
                let error;
                let recallResponse;
                let listResponse;

                try {
                    recallResponse = await HRecall.dataSet(REAL_SESSION, dataSet2);
                    listResponse = await List.dataSet(REAL_SESSION, dataSet2, listOptions);
                    Imperative.console.info(`Response: ${inspect(recallResponse)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(recallResponse).toBeTruthy();
                expect(recallResponse.success).toBe(true);
                expect(listResponse.apiResponse.items[0].migr).toBe("NO");
                expect(recallResponse.commandResponse).toContain(ZosFilesMessages.datasetRecallRequested.message);
            });
            it("should recall a partitioned dataset with wait = true", async () => {
                const recallOptions: IRecallOptions = { wait: true };
                let error;
                let recallResponse;
                let listResponse;

                try {
                    recallResponse = await HRecall.dataSet(REAL_SESSION, dataSet2, recallOptions);
                    listResponse = await List.dataSet(REAL_SESSION, dataSet2, listOptions);
                    Imperative.console.info(`Response: ${inspect(recallResponse)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(recallResponse).toBeTruthy();
                expect(recallResponse.success).toBe(true);
                expect(listResponse.apiResponse.items[0].migr).toBe("NO");
                expect(recallResponse.commandResponse).toContain(ZosFilesMessages.datasetRecallRequested.message);
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
            let recallResponse;

            try {
                recallResponse = await HRecall.dataSet(REAL_SESSION, undefined);
                Imperative.console.info(`Response: ${inspect(recallResponse)}`);
            } catch (err) {
                error = err;
                Imperative.console.info(`Error: ${inspect(err)}`);
            }

            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

            expect(recallResponse).toBeFalsy();
        });
        it("should throw an error if data set name is missing", async () => {
            let error;
            let recallResponse;

            try {
                recallResponse = await HRecall.dataSet(REAL_SESSION, "");
                Imperative.console.info(`Response: ${inspect(recallResponse)}`);
            } catch (err) {
                error = err;
                Imperative.console.info(`Error: ${inspect(err)}`);
            }

            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);

            expect(recallResponse).toBeFalsy();
        });
    });
});
