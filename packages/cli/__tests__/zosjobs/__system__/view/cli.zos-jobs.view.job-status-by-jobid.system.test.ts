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
import { ICommandResponse, Session } from "@zowe/imperative";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;

// Pulled from test properties file
let jclMember: string;
let JOB_NAME: string;

// Regex to match any job name that starts with "IEFBR14"
const jobNameRegex = /IEFBR14\w*/;

describe("zos-jobs view job-status-by-jobid command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_jobs_view_job_status_by_jobid_command"
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        jclMember = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
    });

    afterAll(async () => {
        if (JOB_NAME) {
            const jobs = await GetJobs.getJobsByPrefix(REAL_SESSION, JOB_NAME);
            TEST_ENVIRONMENT.resources.jobs.push(...jobs);
        }

        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("response", () => {
        it("should contain the jobid, jobname, cc, and status", () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/submit_and_view.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname:");
            expect(response.stdout.toString()).toContain("jobid:");
            expect(response.stdout.toString()).toContain("status:");
            expect(response.stdout.toString()).toContain("retcode:");

            // Set jobname for cleanup of all jobs
            const match = response.stdout.toString().match(jobNameRegex);
            JOB_NAME = match ? match[0] : null;
        });

        it("should be able to submit the job then view the job and the details should match", () => {

            // Submit the job and parse the response
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/submit_rfj.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const submitJson: ICommandResponse = JSON.parse(response.stdout.toString());
            expect(submitJson.success).toBe(true);

            // View the job
            const viewResponse = runCliScript(__dirname +
                "/__scripts__/job-status-by-jobid/view_rfj.sh", TEST_ENVIRONMENT, [submitJson.data.jobid]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const viewJson: ICommandResponse = JSON.parse(viewResponse.stdout.toString());
            expect(viewJson.success).toBe(true);
            expect(viewJson.data.jobid).toBe(submitJson.data.jobid);
            expect(viewJson.data.jobname).toBe(submitJson.data.jobname);
        });

        it("should contain the status of OUTPUT", () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/submit_and_wait_for_output.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("OUTPUT");
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
            let DEFAULT_SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_view_job_status_by_jobid_command_without_profiles"
                });
                REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
                DEFAULT_SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
                if (JOB_NAME) {
                    const jobs = await GetJobs.getJobsByPrefix(REAL_SESSION, JOB_NAME);
                    TEST_ENVIRONMENT_NO_PROF.resources.jobs.push(...jobs);
                }

                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should contain the jobid, jobname, cc, and status", async () => {
                const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                // if API Mediation layer is being used (basePath has a value) then
                // set an ENVIRONMENT variable to be used by zowe.
                if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                    TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = DEFAULT_SYSTEM_PROPS.zosmf.basePath;
                }

                const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/submit_and_view_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        jclMember,
                        DEFAULT_SYSTEM_PROPS.zosmf.host,
                        DEFAULT_SYSTEM_PROPS.zosmf.port,
                        DEFAULT_SYSTEM_PROPS.zosmf.user,
                        DEFAULT_SYSTEM_PROPS.zosmf.password,
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("jobname:");
                expect(response.stdout.toString()).toContain("jobid:");
                expect(response.stdout.toString()).toContain("status:");
                expect(response.stdout.toString()).toContain("retcode:");

                // Set jobname for cleanup of all jobs
                const match = response.stdout.toString().match(jobNameRegex);
                JOB_NAME = match ? match[0] : null;
            });
        });
    });

    describe("error handling", () => {
        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/jobid_doesnt_exist.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Cannot obtain job info for job id = J0");
            expect(response.stderr.toString()).toContain("Zero jobs were returned");
        });
    });
});
