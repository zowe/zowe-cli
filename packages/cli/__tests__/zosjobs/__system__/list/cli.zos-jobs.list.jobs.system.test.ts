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
import { AbstractSession } from "@zowe/imperative";
import { IJob, GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let IEFBR14_JOB: string;
let REAL_SESSION: AbstractSession;
let ACCOUNT: string;
let JOB_NAME: string;
let NON_HELD_JOBCLASS;

// Long test timeout
const LONG_TIMEOUT = 100000;

const trimMessage = (message: string) => {
    // don't use more than one space or tab when checking error details
    // this allows us to expect things like "reason: 6" regardless of how prettyjson aligns the text
    return message.replace(/( {2,})|\t/g, " ");
};

describe("zos-jobs list jobs command", () => {
    const scriptDir = __dirname + "/__scripts__/list-jobs/";
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_list_jobs_command",
            tempProfileTypes: ["zosmf"]
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        TEST_ENVIRONMENT.resources.session = REAL_SESSION;
        const systemProps = TEST_ENVIRONMENT.systemTestProperties;
        IEFBR14_JOB = systemProps.zosjobs.iefbr14Member;

        ACCOUNT = systemProps.tso.account;
        const JOB_LENGTH = 6;
        JOB_NAME = REAL_SESSION.ISession.user.substring(0, JOB_LENGTH).toUpperCase() + "SF";
        NON_HELD_JOBCLASS = TEST_ENVIRONMENT.systemTestProperties.zosjobs.jobclass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("positive tests", () => {

        it("should be able to submit two jobs and then find both in the output", async () => {
            const response = runCliScript(scriptDir + "/submit_and_list_jobs.sh", TEST_ENVIRONMENT,
                [TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member]);

            // Regex to extract both JOBIDs
            const jobidRegex = /(?:First|Second) job ID (JOB\d+) found/g;

            // Extract all matching job IDs
            const jobIds = [...response.stdout.toString().matchAll(jobidRegex)].map(match => match[1]);

            // Ensure both job IDs were captured correctly
            expect(jobIds.length).toBe(2);
            const [job1Id, job2Id] = jobIds;

            // Retrieve job details using the Zowe SDK
            const job1: IJob = await GetJobs.getJob(REAL_SESSION, job1Id);
            const job2: IJob = await GetJobs.getJob(REAL_SESSION, job2Id);

            expect(job1 && job2).toBeDefined();
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("found");

            TEST_ENVIRONMENT.resources.jobs.push(job1, job2);
        });

        it("should be able to submit one job and then not see the job if we list jobs for a different user", async () => {
            // note: this test could fail if your user Id starts with "FAKE"
            const response = runCliScript(scriptDir + "/submit_and_list_jobs_no_match.sh", TEST_ENVIRONMENT,
                [TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member]);

            // Regex to extract the JOBID
            const jobidRegex = /Submitted job: (JOB\d+)/;
            const match = response.stdout.toString().match(jobidRegex);
            const jobId = match ? match[1] : null;

            expect(jobId).not.toBeNull();

            // Retrieve job details using the Zowe SDK
            const job: IJob = await GetJobs.getJob(REAL_SESSION, jobId);
            expect(job).toBeDefined();

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("test passed");

            TEST_ENVIRONMENT.resources.jobs.push(job);
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
            let SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_list_job_without_profiles"
                });
                REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT_NO_PROF);
                TEST_ENVIRONMENT_NO_PROF.resources.session = REAL_SESSION;
                SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should be able to submit two jobs and then find both in the output", async () => {
                const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                // if API Mediation layer is being used (basePath has a value) then
                // set an ENVIRONMENT variable to be used by zowe.
                if (SYSTEM_PROPS.zosmf.basePath != null) {
                    TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = SYSTEM_PROPS.zosmf.basePath;
                }

                const response = runCliScript(scriptDir + "/submit_and_list_jobs_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosjobs.iefbr14Member,
                        SYSTEM_PROPS.zosmf.host,
                        SYSTEM_PROPS.zosmf.port,
                        SYSTEM_PROPS.zosmf.user,
                        SYSTEM_PROPS.zosmf.password,
                    ]);

                // Regex to extract both JOBIDs
                const jobidRegex = /(?:First|Second) job ID (JOB\d+) found/g;

                // Extract all matching job IDs
                const jobIds = [...response.stdout.toString().matchAll(jobidRegex)].map(match => match[1]);

                // Ensure both job IDs were captured correctly
                expect(jobIds.length).toBe(2);
                const [job1Id, job2Id] = jobIds;

                // Retrieve job details using the Zowe SDK
                const job1: IJob = await GetJobs.getJob(REAL_SESSION, job1Id);
                const job2: IJob = await GetJobs.getJob(REAL_SESSION, job2Id);

                expect(job1 && job2).toBeDefined();
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("found");

                TEST_ENVIRONMENT_NO_PROF.resources.jobs.push(job1, job2);
            });
        });
    });

    describe("error handling", () => {
        it("should present an error message if the prefix is too long", () => {
            const response = runCliScript(scriptDir + "prefix_too_long.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toContain("prefix query parameter");
            expect(response.status).toBe(1);
        });

        it("should present an error message if the owner is too long", () => {
            const response = runCliScript(scriptDir + "owner_too_long.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toContain("owner query parameter");
            expect(response.status).toBe(1);
        });
    });
});
