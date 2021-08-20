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

import { ITestEnvironment } from "./../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "./../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "./../../../../../../__tests__/__src__/TestUtils";
import { ICommandResponse } from "@zowe/imperative";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

// Pulled from test properties file
let account: string;
let systemProps: ITestPropertiesSchema;
let jclMember: string;
let psJclDataSet: string;

describe("zos-jobs view job-status-by-jobid command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_jobs_view_job_status_by_jobid_command"
        });

        systemProps = TEST_ENVIRONMENT.systemTestProperties;

        account = systemProps.tso.account;
        jclMember = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        psJclDataSet = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14PSDataSet;
    });

    afterAll(async () => {
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
            const viewJson: ICommandResponse = JSON.parse(response.stdout.toString());
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
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
            let DEFAULT_SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_view_job_status_by_jobid_command_without_profiles"
                });

                DEFAULT_SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
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
                        DEFAULT_SYSTEM_PROPS.zosmf.password                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("jobname:");
                expect(response.stdout.toString()).toContain("jobid:");
                expect(response.stdout.toString()).toContain("status:");
                expect(response.stdout.toString()).toContain("retcode:");
            });
        });
    });

    describe("error handling", () => {
        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/jobid_doesnt_exist.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("Obtaining job info for a single job id J0 on");
            expect(response.stderr.toString()).toContain("failed: Job not found");
        });
    });
});
