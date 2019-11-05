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

import { Create, List, Delete, CreateDataSetTypeEnum, ZosFilesMessages } from "../../../../..";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Rename } from "../../../../../src/api";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let beforeDSName: string;
let afterDSName: string;

describe("Rename", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_copy" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        beforeDSName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.BEFORE.SET`;
        afterDSName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.AFTER.SET`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Sequential data set", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, beforeDSName);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        describe("Success Scenarios", () => {
            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, afterDSName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should rename a sequential data set", async () => {
                let error;
                let response;
                let beforeList;
                let afterList;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDSName, afterDSName);
                    beforeList = await List.dataSet(REAL_SESSION, beforeDSName);
                    afterList = await List.dataSet(REAL_SESSION, afterDSName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetRenamedSuccessfully.message);

                expect(beforeList.apiResponse.returnedRows).toBe(0);
                expect(afterList.apiResponse.returnedRows).toBe(1);
            });
        });
        describe("Failure Scenarios", () => {
            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, beforeDSName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Shouldn't be able to rename a data set that doesn't exist", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, "NON.EXISTING.SET", afterDSName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set with an empty name", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, "", afterDSName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set with an undefined name", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, undefined, afterDSName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set to an empty name", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDSName, "");
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set to an undefined name", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDSName, undefined);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set without a session", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(undefined, beforeDSName, afterDSName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Required object must be defined");
                expect(response).toBeFalsy();
            });
        });
    });
    describe("Partitioned data set", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, beforeDSName);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        describe("Success Scenarios", () => {
            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, afterDSName);
                } catch (err) {
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }
            });
            it("Should rename a partitioned data set", async () => {
                let error;
                let response;
                let beforeList;
                let afterList;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDSName, afterDSName);
                    beforeList = await List.dataSet(REAL_SESSION, beforeDSName);
                    afterList = await List.dataSet(REAL_SESSION, afterDSName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetRenamedSuccessfully.message);

                expect(beforeList.apiResponse.returnedRows).toBe(0);
                expect(afterList.apiResponse.returnedRows).toBe(1);
            });
        });
    });
});
