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

import { Session } from "@zowe/imperative";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let dsnameSuffix: string;
let user: string;

describe("Delete Data Set", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_delete_data_set"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        dsname = `${user}.TEST.DATA.SET`;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_delete_data_set_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should delete a data set", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_create_data_set.sh",
                TEST_ENVIRONMENT, [dsname]);

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            response = runCliScript(__dirname + "/__scripts__/command/command_delete_ds_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF, [dsname, "--for-sure",
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

        beforeEach(async () => {
            dsnameSuffix = "";  // reset
        });

        it("should delete a data set", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_create_data_set.sh",
                TEST_ENVIRONMENT, [dsname]);
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should delete a partitioned data set and print attributes", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_create_data_set.sh",
                TEST_ENVIRONMENT, [dsname]);
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should delete a partitioned data set member", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_create_data_set.sh",
                TEST_ENVIRONMENT, [dsname]);
            const dsnameWithMember = dsname + "(TESTMEM)";
            const fileLocation = __dirname + "/__scripts__/command/file.txt";
            response = runCliScript(__dirname + "/__scripts__/command/command_create_data_set_member.sh",
                TEST_ENVIRONMENT, [dsnameWithMember, fileLocation]);
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                TEST_ENVIRONMENT, [dsnameWithMember, "--for-sure", "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
            runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
            TEST_ENVIRONMENT, [dsname, "--for-sure", "--rfj"]);
        });
    });

    describe("Expected failures", () => {
        it("should fail deleting a data set that does not exist", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                TEST_ENVIRONMENT, [user + ".does.not.exist", "--for-sure"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Data set not cataloged ");
        });
    });
});
