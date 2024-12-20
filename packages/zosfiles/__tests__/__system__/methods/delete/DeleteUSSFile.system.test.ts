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

import { Create, Delete, ZosFilesMessages } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let ussname: string;

describe("Delete a USS File", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_file_delete"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ussname = `${defaultSystem.unix.testdir}/${defaultSystem.zosmf.user.trim()}.aTestUssFileSingle`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            try {
                await Create.uss(REAL_SESSION, ussname, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a uss file", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, ussname);
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

        it("should delete a uss file with response timeout", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, ussname, undefined, {responseTimeout: 5});
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

        it("should delete a uss file even if it has multiple slashes pre-pended", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, "//"+ussname);
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

describe("Delete a USS File - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_file_delete"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ussname = `${defaultSystem.unix.testdir}/${defaultSystem.zosmf.user.trim()}.Enco#ed.aTestUssFileSingle`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            try {
                await Create.uss(REAL_SESSION, ussname, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a uss file", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, ussname);
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

        it("should delete a uss file even if it has multiple slashes pre-pended", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, "//"+ussname);
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
});

describe("Delete USS Directory", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_directory_delete"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ussname = `${defaultSystem.unix.testdir}/${defaultSystem.zosmf.user.trim()}.aTestUssFolderDelete`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            try {
                await Create.uss(REAL_SESSION, ussname, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a uss directory", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, ussname);
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

describe("Delete USS Directory - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_directory_delete"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ussname = `${defaultSystem.unix.testdir}/${defaultSystem.zosmf.user.trim()}.Enco#ed.aTestUssFolderDelete`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            try {
                await Create.uss(REAL_SESSION, ussname, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a uss directory", async () => {
            let error;
            let response;

            try {
                response = await Delete.ussFile(REAL_SESSION, ussname);
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
});

describe("Delete USS Directory with children", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_directory_delete_recursive"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ussname = `${defaultSystem.unix.testdir}/${defaultSystem.zosmf.user.trim()}.aTestUssFileDelete`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            try {
                await Create.uss(REAL_SESSION, ussname, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            try {
                await Create.uss(REAL_SESSION, `${ussname}/aChild.txt`, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should be possible to delete a uss directory with children and recursion settings", async () => {
            let error;
            let response;
            try {
                response = await Delete.ussFile(REAL_SESSION, ussname, true);
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
            try {
                await Create.uss(REAL_SESSION, ussname, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            try {
                await Create.uss(REAL_SESSION, `${ussname}/aChild.txt`, "file");
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
                response = await Delete.ussFile(REAL_SESSION, ussname);
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
                response = await Delete.ussFile(REAL_SESSION, ussname, false);
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

describe("Delete USS Directory with children - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_uss_directory_delete_recursive"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ussname = `${defaultSystem.unix.testdir}/${defaultSystem.zosmf.user.trim()}.Enco#ed.aTestUssFileDelete`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            try {
                await Create.uss(REAL_SESSION, ussname, "directory");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            try {
                await Create.uss(REAL_SESSION, `${ussname}/aChild.txt`, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should be possible to delete a uss directory with children and recursion settings", async () => {
            let error;
            let response;
            try {
                response = await Delete.ussFile(REAL_SESSION, ussname, true);
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
});