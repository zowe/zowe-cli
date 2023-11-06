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

import { Imperative, Session } from "@zowe/core-for-zowe-sdk";
import * as path from "path";
import { inspect } from "util";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Delete, Create } from "@zowe/zos-files-for-zowe-sdk";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let user: string;
let ussname: string;
const testFile: string = "appendFile.txt";

describe("List directory", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "list_uss_files"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        user = defaultSystem.zosmf.user.trim();
        ussname = `${defaultSystem.zosmf.user.trim()}.aTestUssDirectory`;
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_list_directory_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        beforeEach(async () => {
            let error;
            let response;
            try {
                response = await Create.uss(REAL_SESSION, ussname, "directory");
                response = await Create.uss(REAL_SESSION, `${ussname}/${testFile}`, "directory");
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

        it("should list data set", async () => {

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_list_uss_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    ussname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password,
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testFile);
        });
    });

    describe("Success scenarios", () => {
        let error;
        let response;
        beforeEach(async () => {
            try {
                response = await Create.uss(REAL_SESSION, ussname, "directory");
                response = await Create.uss(REAL_SESSION, `${ussname}/appendFile.txt`, "directory");
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

        it("should list files", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_uss.sh");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testFile);
        });

        it("should list files with response timeout", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_uss.sh");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testFile);
        });

        it("should list directories with response-format-json flag", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_uss.sh");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testFile);
        });

        it("should fail with an invalid attribute attributes", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_uss.sh");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname, "-a", "--rfj"]);
            expect(response.stderr.toString()).toContain("Unknown argument");
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
        });

        it("should return directory list with only 1 entry", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_uss.sh");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname, "--max 1", "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(".");
            expect(response.stdout.toString()).toContain("\"returnedRows\": 1");
        });

        it("should return directory list with all files", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_uss.sh");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(testFile);
            expect(response.stdout.toString()).toContain("..");
            expect(response.stdout.toString()).toContain(".");
            expect(response.stdout.toString()).toContain("\"returnedRows\": 3");
        });

        it("should indicate that the uss does not exist", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_uss.sh");
            response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname + ".dummy"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Path name not found");
            expect(response.stdout.toString()).toEqual("");
        });
    });

});
