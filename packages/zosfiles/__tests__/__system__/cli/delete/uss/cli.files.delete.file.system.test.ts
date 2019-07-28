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

import { Imperative, Session } from "@zowe/imperative";
import { Create } from "../../../../..";
import { inspect } from "util";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let ussname: string;
let user: string;

describe("Delete File", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_delete_uss_file"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        user = defaultSystem.zosmf.user.trim();
        ussname = `${defaultSystem.zosmf.user.trim()}.aTestUssFileDelete.txt`;
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Success scenario without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeEach(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_delete_uss_file_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            let error;
            let response;
            try {
                response = await Create.uss(REAL_SESSION, ussname, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should delete a uss file, with fully specified command", async () => {
            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_file_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF, [ussname, "--for-sure",
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Success scenarios", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeEach(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_delete_uss_file_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            let error;
            let response;

            try {
                response = await Create.uss(REAL_SESSION, ussname, "file");
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should delete a file", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_file.sh",
                TEST_ENVIRONMENT, [ussname, "--for-sure"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {
        it("should fail deleting a file that does not exist", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_file.sh",
                TEST_ENVIRONMENT, [ussname, "--for-sure"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("No such file or directory.");
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });
});
