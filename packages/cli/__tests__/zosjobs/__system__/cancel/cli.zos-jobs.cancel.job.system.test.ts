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
import { JobTestsUtils } from "../../../../../zosjobs/__tests__/__system__/JobTestsUtils";
import { IO } from "@zowe/imperative";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
const LOCAL_JCL_FILE: string = __dirname + "/" + "testFileOfLocalJCL.txt";
const jobDataRegexV1 = /Successfully submitted request to cancel job (\w+) \((JOB\d+)\)/;
const jobDataRegex = /Successfully canceled job (\w+) \((JOB\d+)\)/;
const modifyVersionDefaultUsesCIM = false;

describe("zos-jobs cancel job command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_cancel_job_command",
            tempProfileTypes: ["zosmf"]
        });
        const systemProps = TEST_ENVIRONMENT.systemTestProperties;

        const jcl = JobTestsUtils.getSleepJCL(systemProps.zosmf.user, systemProps.tso.account, systemProps.zosjobs.jobclass);
        const bufferJCL: Buffer = Buffer.from(jcl);
        IO.createFileSync(LOCAL_JCL_FILE);
        IO.writeFile(LOCAL_JCL_FILE, bufferJCL);
        TEST_ENVIRONMENT.resources.localFiles.push(LOCAL_JCL_FILE);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("error handling", () => {

        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/not_found.sh", TEST_ENVIRONMENT);

            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toContain("Cannot obtain job info for job id = JOB00000");
            expect(response.stderr.toString()).toContain("Zero jobs were returned");
        });

        it("should surface an error from z/OSMF if the jobid was already canceled", () => {
            let response = runCliScript(__dirname + "/__scripts__/job/submit_job.sh", TEST_ENVIRONMENT, [LOCAL_JCL_FILE]);
            const jobidRegex = /Submitted job ID: (JOB\d+)/;
            let jobid = response.stdout.toString().match(jobidRegex).pop();
            TEST_ENVIRONMENT.resources.jobs.push(jobid);

            response = runCliScript(__dirname + "/__scripts__/job/cancel_job_v2_bad.sh", TEST_ENVIRONMENT, [LOCAL_JCL_FILE]);
            jobid = response.stdout.toString().match(jobDataRegex).pop();
            TEST_ENVIRONMENT.resources.jobs.push(jobid);

            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Failed to cancel job");
            expect(response.stderr.toString()).toContain("Job not cancellable or purgeable");
            expect(response.stderr.toString()).toContain("returned on second cancel");
            expect(response.stdout.toString()).toContain("Successfully canceled job");
        });
    });

    describe("successful scenario", () => {
        it("should cancel a job v1", () => {
            if (TEST_ENVIRONMENT.systemTestProperties.zosjobs.skipCIM) {
                process.stdout.write("Skipping test because skipCIM is set.");
            } else {
                const response = runCliScript(__dirname + "/__scripts__/job/cancel_job_v1.sh", TEST_ENVIRONMENT, [LOCAL_JCL_FILE]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Successfully submitted request to cancel job");

                const jobid = response.stdout.toString().match(jobDataRegexV1).pop();
                TEST_ENVIRONMENT.resources.jobs.push(jobid);
            }
        });

        it("should cancel a job v2", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/cancel_job_v2.sh", TEST_ENVIRONMENT, [LOCAL_JCL_FILE]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Successfully canceled job");
            expect(response.stdout.toString()).not.toContain("Failed to cancel job");

            const jobid = response.stdout.toString().match(jobDataRegex).pop();
            TEST_ENVIRONMENT.resources.jobs.push(jobid);
        });

        it("should cancel a job default", () => {
            if (TEST_ENVIRONMENT.systemTestProperties.zosjobs.skipCIM && modifyVersionDefaultUsesCIM) {
                process.stdout.write("Skipping test because skipCIM is set.");
            } else {
                const response = runCliScript(__dirname + "/__scripts__/job/cancel_job.sh", TEST_ENVIRONMENT, [LOCAL_JCL_FILE]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Successfully canceled job");
                expect(response.stdout.toString()).not.toContain("Failed to cancel job");
                expect(response.stdout.toString()).not.toContain("Failed to cancel job");

                const jobid = response.stdout.toString().match(jobDataRegex).pop();
                TEST_ENVIRONMENT.resources.jobs.push(jobid);
            }
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
            let DEFAULT_SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_cancel_job_without_profiles"
                });

                DEFAULT_SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("cancel a job without a profile 1.0", async () => {
                if (TEST_ENVIRONMENT.systemTestProperties.zosjobs.skipCIM) {
                    process.stdout.write("Skipping test because skipCIM is set.");
                } else {
                    const response = runCliScript(__dirname + "/__scripts__/job/cancel_job_v1_fully_qualified.sh",
                        TEST_ENVIRONMENT_NO_PROF,
                        [
                            LOCAL_JCL_FILE,
                            DEFAULT_SYSTEM_PROPS.zosmf.host,
                            DEFAULT_SYSTEM_PROPS.zosmf.port,
                            DEFAULT_SYSTEM_PROPS.zosmf.user,
                            DEFAULT_SYSTEM_PROPS.zosmf.password,
                        ]);
                    expect(response.stderr.toString()).toBe("");
                    expect(response.status).toBe(0);
                    expect(response.stdout.toString()).toContain("Successfully submitted request to cancel job");

                    const jobid = response.stdout.toString().match(jobDataRegexV1).pop();
                    TEST_ENVIRONMENT_NO_PROF.resources.jobs.push(jobid);
                }
            });

            it("cancel a job without a profile 2.0", async () => {
                const response = runCliScript(__dirname + "/__scripts__/job/cancel_job_v2_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        LOCAL_JCL_FILE,
                        DEFAULT_SYSTEM_PROPS.zosmf.host,
                        DEFAULT_SYSTEM_PROPS.zosmf.port,
                        DEFAULT_SYSTEM_PROPS.zosmf.user,
                        DEFAULT_SYSTEM_PROPS.zosmf.password,
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Successfully canceled job");

                const jobid = response.stdout.toString().match(jobDataRegex).pop();
                TEST_ENVIRONMENT_NO_PROF.resources.jobs.push(jobid);
            });

            it("cancel a job without a profile default", async () => {
                if (TEST_ENVIRONMENT.systemTestProperties.zosjobs.skipCIM && modifyVersionDefaultUsesCIM) {
                    process.stdout.write("Skipping test because skipCIM is set.");
                } else {
                    const response = runCliScript(__dirname + "/__scripts__/job/cancel_job_fully_qualified.sh",
                        TEST_ENVIRONMENT_NO_PROF,
                        [
                            LOCAL_JCL_FILE,
                            DEFAULT_SYSTEM_PROPS.zosmf.host,
                            DEFAULT_SYSTEM_PROPS.zosmf.port,
                            DEFAULT_SYSTEM_PROPS.zosmf.user,
                            DEFAULT_SYSTEM_PROPS.zosmf.password,
                        ]);
                    expect(response.stderr.toString()).toBe("");
                    expect(response.status).toBe(0);
                    expect(response.stdout.toString()).toContain("Successfully canceled job");

                    const jobid = response.stdout.toString().match(jobDataRegex).pop();
                    TEST_ENVIRONMENT_NO_PROF.resources.jobs.push(jobid);
                }
            });
        });
    });
});
