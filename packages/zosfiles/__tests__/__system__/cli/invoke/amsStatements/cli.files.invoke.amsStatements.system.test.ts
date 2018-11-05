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

import { Session } from "@brightside/imperative";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { ZosFilesMessages } from "../../../../../src/api/constants/ZosFiles.messages";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let user: string;
let volume: string;

describe("Invoke AMS CLI", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_invoke_ams"
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        volume = defaultSystem.datasets.list[0].vol;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let sysProps;
        let defaultSys: ITestSystemSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_invoke_ams_statement_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();

            user = defaultSys.zosmf.user.trim().toUpperCase();
            volume = defaultSys.datasets.list[0].vol;
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
                    defaultSys.zosmf.pass,
                    defaultSystem.datasets.list[0].vol]);
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
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            testOutput = stripNewLines(response.stdout.toString());
            expect(testOutput).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);
        });
    });

    describe("Success scenarios", () => {

        it("should display invoke and invoke ams help", async () => {
            const response = runCliScript(__dirname + "/__scripts__/invoke_ams_help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should invoke ams to create and then delete a VSAM cluster using control statements", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [user, defaultSystem.datasets.list[0].vol]);
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

        it("should invoke ams to create and then delete a VSAM cluster using a control statement and print attributes", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement_rfj.sh",
                TEST_ENVIRONMENT, [user, defaultSystem.datasets.list[0].vol]);
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

    describe("Expected failures", () => {

        it("should fail due to controlStatements not specified", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_missing_statement.sh", TEST_ENVIRONMENT);
            expect(stripNewLines(response.stderr.toString())).toContain("Syntax Error");
            expect(stripNewLines(response.stderr.toString())).toContain("Missing Positional");
            expect(stripNewLines(response.stderr.toString())).toContain("controlStatements");
        });
    });
});
