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
import { runCliScript } from "../../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Delete, Create, CreateDataSetTypeEnum, Upload, Get } from "../../../../../../../../packages/zosfiles/src";
import { join } from "path";

let REAL_SESSION: Session;
let TEST_ENVIRONMENT: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let beforeDataSetName: string;
let afterDataSetName: string;
let user: string;
const memberName = "mem";

describe("Rename data set", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_rename_data_set"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        beforeDataSetName = `${user}.BEFORE.DATA.SET`;
        afterDataSetName = `${user}.AFTER.DATA.SET`;
    });
    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    afterEach(async () => {
        await Promise.all([
            Delete.dataSet(REAL_SESSION, beforeDataSetName),
            Delete.dataSet(REAL_SESSION, afterDataSetName)
        ].map((p) => p.catch((err) => err)));
    });
    describe("success scenarios", () => {
        const data = "1234";
        describe("sequential", () => {
            beforeEach(async () => {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, beforeDataSetName);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(data), beforeDataSetName);
            });
            it("should rename a data set from the command", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_rename_data_set.sh"),
                        TEST_ENVIRONMENT,
                        [beforeDataSetName, afterDataSetName]
                    );
                    contents = await Get.dataSet(REAL_SESSION, afterDataSetName);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
                expect(contents.toString().trim()).toBe(data);
            });
            it("should rename a data set from the command with response timeout", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_rename_data_set.sh"),
                        TEST_ENVIRONMENT,
                        [beforeDataSetName, afterDataSetName, "--responseTimeout 5"]
                    );
                    contents = await Get.dataSet(REAL_SESSION, afterDataSetName);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
                expect(contents.toString().trim()).toBe(data);
            });
        });
        describe("partitioned", () => {
            beforeEach(async () => {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, beforeDataSetName);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(data), `${beforeDataSetName}(${memberName})`);
            });
            it("should rename a data set from the command", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_rename_data_set.sh"),
                        TEST_ENVIRONMENT,
                        [beforeDataSetName, afterDataSetName]
                    );
                    contents = await Get.dataSet(REAL_SESSION, `${afterDataSetName}(${memberName})`);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
                expect(contents.toString().trim()).toBe(data);
            });
            it("should rename a data set from the command with response timeout", async () => {
                let response;
                let contents;
                let error;

                try {
                    response = runCliScript(
                        join(__dirname, "__scripts__", "command", "command_rename_data_set.sh"),
                        TEST_ENVIRONMENT,
                        [beforeDataSetName, afterDataSetName, "--responseTimeout 5"]
                    );
                    contents = await Get.dataSet(REAL_SESSION, `${afterDataSetName}(${memberName})`);
                } catch(err) {
                    error = err;
                }

                expect(error).toBe(undefined);
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
                expect(contents.toString().trim()).toBe(data);
            });
        });
    });
});
