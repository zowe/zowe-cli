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
    Get,
    IGetOptions,
    ZosFilesConstants,
} from "../../../../../";
import { Imperative, Session } from "@brightside/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { getUniqueDatasetName, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { ZosmfRestClient } from "../../../../../../rest";
import { ZosmfHeaders } from "../../../../../../rest/src/ZosmfHeaders";


let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
let ussname: string;

describe("Get", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_file_view"
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

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.VIEW`);
        Imperative.console.info("Using dsname:" + dsname);

        // using unique DS function to generate unique USS file name
        ussname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
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
            });

            it("should get data set content", async () => {
                let error;
                let response: string;

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response).toEqual(data);
            });

            it("should get data set content in binary mode", async () => {
                let error;
                let response: string;

                const options: IGetOptions = {
                    binary: true
                };

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dsname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [ZosmfHeaders.X_IBM_BINARY], data);

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response).toContain(data);
            });
        });
        describe("USS File", () => {
            beforeEach(async () => {
                let response;
                let error;
                const data = "{\"type\":\"file\",\"mode\":\"RWXRW-RW-\"}";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

                try {
                    response = await ZosmfRestClient.postExpectString(REAL_SESSION, endpoint, [], data);
                } catch (err) {
                    error = err;
                }
            });

            afterEach(async () => {
                let error;
                let response;

                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

                try {
                    response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint);
                } catch (err) {
                    error = err;
                }
            });

            it("should get uss file content", async () => {
                let error;
                let response: string;

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response).toEqual(data);
            });

            it("should get uss file content in binary", async () => {
                let error;
                let response: string;

                const options: IGetOptions = {
                    binary: true
                };

                const data: string = "abcdefghijklmnopqrstuvwxyz\n";
                const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
                const rc = await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [ZosmfHeaders.X_IBM_BINARY], data);

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname, options);
                } catch (err) {
                    error = err;
                }
                expect(error).toBeFalsy();
                expect(response).toBeTruthy();
                expect(response).toEqual(data);
            });
        });
    });

    describe("Failure Scenarios", () => {

        describe("Physical sequential data set", () => {

            it("should display a proper error message when missing the session", async () => {
                let response: string;
                let error;

                try {
                    response = await Get.dataSet(undefined, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display a proper message when getting the content of a data set that does not exists", async () => {
                let response: string;
                let error;

                try {
                    response = await Get.dataSet(REAL_SESSION, dsname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("Data set not found.");
            });
        });

        describe("USS File", () => {

            it("should display a proper error message when missing the session", async () => {
                let response: string;
                let error;

                try {
                    response = await Get.USSFile(undefined, ussname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(error.message).toContain("Expect Error: Required object must be defined");
            });

            it("should display a proper message when getting the content of a data set that does not exists", async () => {
                let response: string;
                let error;

                try {
                    response = await Get.USSFile(REAL_SESSION, ussname);
                } catch (err) {
                    error = err;
                }

                expect(response).toBeFalsy();
                expect(error).toBeTruthy();
                expect(stripNewLines(error.message)).toContain("File not found.");
            });
        });
    });
});
