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

import { Create, CreateDataSetTypeEnum, Delete, ZosFilesMessages } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;

describe("Delete Dataset", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_delete"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dsname = `${defaultSystem.zosmf.user.trim().toUpperCase()}.TEST.DATA.SET.DELETE`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            let response;

            try {
                response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a partitioned data set", async () => {
            let error;
            let response;

            try {
                response = await Delete.dataSet(REAL_SESSION, dsname);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletedSuccessfully.message);
        });

        it("should delete a partitioned data set with response timeout", async () => {
            let error;
            let response;

            try {
                response = await Delete.dataSet(REAL_SESSION, dsname, {responseTimeout: 5});
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletedSuccessfully.message);
        });
    });

    describe("Failure scenarios", () => {
        it("should display proper error message when called with invalid data set name", async () => {
            let error;
            let response;

            try {
                response = await Delete.dataSet(REAL_SESSION, undefined);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should display proper error message when try to delete non existing data set", async () => {
            let error;
            let response;
            const nonExistDsname = `${defaultSystem.zosmf.user.trim().toUpperCase()}.NON.EXIST.DATA.SET`;

            try {
                response = await Delete.dataSet(REAL_SESSION, nonExistDsname);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(nonExistDsname);
            expect(error.message).toContain("Data set not cataloged");
        });
    });

});

describe("Delete Dataset - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_delete"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dsname = `${defaultSystem.zosmf.user.trim().toUpperCase()}.TEST.ENCO#ED.DATA.SET.DELETE`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            let response;

            try {
                response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a partitioned data set", async () => {
            let error;
            let response;

            try {
                response = await Delete.dataSet(REAL_SESSION, dsname);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.datasetDeletedSuccessfully.message);
        });
    });
});