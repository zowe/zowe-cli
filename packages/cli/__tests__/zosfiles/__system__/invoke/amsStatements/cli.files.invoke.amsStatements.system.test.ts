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

import { Session } from "@zowe/core-for-zowe-sdk";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { ZosFilesMessages } from "@zowe/zos-files-for-zowe-sdk";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let user: string;
let volume: string;

describe("Invoke AMS CLI", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_invoke_ams"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        volume = defaultSystem.datasets.vol;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_invoke_ams_statement_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;

            user = defaultSys.zosmf.user.trim().toUpperCase();
            volume = defaultSys.datasets.vol;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should invoke ams to create and then delete a VSAM cluster using control statements", async () => {

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [user,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password,
                    defaultSystem.datasets.vol]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            let testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_delete_statement_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [user,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);
        });
    });

    describe("Success scenarios", () => {

        it("should invoke ams to create and then delete a VSAM cluster using control statements", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [user, defaultSystem.datasets.vol]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            let testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_delete_statement.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);
        });

        it("should invoke ams to create and then delete a VSAM cluster with response timeout", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [user, defaultSystem.datasets.vol, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            let testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_delete_statement.sh",
                TEST_ENVIRONMENT, [user, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);
        });

        it("should invoke ams to create and then delete a VSAM cluster using a control statement and print attributes", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement_rfj.sh",
                TEST_ENVIRONMENT, [user, defaultSystem.datasets.vol]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            let testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

            response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_delete_statement_rfj.sh",
                TEST_ENVIRONMENT, [user]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);
        });
    });

});
