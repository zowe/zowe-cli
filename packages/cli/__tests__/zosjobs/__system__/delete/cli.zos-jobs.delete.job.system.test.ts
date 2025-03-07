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

import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { runCliScript } from "@zowe/cli-test-utils";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let IEFBR14_JCL: string;
const modifyVersionDefaultUsesCIM = false;

describe("zos-jobs delete job command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_delete_job_command",
            tempProfileTypes: ["zosmf"]
        });
        IEFBR14_JCL = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
    });

    describe("error handling", () => {

        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/not_found.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toContain("Cannot obtain job info for job id = JOB00000");
            expect(response.stderr.toString()).toContain("Zero jobs were returned");
        });
    });

    describe("successful scenario", () => {
        it("should delete a job 1.0", () => {
            if (TEST_ENVIRONMENT.systemTestProperties.zosjobs.skipCIM) {
                process.stdout.write("Skipping test because skipCIM is set.");
            } else {
                const response = runCliScript(__dirname + "/__scripts__/job/delete_job_v1.sh",
                    TEST_ENVIRONMENT, [IEFBR14_JCL]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Successfully submitted request to delete job");
            }
        });

        it("should delete a job 2.0", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/delete_job_v2.sh",
                TEST_ENVIRONMENT, [IEFBR14_JCL]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Successfully deleted job");
        });

        it("should delete a job default", () => {
            if (TEST_ENVIRONMENT.systemTestProperties.zosjobs.skipCIM && modifyVersionDefaultUsesCIM) {
                process.stdout.write("Skipping test because skipCIM is set.");
            } else {
                const response = runCliScript(__dirname + "/__scripts__/job/delete_job.sh",
                    TEST_ENVIRONMENT, [IEFBR14_JCL]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Successfully deleted job");
            }
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
            let DEFAULT_SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_delete_job_without_profiles"
                });

                DEFAULT_SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("delete a job without a profile 1.0", async () => {
                if (TEST_ENVIRONMENT.systemTestProperties.zosjobs.skipCIM) {
                    process.stdout.write("Skipping test because skipCIM is set.");
                } else {
                    const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                    // if API Mediation layer is being used (basePath has a value) then
                    // set an ENVIRONMENT variable to be used by zowe.
                    if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                        TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = DEFAULT_SYSTEM_PROPS.zosmf.basePath;
                    }

                    const response = runCliScript(__dirname + "/__scripts__/job/delete_job_v1_fully_qualified.sh",
                        TEST_ENVIRONMENT_NO_PROF,
                        [
                            IEFBR14_JCL,
                            DEFAULT_SYSTEM_PROPS.zosmf.host,
                            DEFAULT_SYSTEM_PROPS.zosmf.port,
                            DEFAULT_SYSTEM_PROPS.zosmf.user,
                            DEFAULT_SYSTEM_PROPS.zosmf.password,
                        ]);
                    expect(response.stderr.toString()).toBe("");
                    expect(response.status).toBe(0);
                    expect(response.stdout.toString()).toContain("Successfully submitted request to delete job");
                }
            });

            it("delete a job without a profile 2.0", async () => {
                const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                // if API Mediation layer is being used (basePath has a value) then
                // set an ENVIRONMENT variable to be used by zowe.
                if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                    TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = DEFAULT_SYSTEM_PROPS.zosmf.basePath;
                }

                const response = runCliScript(__dirname + "/__scripts__/job/delete_job_v2_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        IEFBR14_JCL,
                        DEFAULT_SYSTEM_PROPS.zosmf.host,
                        DEFAULT_SYSTEM_PROPS.zosmf.port,
                        DEFAULT_SYSTEM_PROPS.zosmf.user,
                        DEFAULT_SYSTEM_PROPS.zosmf.password,
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Successfully deleted job");
            });

            it("delete a job without a profile default", async () => {
                if (TEST_ENVIRONMENT.systemTestProperties.zosjobs.skipCIM && modifyVersionDefaultUsesCIM) {
                    process.stdout.write("Skipping test because skipCIM is set.");
                } else {
                    const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                    // if API Mediation layer is being used (basePath has a value) then
                    // set an ENVIRONMENT variable to be used by zowe.
                    if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                        TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = DEFAULT_SYSTEM_PROPS.zosmf.basePath;
                    }

                    const response = runCliScript(__dirname + "/__scripts__/job/delete_job_fully_qualified.sh",
                        TEST_ENVIRONMENT_NO_PROF,
                        [
                            IEFBR14_JCL,
                            DEFAULT_SYSTEM_PROPS.zosmf.host,
                            DEFAULT_SYSTEM_PROPS.zosmf.port,
                            DEFAULT_SYSTEM_PROPS.zosmf.user,
                            DEFAULT_SYSTEM_PROPS.zosmf.password,
                        ]);
                    expect(response.stderr.toString()).toBe("");
                    expect(response.status).toBe(0);
                    expect(response.stdout.toString()).toContain("Successfully deleted job");
                }
            });
        });
    });
});
