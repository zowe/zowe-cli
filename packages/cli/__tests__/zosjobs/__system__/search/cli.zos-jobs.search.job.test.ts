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
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils"
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { wait, waitTime } from "../../../../../../__tests__/__src__/TestUtils";
import { AbstractSession } from "@zowe/imperative";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";

// Test Environment populated in the beforeAll();
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let IEFBR14_JOB: string;
let REAL_SESSION: AbstractSession;
let ACCOUNT: string;
let JOB_NAME: string;
let NON_HELD_JOBCLASS: string;
let SEARCH_STRING: string;
let REGEX_STRING: string;
let BAD_SEARCH_STRING: string;
let defaultSystem: ITestPropertiesSchema;

describe("zos-jobs search job command", () => {
    beforeAll(async () => {
        // Initialize testEnvironment first!
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_jobs_search_job_command",
            tempProfileTypes: ["zosmf"]
        });
        REAL_SESSION = await TestEnvironment.createSession();
        // Use testEnvironment for accessing properties
        defaultSystem = testEnvironment.systemTestProperties;

        IEFBR14_JOB = defaultSystem.zosjobs.iefbr14Member;

        ACCOUNT = defaultSystem.tso.account;

        const JOB_LENGTH = 5; // 5 letters from the user's id
        const userIdPart = REAL_SESSION.ISession.user.substring(0, JOB_LENGTH).toUpperCase();
        JOB_NAME = `IEF${userIdPart}`;

        NON_HELD_JOBCLASS = defaultSystem.zosjobs.jobclass;
        SEARCH_STRING = `PGM=${JOB_NAME}`;
        REGEX_STRING = `${JOB_NAME}|RC=0000`;
        BAD_SEARCH_STRING = "bluhbluh";

    });

    afterAll(async () => {
        // Retrieve jobs by prefix
        const jobs = await GetJobs.getJobsByPrefix(REAL_SESSION, JOB_NAME);
        testEnvironment.resources.jobs = jobs;

        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Successful response", () => {
        it("should be able to search for a string in every spool file for a job", async () => {
            const response = runCliScript(__dirname + "/__scripts__/job/search_string_spool_content.sh",
                testEnvironment, [IEFBR14_JOB, JOB_NAME, SEARCH_STRING]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(SEARCH_STRING);
        });

        it("should be able to search for a regex in every spool file for a job", async () => {
            const argString = "--search-regex \"" + REGEX_STRING + "\"";
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                testEnvironment, [JOB_NAME, argString]);

            await wait(waitTime); // Waits for 2 seconds

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${JOB_NAME}`);
            expect(response.stdout.toString()).toContain("RC=0000");
        });

        it("should limit the search when the --search-limit and --file-limit options are specified",  async () => {
            const argString = "--search-string \"" + SEARCH_STRING + "\" --search-limit 5 --file-limit 3";
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                testEnvironment, [JOB_NAME, argString]);

            await wait(waitTime); // Waits for 2 seconds

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(SEARCH_STRING);
        });
    });

    describe("error handling", () => {  // Removed async from describe
        it("should return a status code of 1 if the string is not found", async () => {
            const argString = "--search-string \"" + BAD_SEARCH_STRING + "\"";
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                testEnvironment, [JOB_NAME, argString]);

            await wait(waitTime); // Waits for 2 seconds

            expect(response.stderr.toString()).toContain("The search spool job command returned a non-zero rc: 1");
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
        });

        it("should fail if no parameters are passed", async () => {
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                testEnvironment, [JOB_NAME, ""]);

            await wait(waitTime); // Waits for 2 seconds

            expect(response.stderr.toString()).toContain("You must specify either the `--search-string` or `--search-regex` option");
            expect(response.status).toBe(1);
        });

        it("should fail if --search-string and --search-regex parameters are passed", async () => {
            const argString = "--search-regex \"" + REGEX_STRING +"\" --search-string \"" + SEARCH_STRING + "\"";
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                testEnvironment, [JOB_NAME, argString]);

            await wait(waitTime); // Waits for 2 seconds

            expect(response.stderr.toString()).toContain("You must specify either the `--search-string` or `--search-regex` option");
            expect(response.status).toBe(1);
        });
    });
});
