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
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Session } from "@zowe/imperative";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let IEFBR14_JOB: string;
let REAL_SESSION: Session;
let ACCOUNT: string;
let JOB_NAME: string;
let NON_HELD_JOBCLASS: string;
let SEARCH_STRING: string;
let REGEX_STRING: string;

describe("zos-jobs search job command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_search_job_command",
            tempProfileTypes: ["zosmf"]
        });

        IEFBR14_JOB = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        const defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        ACCOUNT = defaultSystem.tso.account;
        const JOB_LENGTH = 6;
        JOB_NAME = REAL_SESSION.ISession.user.substring(0, JOB_LENGTH).toUpperCase() + "SF";
        NON_HELD_JOBCLASS = TEST_ENVIRONMENT.systemTestProperties.zosjobs.jobclass;
        SEARCH_STRING = "PGM=IEFBR14";
        REGEX_STRING = "IEFBR14|RC=0000";
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("response", () => {
        it("should be able to search for a string in every spool file for a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/search_string_spool_content.sh",
                TEST_ENVIRONMENT, [IEFBR14_JOB, JOB_NAME, SEARCH_STRING]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(SEARCH_STRING);
        });

        it("should be able to search for a regex in every spool file for a job", () => {
            const argString = "--search-regex \"" + REGEX_STRING + "\"";
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                TEST_ENVIRONMENT, [JOB_NAME, argString]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("IEFBR14");
            expect(response.stdout.toString()).toContain("RC=0000");
        });

        it("should fail if no parameters are passed", () => {       
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                TEST_ENVIRONMENT, [JOB_NAME, ""]);
            expect(response.stderr.toString()).toContain("You must specify either the `--search-string` or `--search-regex` option");
            expect(response.status).toBe(1);
        });

        it("should fail if --search-string and --search-regex parameters are passed", () => {
            const argString = "--search-regex \"" + REGEX_STRING +"\" --search-string \"" + SEARCH_STRING + "\"";
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                TEST_ENVIRONMENT, [JOB_NAME, argString]);
            expect(response.stderr.toString()).toContain("You must specify either the `--search-string` or `--search-regex` option");
            expect(response.status).toBe(1);
        });

        it("should limit the search when the --search-limit and --file-limit options are specified", () => {
            const argString = "--search-string \"" + SEARCH_STRING + "\" --search-limit 5 --file-limit 3";
            const response = runCliScript(__dirname + "/__scripts__/job/search_no_job_submit.sh",
                TEST_ENVIRONMENT, [JOB_NAME, argString]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(SEARCH_STRING);
        });
    });
});
