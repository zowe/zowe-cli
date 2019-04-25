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

import { Create, Delete, ZosFilesMessages } from "../../../../../";
import { Imperative, Session } from "@brightside/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let ussname: string;
let filename: string;

describe("Delete a USS File", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_file_delete"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ussname = `${defaultSystem.zosmf.user.trim()}`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            let response;
            filename = `${defaultSystem.unix.testdir}/${ussname}.aTestUssFileSingle`.replace(/\./g, "");
            try {
                response = await Create.uss(REAL_SESSION, filename, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a uss file", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, filename);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.ussFileDeletedSuccessfully.message);
        });

        it("should delete a uss file", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, "//"+filename);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.ussFileDeletedSuccessfully.message);
        });
    });

    describe("Failure scenarios", () => {
        it("should display proper error message when called with invalid file name", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, undefined);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should display proper error message when try to delete non existing file", async () => {
            let error;
            let response;
            const nonExistFile = `${defaultSystem.zosmf.user.trim().toUpperCase()}aNonExistUssFile`;

            try {
                response = await Delete.ussFile(REAL_SESSION, nonExistFile);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain("No such file or directory");
        });
    });

});

describe("Delete USS Directory", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_directory_delete"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        filename = `${defaultSystem.unix.testdir}/${ussname}.aTestUssFolderDelete`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            let response;
            try {
                response = await Create.uss(REAL_SESSION, filename, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a uss directory", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, filename);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.ussFileDeletedSuccessfully.message);
        });
    });

    describe("Failure scenarios", () => {
        beforeAll(async () => {
            let error;
            let response;
            // ussname = ussname.replace(/\./g, "");
            filename = `${defaultSystem.unix.testdir}/${ussname}`;
            try {
                response = await Create.uss(REAL_SESSION, filename, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });
        afterAll(async () => {
            await TestEnvironment.cleanUp(testEnvironment);
        });
        it("should display proper error message when called with invalid directory name", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, undefined);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should display proper error message when try to delete non existing directory", async () => {
            let error;
            let response;
            const nonExistFile = `${defaultSystem.zosmf.user.trim().toUpperCase()}aNonExistUssDirectory`;

            try {
                response = await Delete.ussFile(REAL_SESSION, nonExistFile);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain("No such file or directory");
        });
    });
});

describe("Delete USS Directory with children", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_directory_delete_recursive"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        filename = `${defaultSystem.unix.testdir}/${ussname}.aTestUssFileDelete`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            let response;
            try {
                response = await Create.uss(REAL_SESSION, filename, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            try {
                response = await Create.uss(REAL_SESSION, `${filename}/aChild.txt`, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should be possible to delete a uss directory with children and recursion settings", async () => {
            let error;
            let response;
            try {
                response = await Delete.ussFile(REAL_SESSION, filename, true);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.ussFileDeletedSuccessfully.message);
        });
    });

    describe("Fail scenarios", () => {
        beforeEach(async () => {
            let error;
            let response;
            try {
                response = await Create.uss(REAL_SESSION, filename, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            try {
                response = await Create.uss(REAL_SESSION, `${filename}/aChild.txt`, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        afterEach(async () => {
            try {
                await Delete.ussFile(REAL_SESSION, ussname, true);
            } catch (err) {
                Imperative.console.info("Error: " + inspect(err));
            }
        });

        it("should not be possible to delete a uss directory with children and no recursion set", async () => {
            let error;
            let response;
            try {
                response = await Delete.ussFile(REAL_SESSION, filename);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain("Directory not empty.");
        });

        it("should not be possible to delete a uss directory with children, recursion set to false", async () => {
            let error;
            let response;
            try {
                response = await Delete.ussFile(REAL_SESSION, filename, false);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain("Directory not empty.");
        });
    });
});
