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

import { Create, CreateDataSetTypeEnum, Delete, IListOptions, IZosFilesResponse, List, Upload } from "../../../../../";
import { Imperative, Session } from "@brightside/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;

describe("List command group", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_file_list"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized,
        });

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.LIST`);
        Imperative.console.info("Using dsname:" + dsname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("All Members", () => {
        describe("Success Scenarios", () => {
            const testString = "test";
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                    await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testString), `${dsname}(${testString})`);
                } catch (err) {
                    throw err;
                }
            });

            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    throw err;
                }
            });

            it("should list all members of a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await List.allMembers(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0].member).toEqual(testString.toUpperCase());
            });

            it("should list all members of a data set with attributes", async () => {
                let error;
                let response: IZosFilesResponse;
                const option: IListOptions = {
                    attributes: true
                };

                try {
                    response = await List.allMembers(REAL_SESSION, dsname, option);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0].member).toEqual(testString.toUpperCase());
                expect(response.apiResponse.items[0].user).toBeDefined();
            });


            it("should display proper message when listing data set members and data set is empty", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    await Delete.dataSet(REAL_SESSION, `${dsname}(${testString})`);
                    response = await List.allMembers(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.commandResponse).toBe(null);
            });
        });

        describe("Failure Scenarios", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await List.allMembers(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper message when listing data set members and data set does not exists", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await List.allMembers(REAL_SESSION, dsname + ".dummy");
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Data set not cataloged");
            });
        });
    });

    describe("Data Set", () => {
        describe("Success Scenarios", () => {
            const testString = "test";
            beforeEach(async () => {
                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                } catch (err) {
                    throw err;
                }
            });

            afterEach(async () => {
                try {
                    await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    throw err;
                }
            });

            it("should list a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await List.dataSet(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0].dsname).toEqual(dsname);
            });

            it("should list a data set with attributes", async () => {
                let error;
                let response: IZosFilesResponse;
                const option: IListOptions = {
                    attributes: true
                };

                try {
                    response = await List.dataSet(REAL_SESSION, dsname, option);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(1);
                expect(response.apiResponse.items[0].dsname).toEqual(dsname);
                expect(response.apiResponse.items[0].dsorg).toBeDefined();
            });
        });

        describe("Failure Scenarios", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await List.dataSet(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper message when listing data set members and data set does not exists", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await List.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                expect(error).toBeFalsy();
                expect(response).toBeDefined();
                expect(response.commandResponse).toBe(null);
            });
        });
    });
});
