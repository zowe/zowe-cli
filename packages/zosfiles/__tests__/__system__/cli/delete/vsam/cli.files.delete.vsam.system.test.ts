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

import { Session } from "@brightside/imperative";
import { getUniqueDatasetName, runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
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

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        user = defaultSystem.zosmf.user.toUpperCase();
        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.VSAM`);
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
                testName: "zos_files_delete_vsam_data_set_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should delete a data set", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set_fully_qualified.sh",
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

    describe("Help scenarios", () => {

        it("should display delete vsam help", async () => {
            const response = runCliScript(__dirname + "/__scripts__/delete_vsam_help.sh",
                TEST_ENVIRONMENT);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Success scenarios", () => {

        it("should delete a VSAM data set", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should delete a VSAM data set And print attributes", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should delete a VSAM data set that has a retention period", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_for_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname, "--for-sure", "--purge"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {

        it("should fail deleting a data set due to missing data set name", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("dataSetName");
            expect(response.stderr.toString()).toContain("Missing Positional");
        });

        it("should fail deleting a data set without specifying --for-sure", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [dsname]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("--for-sure");
            expect(response.stderr.toString()).toContain("Missing Required Option");
        });

        it("should fail deleting a data set that does not exist", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
                TEST_ENVIRONMENT, [user + ".DOES.NOT.EXIST", "--for-sure"]);
            expect(response.status).toBe(1);
            expect(stripNewLines(response.stderr.toString())).toContain(`ENTRY ${user}.DOES.NOT.EXIST NOT DELETED`);
        });

        it("should fail due to retention period not being exceeded", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_invoke_ams_define_for_statement.sh",
                TEST_ENVIRONMENT, [dsname, volume]);
            // delete without --purge should fail
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_vsam_data_set.sh",
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
