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

import { Create, CreateDataSetTypeEnum, Delete, IListOptions, IZosFilesResponse, List, Upload, ZosFilesMessages } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { format, inspect } from "util";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName, wait, waitTime } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let dsname2: string;
let path: string;
let filename: string;

describe("List command group", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_list"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.LIST`, false, 1);
        dsname2 = dsname + '2';
        Imperative.console.info("Using dsname:" + dsname);

        const user = `${defaultSystem.zosmf.user.trim()}`.replace(/\./g, "");
        path = `${defaultSystem.unix.testdir}/${user}`;
        filename = "aTestUssFile.txt";
        Imperative.console.info("Using USS path:" + path + " and filename " + filename);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("All Members", () => {
        describe("Success Scenarios", () => {
            const memberOne = "test";
            const memberTwo = "test2";
            beforeEach(async () => {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname,
                    { volser: defaultSystem.datasets.vol });
                await wait(waitTime); //wait 2 seconds
                // first data set member
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(memberOne), `${dsname}(${memberOne})`);
                // second data set member
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(memberOne), `${dsname}(${memberTwo})`);
                await wait(waitTime); //wait 2 seconds
            });

            afterEach(async () => {
                await Delete.dataSet(REAL_SESSION, dsname);
                await wait(waitTime); //wait 2 seconds
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
                expect(response.apiResponse.items.length).toBe(2);
                expect(response.apiResponse.items[0].member).toEqual(memberOne.toUpperCase());
                expect(response.apiResponse.items[1].member).toEqual(memberTwo.toUpperCase());
            });

            it("should limit number of members when maxLength is provided", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await List.allMembers(REAL_SESSION, dsname, {maxLength: 1});
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
                expect(response.apiResponse.items[0].member).toEqual(memberOne.toUpperCase());
            });

            it("should return a list starting with the given member in the start option", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await List.allMembers(REAL_SESSION, dsname, { start: memberTwo });
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
                expect(response.apiResponse.items[0].member).toEqual(memberTwo.toUpperCase());
            });

            it("should list all members of a data set with response timeout", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await List.allMembers(REAL_SESSION, dsname, {responseTimeout: 5});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBe(2);
                expect(response.apiResponse.items[0].member).toEqual(memberOne.toUpperCase());
                expect(response.apiResponse.items[1].member).toEqual(memberTwo.toUpperCase());
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
                expect(response.apiResponse.items.length).toBe(2);
                expect(response.apiResponse.items[0].member).toEqual(memberOne.toUpperCase());
                expect(response.apiResponse.items[1].member).toEqual(memberTwo.toUpperCase());
                expect(response.apiResponse.items[0].user).toBeDefined();
            });


            it("should display proper message when listing data set members and data set is empty", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    await Delete.dataSet(REAL_SESSION, `${dsname}(${memberOne})`);
                    await Delete.dataSet(REAL_SESSION, `${dsname}(${memberTwo})`);
                    await wait(waitTime); //wait 2 seconds
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
            beforeEach(async () => {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname,
                    { volser: defaultSystem.datasets.vol });
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname2,
                    { volser: defaultSystem.datasets.vol });
                await wait(waitTime); //wait 2 seconds
            });

            afterEach(async () => {
                await Delete.dataSet(REAL_SESSION, dsname);
                await Delete.dataSet(REAL_SESSION, dsname2);
                await wait(waitTime); //wait 2 seconds
            });

            it("should list data set matching dsname", async () => {
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

            it("should limit amount of data sets with maxLength", async () => {
                let error;
                let response: IZosFilesResponse;

                try {
                    response = await List.dataSet(REAL_SESSION, `${dsname}*`, { maxLength: 1 });
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

            it("should list a data set with attributes and start options", async () => {
                let error;
                let response: IZosFilesResponse;
                const option: IListOptions = {
                    attributes: true,
                    start: dsname2
                };

                try {
                    response = await List.dataSet(REAL_SESSION, `${dsname}*`, option);
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
                expect(response.apiResponse.items[0].dsname).toEqual(dsname2);
                expect(response.apiResponse.items[0].dsorg).toBeDefined();
            });

            it("should list a data set with attributes and volser options", async () => {
                let error;
                let response: IZosFilesResponse;
                const option: IListOptions = {
                    attributes: true
                };

                try {
                    response = await List.dataSet(REAL_SESSION, dsname, option);  // Get the volser
                    response = await List.dataSet(REAL_SESSION, dsname, { ...option, volume: response.apiResponse.items[0].volser });
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

    describe("USS Files", () => {

        describe("Success scenarios", () => {
            beforeAll(async () => {
                try {
                    await Create.uss(REAL_SESSION, path, "directory");
                    await wait(waitTime); //wait 2 seconds
                    await Create.uss(REAL_SESSION, `${path}/${filename}`, "file");
                    await wait(waitTime); //wait 2 seconds
                } catch (err) {
                    Imperative.console.info("Error: " + inspect(err));
                }
            });

            afterAll(async () => {
                let error;
                let response;
                try {
                    response = await Delete.ussFile(REAL_SESSION, path, true);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
            });

            it("should list a uss directory", async () => {
                let error;
                let response;

                try {
                    response = await List.fileList(REAL_SESSION, path);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items[0].name).toEqual(".");
                expect(response.apiResponse.items[0].mode.startsWith("d")).toBeTruthy();
                expect(response.apiResponse.items[1].name).toEqual("..");
                expect(response.apiResponse.items[2].name).toEqual(filename); // Intermittent failure : (
                expect(response.apiResponse.items[2].mode.startsWith("d")).toBeFalsy();
            });

            it("should list a uss directory but limited to one", async () => {
                let error;
                let response;

                try {
                    response = await List.fileList(REAL_SESSION, path, {maxLength: 1});
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items[0].name).toEqual(".");
                expect(response.apiResponse.items[0].mode.startsWith("d")).toBeTruthy();
                expect(response.apiResponse.items.length).toBe(1);
            });

            describe("Filter Options", () => {
                let listResponse: any;

                beforeAll(async () => {
                    let error;
                    let response;
                    try {
                        response = await List.fileList(REAL_SESSION, path);
                        listResponse = response.apiResponse.items.find((item: any) => item.mode.startsWith("-"));
                        Imperative.console.info("Response: " + inspect(response));
                    } catch (err) {
                        error = err;
                        Imperative.console.info("Error: " + inspect(error));
                    }
                });

                it("should filter by group", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { group: listResponse.group });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { group: listResponse.group + "-invalid" });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });

                it("should filter by group ID", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { group: listResponse.gid });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { group: listResponse.gid + 1 });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });

                it("should filter by user", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { user: listResponse.user });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { user: listResponse.user + "-invalid" });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });

                it("should filter by user ID", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { user: listResponse.uid });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { user: listResponse.uid + 1 });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });

                it("should filter by name", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { name: listResponse.name });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { name: listResponse.name + "-invalid" });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });

                it("should filter by size", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { size: listResponse.size });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { size: listResponse.size + 1 });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });

                it("should filter by mtime", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { mtime: -1 });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { mtime: 1 });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });

                it("should filter by perm", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { perm: "-444" });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { perm: "-777" });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });

                it("should filter by type", async () => {
                    let response = await List.fileList(REAL_SESSION, path, { type: "f" });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeDefined();

                    response = await List.fileList(REAL_SESSION, path, { type: "d" });
                    expect(response.success).toBe(true);
                    expect(response.apiResponse.items.find((item: any) => item.name === filename)).toBeUndefined();
                });
            });
        });

        describe("Failure Scenarios", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;
                try {
                    response = await List.fileList(undefined, path);
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper error message when path is undefined", async () => {
                let response: IZosFilesResponse;
                let error;
                try {
                    response = await List.fileList(REAL_SESSION, undefined);
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
            });

            it("should display proper error message when path is empty string", async () => {
                let response: IZosFilesResponse;
                let error;
                try {
                    response = await List.fileList(REAL_SESSION, "");
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
            });

            it("should display proper error message when required table parameters are missing", async () => {
                let response: IZosFilesResponse;
                let error;
                try {
                    response = await List.fileList(REAL_SESSION, path, { depth: 1 });
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain(ZosFilesMessages.missingRequiredTableParameters.message);
            });

            it("should display proper message when listing path files and file does not exists", async () => {
                let response: IZosFilesResponse;
                let error;
                try {
                    response = await List.fileList(REAL_SESSION, path);
                } catch (err) {
                    error = err;
                }
                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error).toBeDefined();
                expect(error.message).toContain("Path name not found");
            });
        });
    });

    describe("file System", () => {

        describe("Success scenarios", () => {

            it("should list all files system", async () => {
                let error;
                let response;

                try {
                    response = await List.fs(REAL_SESSION);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBeGreaterThan(0);
                expect(response.apiResponse.items[0]).toHaveProperty("name");
                expect(response.apiResponse.items[0]).toHaveProperty("mountpoint");
            });

            it("should list a uss directory but limited to one", async () => {
                let error;
                let response;

                try {
                    response = await List.fs(REAL_SESSION, {maxLength: 1});
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
                expect(response.apiResponse.items[0]).toHaveProperty("name");
                expect(response.apiResponse.items[0]).toHaveProperty("mountpoint");
            });
        });

    });

    describe("dataSetsMatchingPattern", () => {
        beforeEach(async () => {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname,
                { volser: defaultSystem.datasets.vol });
            await wait(waitTime); //wait 2 seconds
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname + ".LIKE",
                { volser: defaultSystem.datasets.vol });
            await wait(waitTime); //wait 2 seconds
        });

        afterEach(async () => {
            await Delete.dataSet(REAL_SESSION, dsname);
            await wait(waitTime); //wait 2 seconds
            await Delete.dataSet(REAL_SESSION, dsname + ".LIKE");
            await wait(waitTime); //wait 2 seconds
        });

        it("should find data sets that match a pattern", async () => {
            let response;
            let caughtError;

            try {
                response = await List.dataSetsMatchingPattern(REAL_SESSION, [dsname]);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(format(ZosFilesMessages.dataSetsMatchedPattern.message, 2));
            expect(response.apiResponse.length).toBe(2);
            expect(response.apiResponse[0].dsname).toBe(dsname);
            expect(response.apiResponse[1].dsname).toBe(dsname + ".LIKE");
        });

        it("should exclude data sets that do not match a pattern", async () => {
            let response;
            let caughtError;

            try {
                response = await List.dataSetsMatchingPattern(REAL_SESSION, [dsname],
                    { excludePatterns: [dsname + ".LIKE"] });
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(format(ZosFilesMessages.dataSetsMatchedPattern.message, 1));
            expect(response.apiResponse.length).toBe(1);
            expect(response.apiResponse[0].dsname).toBe(dsname);
        });

        it("should fail when no data sets match", async () => {
            let response;
            let caughtError;

            try {
                response = await List.dataSetsMatchingPattern(REAL_SESSION, [dsname + ".INVAL"]);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).not.toBeDefined();
            expect(response).toBeDefined();
            expect(response.commandResponse).toContain("There are no data sets that match");
        });
    });

    describe("membersMatchingPattern", () => {
        const members = ["M1", "M1A", "M2", "M3"];
        const pattern = "M*";
        beforeEach(async () => {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname,
                { volser: defaultSystem.datasets.vol });
            await wait(waitTime); //wait 2 seconds
            for(const mem of members) {
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(mem), `${dsname}(${mem})`);
            }
            await wait(waitTime); //wait 2 seconds
        });

        afterEach(async () => {
            await Delete.dataSet(REAL_SESSION, dsname);
            await wait(waitTime); //wait 2 seconds
        });

        it("should find data sets that match a pattern", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                response = await List.membersMatchingPattern(REAL_SESSION, dsname, [pattern]);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe("4 members(s) were found matching pattern.");
            expect(response.apiResponse.length).toBe(4);
            expect(response.apiResponse[0].member).toEqual(members[0].toUpperCase());
        });

        it("should exclude data sets that do not match a pattern", async () => {
            let response;
            let caughtError;

            try {
                response = await List.membersMatchingPattern(REAL_SESSION, dsname, [pattern],
                    { excludePatterns: ["M1*"] });
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(format(ZosFilesMessages.membersMatchedPattern.message, 2));
            expect(response.apiResponse.length).toBe(2);
        });

        it("should fail when no data sets match", async () => {
            let response;
            let caughtError;
            const pattern = "test*";

            try {
                response = await List.membersMatchingPattern(REAL_SESSION, dsname, [pattern]);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).not.toBeDefined();
            expect(response).toBeDefined();
            expect(response.commandResponse).toContain("There are no members that match");
        });

        it("should limit number of members when maxLength is provided", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                response = await List.membersMatchingPattern(REAL_SESSION, dsname, [pattern], { maxLength: 1 });
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe("1 members(s) were found matching pattern.");
            expect(response.apiResponse.length).toBe(1);
            expect(response.apiResponse[0].member).toEqual(members[0]);
        });

        it("should return a list starting with the given member in the start option", async () => {
            let error;
            let response: IZosFilesResponse;

            try {
                response = await List.membersMatchingPattern(REAL_SESSION, dsname, [pattern], { start: "M1A" });
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe("3 members(s) were found matching pattern.");
            expect(response.apiResponse.length).toBe(3);
            expect(response.apiResponse[0].member).toEqual(members[1]);
        });
    });

});

describe("List command group - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_file_list"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.LIST`, true);
        Imperative.console.info("Using dsname:" + dsname);

        const user = `${defaultSystem.zosmf.user.trim()}`.replace(/\./g, "");
        path = `${defaultSystem.unix.testdir}/ENCO#ED${user}`;
        filename = "anEnco#edTestUssFile.txt";
        Imperative.console.info("Using USS path:" + path + " and filename " + filename);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("All Members", () => {
        describe("Success Scenarios", () => {
            const testString = "test";
            beforeEach(async () => {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname,
                    { volser: defaultSystem.datasets.vol });
                await wait(waitTime); //wait 2 seconds
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testString), `${dsname}(${testString})`);
                await wait(waitTime); //wait 2 seconds
            });

            afterEach(async () => {
                await Delete.dataSet(REAL_SESSION, dsname);
                await wait(waitTime); //wait 2 seconds
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
        });
    });

    describe("Data Set", () => {
        describe("Success Scenarios", () => {
            beforeEach(async () => {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname,
                    { volser: defaultSystem.datasets.vol });
                await wait(waitTime); //wait 2 seconds
            });

            afterEach(async () => {
                await Delete.dataSet(REAL_SESSION, dsname);
                await wait(waitTime); //wait 2 seconds
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

            it("should list a data set with attributes and start options", async () => {
                let error;
                let response: IZosFilesResponse;
                const option: IListOptions = {
                    attributes: true,
                    start: dsname
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

            it("should list a data set with attributes and volser options", async () => {
                let error;
                let response: IZosFilesResponse;
                const option: IListOptions = {
                    attributes: true
                };

                try {
                    response = await List.dataSet(REAL_SESSION, dsname, option);  // Get the volser
                    response = await List.dataSet(REAL_SESSION, dsname, { ...option, volume: response.apiResponse.items[0].volser });
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
    });

    describe("USS Files", () => {

        describe("Success scenarios", () => {
            beforeAll(async () => {
                try {
                    await Create.uss(REAL_SESSION, path, "directory");
                    await wait(waitTime); //wait 2 seconds
                    await Create.uss(REAL_SESSION, `${path}/${filename}`, "file");
                    await wait(waitTime); //wait 2 seconds
                } catch (err) {
                    Imperative.console.info("Error: " + inspect(err));
                }
            });

            afterAll(async () => {
                let error;
                let response;
                try {
                    response = await Delete.ussFile(REAL_SESSION, path, true);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
            });

            it("should list a uss directory", async () => {
                let error;
                let response;

                try {
                    response = await List.fileList(REAL_SESSION, path);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items[0].name).toEqual(".");
                expect(response.apiResponse.items[0].mode.startsWith("d")).toBeTruthy();
                expect(response.apiResponse.items[1].name).toEqual("..");
                expect(response.apiResponse.items[2].name).toEqual(filename); // Intermittent failure : (
                expect(response.apiResponse.items[2].mode.startsWith("d")).toBeFalsy();
            });
        });
    });

    describe("file System", () => {

        describe("Success scenarios", () => {

            it("should list all files system", async () => {
                let error;
                let response;

                try {
                    response = await List.fs(REAL_SESSION);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }

                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toBe(null);
                expect(response.apiResponse.items.length).toBeGreaterThan(0);
                expect(response.apiResponse.items[0]).toHaveProperty("name");
                expect(response.apiResponse.items[0]).toHaveProperty("mountpoint");
            });

            it("should list a uss directory but limited to one", async () => {
                let error;
                let response;

                try {
                    response = await List.fs(REAL_SESSION, {maxLength: 1});
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
                expect(response.apiResponse.items[0]).toHaveProperty("name");
                expect(response.apiResponse.items[0]).toHaveProperty("mountpoint");
            });
        });

    });

    describe("dataSetsMatchingPattern", () => {
        beforeEach(async () => {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname,
                { volser: defaultSystem.datasets.vol });
            await wait(waitTime); //wait 2 seconds
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname + ".LIKE",
                { volser: defaultSystem.datasets.vol });
            await wait(waitTime); //wait 2 seconds
        });

        afterEach(async () => {
            await Delete.dataSet(REAL_SESSION, dsname);
            await wait(waitTime); //wait 2 seconds
            await Delete.dataSet(REAL_SESSION, dsname + ".LIKE");
            await wait(waitTime); //wait 2 seconds
        });

        it("should find data sets that match a pattern", async () => {
            let response;
            let caughtError;

            try {
                response = await List.dataSetsMatchingPattern(REAL_SESSION, [dsname]);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(format(ZosFilesMessages.dataSetsMatchedPattern.message, 2));
            expect(response.apiResponse.length).toBe(2);
            expect(response.apiResponse[0].dsname).toBe(dsname);
            expect(response.apiResponse[1].dsname).toBe(dsname + ".LIKE");
        });

        it("should find one data set when listing 2 patterns with maxLength = 1", async () => {
            let response;
            let caughtError;

            try {
                response = await List.dataSetsMatchingPattern(REAL_SESSION, [dsname, dsname + ".LIKE"], { maxLength: 1 });
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(format(ZosFilesMessages.dataSetsMatchedPattern.message, 1));
            expect(response.apiResponse.length).toBe(1);
            expect(response.apiResponse[0].dsname).toBe(dsname);
        });

        it("should exclude data sets that do not match a pattern", async () => {
            let response;
            let caughtError;

            try {
                response = await List.dataSetsMatchingPattern(REAL_SESSION, [dsname],
                    { excludePatterns: [dsname + ".LIKE"] });
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(format(ZosFilesMessages.dataSetsMatchedPattern.message, 1));
            expect(response.apiResponse.length).toBe(1);
            expect(response.apiResponse[0].dsname).toBe(dsname);
        });

        it("should fail when no data sets match", async () => {
            let response;
            let caughtError;

            try {
                response = await List.dataSetsMatchingPattern(REAL_SESSION, [dsname + ".INVAL"]);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).not.toBeDefined();
            expect(response).toBeDefined();
            expect(response.commandResponse).toContain("There are no data sets that match");
        });
    });
});