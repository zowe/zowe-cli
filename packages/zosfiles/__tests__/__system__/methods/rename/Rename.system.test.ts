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

import { Create, CreateDataSetTypeEnum, Delete, List, Rename, Upload, ZosFilesMessages } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { join } from "path";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let beforeDataSetName: string;
let afterDataSetName: string;

const beforeMemberName: string = "file1";
const afterMemberName: string = "file2";
const fileLocation: string = join(__dirname, "testfiles", `${beforeMemberName}.txt`);

describe("Rename", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({ testName: "zos_file_copy" });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        beforeDataSetName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.BEFORE.SET`;
        afterDataSetName = `${defaultSystem.zosmf.user.trim().toUpperCase()}.AFTER.SET`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    afterEach(async () => {
        await Promise.all([
            Delete.dataSet(REAL_SESSION, beforeDataSetName),
            Delete.dataSet(REAL_SESSION, afterDataSetName)
        ].map((p) => p.catch((err) => err)));
    });

    describe("Sequential data set", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, beforeDataSetName);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        describe("Success Scenarios", () => {
            it("Should rename a sequential data set", async () => {
                let error;
                let response;
                let beforeList;
                let afterList;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDataSetName, afterDataSetName);
                    beforeList = await List.dataSet(REAL_SESSION, beforeDataSetName);
                    afterList = await List.dataSet(REAL_SESSION, afterDataSetName);
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
            it("Should rename a sequential data set with response timeout", async () => {
                let error;
                let response;
                let beforeList;
                let afterList;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDataSetName, afterDataSetName, {responseTimeout: 5});
                    beforeList = await List.dataSet(REAL_SESSION, beforeDataSetName, {responseTimeout: 5});
                    afterList = await List.dataSet(REAL_SESSION, afterDataSetName, {responseTimeout: 5});
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
            it("Should trim the name before renaming a sequential data set", async () => {
                let error;
                let response;
                let beforeList;
                let afterList;

                try {
                    response = await Rename.dataSet(
                        REAL_SESSION,
                        `   ${beforeDataSetName}   `,
                        `   ${afterDataSetName}   `
                    );
                    beforeList = await List.dataSet(REAL_SESSION, beforeDataSetName);
                    afterList = await List.dataSet(REAL_SESSION, afterDataSetName);
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
            it("Shouldn't be able to rename a data set to a name that already exists", async () => {
                let error;
                let response;

                try {
                    await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, afterDataSetName);
                    response = await Rename.dataSet(REAL_SESSION, beforeDataSetName, afterDataSetName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set that doesn't exist", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, "NON.EXISTING.SET.BDLL12", afterDataSetName);
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
                    response = await Rename.dataSet(REAL_SESSION, "", afterDataSetName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Required parameter 'beforeDataSetName' must not be blank");
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set with an undefined name", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, undefined, afterDataSetName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Required object must be defined");
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set to an empty name", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDataSetName, "");
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Required parameter 'afterDataSetName' must not be blank");
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set to an undefined name", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDataSetName, undefined);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Required object must be defined");
                expect(response).toBeFalsy();
            });
            it("Shouldn't be able to rename a data set without a session", async () => {
                let error;
                let response;

                try {
                    response = await Rename.dataSet(undefined, beforeDataSetName, afterDataSetName);
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
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, beforeDataSetName);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        describe("Success Scenarios", () => {
            it("Should rename a partitioned data set", async () => {
                let error;
                let response;
                let beforeList;
                let afterList;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDataSetName, afterDataSetName);
                    beforeList = await List.dataSet(REAL_SESSION, beforeDataSetName);
                    afterList = await List.dataSet(REAL_SESSION, afterDataSetName);
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
            it("Should rename a partitioned data set with response timeout", async () => {
                let error;
                let response;
                let beforeList;
                let afterList;

                try {
                    response = await Rename.dataSet(REAL_SESSION, beforeDataSetName, afterDataSetName, {responseTimeout: 5});
                    beforeList = await List.dataSet(REAL_SESSION, beforeDataSetName, {responseTimeout: 5});
                    afterList = await List.dataSet(REAL_SESSION, afterDataSetName, {responseTimeout: 5});
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
    describe("Member", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, beforeDataSetName);
                await Upload.fileToDataset(REAL_SESSION, fileLocation, beforeDataSetName);
            } catch (err) {
                Imperative.console.info(`Error: ${inspect(err)}`);
            }
        });
        describe("Success Scenarios", () => {
            it("Should rename a data set member", async () => {
                let error;
                let response;
                let allMembers;

                try {
                    response = await Rename.dataSetMember(REAL_SESSION, beforeDataSetName, beforeMemberName, afterMemberName);
                    allMembers = await List.allMembers(REAL_SESSION, beforeDataSetName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetRenamedSuccessfully.message);

                expect(allMembers.apiResponse.items.length).toBe(1);
                expect(allMembers.apiResponse.items[0].member).toBe(afterMemberName.toUpperCase());
            });
            it("Should rename a data set member with response timeout", async () => {
                let error;
                let response;
                let allMembers;

                try {
                    response = await Rename.dataSetMember(REAL_SESSION, beforeDataSetName, beforeMemberName, afterMemberName, {responseTimeout: 5});
                    allMembers = await List.allMembers(REAL_SESSION, beforeDataSetName, {responseTimeout: 5});
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetRenamedSuccessfully.message);

                expect(allMembers.apiResponse.items.length).toBe(1);
                expect(allMembers.apiResponse.items[0].member).toBe(afterMemberName.toUpperCase());
            });
            it("Should trim the input names before renaming a data set member", async () => {
                let error;
                let response;
                let allMembers;

                try {
                    response = await Rename.dataSetMember(
                        REAL_SESSION,
                        `   ${beforeDataSetName}   `,
                        `   ${beforeMemberName}   `,
                        `   ${afterMemberName}   `
                    );
                    allMembers = await List.allMembers(REAL_SESSION, beforeDataSetName);
                    Imperative.console.info(`Response: ${inspect(response)}`);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeFalsy();

                expect(response).toBeTruthy();
                expect(response.success).toBe(true);
                expect(response.commandResponse).toContain(ZosFilesMessages.dataSetRenamedSuccessfully.message);

                expect(allMembers.apiResponse.items.length).toBe(1);
                expect(allMembers.apiResponse.items[0].member).toBe(afterMemberName.toUpperCase());
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw an error if the member already exists", async () => {
                let error;
                let response;

                try {
                    await Rename.dataSetMember(REAL_SESSION, beforeDataSetName, beforeMemberName, afterMemberName);
                    await Upload.fileToDataset(REAL_SESSION, fileLocation, beforeDataSetName);
                    response = await Rename.dataSetMember(REAL_SESSION, beforeDataSetName, beforeMemberName, afterMemberName);
                } catch (err) {
                    error = err;
                    Imperative.console.info(`Error: ${inspect(err)}`);
                }

                expect(error).toBeTruthy();
                expect(error.message).toContain("Member already exists");

                expect(response).toBeFalsy();
            });
        });
    });
});
