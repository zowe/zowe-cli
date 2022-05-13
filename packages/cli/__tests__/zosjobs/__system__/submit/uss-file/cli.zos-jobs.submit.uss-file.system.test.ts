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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Session } from "@zowe/imperative";

process.env.FORCE_COLOR = "0";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

let account: string;
let jclMember: string;
let ussFile: string;
let REAL_SESSION: Session;
describe("zos-jobs submit uss-file command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_submit_command",
            tempProfileTypes: ["zosmf"]
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        account = TEST_ENVIRONMENT.systemTestProperties.tso.account;
        ussFile = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14USSFile;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Live system tests", () => {
        it("should submit a job in an existing valid uss file", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_uss_file.sh",
                TEST_ENVIRONMENT, [ussFile]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
        });

        it("should submit a job and wait for it to reach output status", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_uss_file_wait.sh",
                TEST_ENVIRONMENT, [ussFile]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("retcode");
            expect(response.stdout.toString()).toContain("CC 0000");
            expect(response.stdout.toString()).not.toContain("null"); // retcode should not be null
        });

        it("should submit a job in an existing valid uss file with 'view-all-spool-content' option", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_uss_file_with_vasc.sh",
                TEST_ENVIRONMENT, [ussFile, "--vasc"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Spool file");
            expect(response.stdout.toString()).toContain("JES2");
        });

        it("should submit a job in an existing valid uss file with 'directory' option", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_uss_file_with_directory.sh",
                TEST_ENVIRONMENT, [ussFile, "--directory", "./"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
            expect(response.stdout.toString()).toContain("Successfully downloaded output to ./");
            expect(new RegExp("JOB\\d{5}", "g").test(response.stdout.toString())).toBe(true);
        });

        it("should submit a job in an existing valid uss file (using aliases)", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_valid_uss_file_alias.sh",
                TEST_ENVIRONMENT, [ussFile]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname");
            expect(response.stdout.toString()).toContain("jobid");
        });

        it("should fail if the uss file does not exist", async () => {
            const response = runCliScript(__dirname + "/__scripts__/submit_invalid_uss_file.sh",
                TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stderr.toString().toLowerCase()).toContain("opening");
            expect(response.stderr.toString().toLowerCase()).toContain("input");
            expect(response.stderr.toString().toLowerCase()).toContain("file");
            expect(response.stderr.toString().toLowerCase()).toContain("does/not/exist/at/all");
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
            let SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_submit_uss_file_without_profiles"
                });

                SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should submit a job in an existing valid uss file", async () => {
                const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                // if API Mediation layer is being used (basePath has a value) then
                // set an ENVIRONMENT variable to be used by zowe.
                if (SYSTEM_PROPS.zosmf.basePath != null) {
                    TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = SYSTEM_PROPS.zosmf.basePath;
                }

                const response = runCliScript(__dirname + "/__scripts__/submit_valid_uss_file_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosjobs.iefbr14USSFile,
                        SYSTEM_PROPS.zosmf.host,
                        SYSTEM_PROPS.zosmf.port,
                        SYSTEM_PROPS.zosmf.user,
                        SYSTEM_PROPS.zosmf.password,
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("jobname");
                expect(response.stdout.toString()).toContain("jobid");
            });
        });
    });
});
