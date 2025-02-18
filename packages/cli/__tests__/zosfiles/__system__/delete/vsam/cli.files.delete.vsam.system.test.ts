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

import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { runCliScript } from "@zowe/cli-test-utils";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let systemProps: ITestPropertiesSchema;
let dsname: string;
let volume: string;
let user: string;

describe("Delete VSAM Data Set", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_delete_vsam_data_set"
        });

        systemProps = TEST_ENVIRONMENT.systemTestProperties;


        user = systemProps.zosmf.user.toUpperCase();
        dsname = getUniqueDatasetName(`${user}.ZOSFILE.VSAM`);
        volume = systemProps.datasets.vol;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {


        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_delete_vsam_data_set_without_profile"
            });
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should delete a data set", async () => {
            runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (systemProps.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = systemProps.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF, [dsname, "--for-sure",
                    systemProps.zosmf.host,
                    systemProps.zosmf.port,
                    systemProps.zosmf.user,
                    systemProps.zosmf.password]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Success scenarios", () => {

        it("should delete a VSAM data set", async () => {
            runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should delete a VSAM data set with response timeout", async () => {
            runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should delete a VSAM data set And print attributes", async () => {
            runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should delete a VSAM data set that has a retention period", async () => {
            runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_for_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--purge"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should successfully delete a VSAM data set with --ignore-not-found flag", async () => {
            // create vsam
            const createResponse = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            expect(createResponse.status).toBe(0);

            // now delete
            const deleteResponse = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--ignore-not-found"]);
            expect(deleteResponse.stderr.toString()).toBe("");
            expect(deleteResponse.status).toBe(0);
            expect(deleteResponse.stdout.toString()).toMatchSnapshot();

            //repeat and ensure no error
            const repeatDelete = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--ignore-not-found"]);
            expect(repeatDelete.stderr.toString()).toBe("");
            expect(repeatDelete.status).toBe(0);
        });
    });

    describe("Expected failures", () => {
        it("should fail deleting a data set that does not exist", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [user + ".DOES.NOT.EXIST", "--for-sure"]);
            expect(response.status).toBe(1);
            expect(stripNewLines(response.stderr.toString())).toContain(`ENTRY ${user}.DOES.NOT.EXIST NOT DELETED`);
        });
        it("should fail deleting a non-existent data set without a --ignore-not-found flag", async () => {
            // Attempt to delete a non-existent VSAM dataset without the --ignore-not-found flag
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [user + ".DOES.NOT.EXIST", "--for-sure"]);

            // Check that stderr contains the expected error message about the dataset not being found
            expect(response.status).toBe(1);
            expect(stripNewLines(response.stderr.toString())).toContain(`ENTRY ${user}.DOES.NOT.EXIST NOT FOUND`);
        });

        it("should fail due to retention period not being exceeded", async () => {
            runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_for_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            // delete without --purge should fail
            let response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure"]);
            expect(response.status).toBe(1);
            expect(stripNewLines(response.stderr.toString())).toContain("IDC3023I UNEXPIRED PURGE DATE");
            // delete the VSAM data set with --purge
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--purge"]);
            expect(response.status).toBe(0);
        });
    });
});
