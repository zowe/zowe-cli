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
import * as path from "path";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
const testString = "test";

describe("List all mounted filesystems", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "list_fs"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_list_data_set_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should list all mounted filesystems", async () => {
            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_list_fs_system.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password,
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            // expect(response.stdout.toString()).toContain(testString.toUpperCase());
        });
    });

    describe("Success scenarios", () => {

        it("should list all mounted filesystems", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_fs.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            // expect(response.stdout.toString()).toContain(testString.toUpperCase());
        });

        it("should list all mounted filesystems with response timeout", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_fs.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            // expect(response.stdout.toString()).toContain(testString.toUpperCase());
        });

        it("should list all mounted filesystems with response-format-json flag", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_fs.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            // expect(response.stdout.toString()).toContain(testString.toUpperCase());
        });
    });

    describe("Expected failures", () => {
        it("should fail due to path not existing", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_fs.sh");
            // Two leading slashes for path is required by some shells like Git Bash on Windows
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["-p //xxxx"]);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toEqual("");
            expect(response.stderr.toString()).toContain("HTTP(S) status 404");
        });

        it("should fail due to fsname not existing", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_list_fs.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["-f xxxx"]);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toEqual("");
            expect(response.stderr.toString()).toContain("HTTP(S) status 404");
        });
    });
});
