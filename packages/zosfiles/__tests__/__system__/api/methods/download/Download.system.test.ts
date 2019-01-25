/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import {
    Create,
    CreateDataSetTypeEnum,
    Delete,
    Download,
    IDownloadOptions,
    IZosFilesResponse,
    ZosFilesConstants,
    ZosFilesMessages
} from "../../../../../";
import { Imperative, Session } from "@brightside/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { getUniqueDatasetName, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { ZosmfRestClient } from "../../../../../../rest";
import { readFileSync } from "fs";

const rimraf = require("rimraf").sync;

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
let file: string;

describe("Download Data Set", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_file_download"
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

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
        Imperative.console.info("Using dsname:" + dsname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Success Scenarios", () => {

        describe("Physical sequential data set", () => {

            beforeEach(async () => {
                let error;
                let response;

                try {
                    response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                try {
                    response = await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                // delete the top-level folder and the folders and file below
                // variable 'file' should be set in the test
                const folders = file.split("/");
                const rc = rimraf(folders[0]);
            });

            it("should download a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".txt";
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {
                    binary: true
                };

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".txt";
            });

            it("should download a data set that has been populated by upload and use file extension specified", async () => {
                let error;
                let response: IZosFilesResponse;

                const options: IDownloadOptions = {
                    extension: "dat",
                };

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + ".dat";
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}`).toString());
                expect(fileContents).toEqual(data);
            });
        });

        describe("Partitioned data set - all members", () => {

            beforeEach(async () => {
                let error;
                let response;

                try {
                    response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                try {
                    response = await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                // delete the top-level folder and the folders and file below
                const folders = file.split("/");
                const rc = rimraf(folders[0]);
            });

            it("should download a data set", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file
                const regex = /\./gi;
                file = dsname.replace(regex, "/");
                // Compare the downloaded contents to those uploaded
                const fileContents = stripNewLines(readFileSync(`${file}/member.txt`).toString());
                expect(fileContents).toEqual(data);
            });

            it("should download a data set in binary mode", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                const options: IDownloadOptions = {
                    binary: true
                };

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/member.txt";
            });

            it("should download a data set and use file extension specified", async () => {
                let error;
                let response: IZosFilesResponse;

                // TODO - convert to UPLOAD APIs when available
                // upload data to the newly created data set
                const data: string = "abcdefghijklmnopqrstuvwxyz";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname + "(member)";
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                const options: IDownloadOptions = {
                    extension: "dat",
                };

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname, options);
                    Imperative.console.info("Response: " + inspect(response));
                } catch (err) {
                    error = err;
                    Imperative.console.info("Error: " + inspect(error));
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response.success).toBeTruthy();
                expect(response.commandResponse).toContain(
                    ZosFilesMessages.datasetDownloadedSuccessfully.message.substring(0, "Data set downloaded successfully".length + 1));

                // convert the data set name to use as a path/file for clean up in AfterEach
                const regex = /\./gi;
                file = dsname.replace(regex, "/") + "/member.dat";
            });
        });
        describe("Data sets matching - all data sets", () => {

            beforeEach(async () => {
                let error;
                let response;

                try {
                    response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                try {
                    response = await Delete.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                // delete the top-level folder and the folders and file below
                const folders = file.split("/");
                const rc = rimraf(folders[0]);
            });
        });
    });

    describe("Failure Scenarios", () => {

        describe("Physical sequential data set", () => {

            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.dataSet(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display proper message when downloading a data set that does not exists", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Data set not found.");
            });
        });

        describe("Partitioned data set - all members", () => {
            it("should display proper error message when missing session", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.allMembers(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Expect Error: Required object must be defined");
            });

            it("should display a relevant message when downloading data set members and the data set does not exist", async () => {
                let response: IZosFilesResponse;
                let error;

                try {
                    response = await Download.allMembers(REAL_SESSION, dsname + ".d");
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Data set not cataloged");
            });
        });

    });
});

