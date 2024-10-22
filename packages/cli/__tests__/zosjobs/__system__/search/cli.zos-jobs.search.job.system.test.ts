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

import { runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Session } from "@zowe/imperative";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { SubmitJobs } from "@zowe/zos-jobs-for-zowe-sdk";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;
let JOB_NAME: string;
const SEARCH_STRING = "PGM=IEFBR14";
const REGEX_STRING = "IEFBR14|RC=0000";
const BAD_SEARCH_STRING = "bluhbluh";

describe("zos-jobs search job command", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_search_job_command",
            tempProfileTypes: ["zosmf"]
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        const iefbr14Job = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;

        const job = await SubmitJobs.submitJob(REAL_SESSION, iefbr14Job);
        JOB_NAME = job.jobname;
        TEST_ENVIRONMENT.resources.jobs.push(job);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Successful response", () => {
        it("should be able to search for a string in every spool file for a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/search_job_string.sh",
                TEST_ENVIRONMENT, [JOB_NAME, SEARCH_STRING]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(SEARCH_STRING);
        });

        it("should be able to search for a regex in every spool file for a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/search_job_regex.sh",
                TEST_ENVIRONMENT, [JOB_NAME, REGEX_STRING]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("IEFBR14");
            expect(response.stdout.toString()).toContain("RC=0000");
        });

        it("should limit the search when the --search-limit and --file-limit options are specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/search_job_string.sh",
                TEST_ENVIRONMENT, [JOB_NAME, SEARCH_STRING, "--search-limit", "5", "--file-limit", "3"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(SEARCH_STRING);
        });
    });

    describe("error handling", () => {
        it("should return a status code of 1 if the string is not found", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/search_job_string.sh",
                TEST_ENVIRONMENT, [JOB_NAME, BAD_SEARCH_STRING]);
            expect(response.stderr.toString()).toContain("The search spool job command returned a non-zero rc: 1");
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
        });

        it("should fail if no parameters are passed", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/missing_search_string.sh",
                TEST_ENVIRONMENT, [JOB_NAME]);
            expect(response.stderr.toString()).toContain("You must specify either the `--search-string` or `--search-regex` option");
            expect(response.status).toBe(1);
        });

        it("should fail if --search-string and --search-regex parameters are passed", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/search_job_string.sh",
                TEST_ENVIRONMENT, [JOB_NAME, SEARCH_STRING, "--search-regex", REGEX_STRING]);
            expect(response.stderr.toString()).toContain("You must specify either the `--search-string` or `--search-regex` option");
            expect(response.status).toBe(1);
        });
    });
});
