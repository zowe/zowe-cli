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

import { ImperativeError, Session } from "@zowe/imperative";
import { DeleteJobs, GetJobs, IJob, SearchJobs } from "../../src";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/ITestEnvironment";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";

/**********************************************************************************/

// The job class for holding jobs on the input queue
// Session to use for the tests
let REAL_SESSION: Session;

// Invalid credentials session
let INVALID_SESSION: Session;
// The job name - should be the same for cleanup, etc.
const SIX_CHARS = 6;
let MONITOR_JOB_NAME: string;
const TEST_JOB_NAME = "TSTMB";

let defaultSystem: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;

// Utility function to cleanup
async function cleanTestJobs(prefix: string) {
    // The tests may submit jobs - we will clean every job that may have been left by failures, etc.
    const jobs: IJob[] = await GetJobs.getJobsCommon(REAL_SESSION, {owner: REAL_SESSION.ISession.user, prefix: prefix + "*"});
    if (jobs.length > 0) {
        for (const job of jobs) {
            try {
                await DeleteJobs.deleteJob(REAL_SESSION, job.jobname, job.jobid);
            } catch (e) {
                // Don't worry about it
            }
        }
    }
}

describe("Search Jobs - System Tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_search_jobs"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        INVALID_SESSION = new Session({
            user: "fakeuser",
            password: "fake",
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            basePath: defaultSystem.zosmf.basePath,
            type: "basic",
            rejectUnauthorized: false
        });
        MONITOR_JOB_NAME = REAL_SESSION.ISession.user?.toUpperCase().substring(0, SIX_CHARS) + "G";
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    // Cleanup before & after each test - this will ensure that hopefully no jobs are left outstanding (or are currently
    // outstanding) when the tests run
    beforeEach(async () => {
        await cleanTestJobs(MONITOR_JOB_NAME);
        await cleanTestJobs(TEST_JOB_NAME);
    });
    afterEach(async () => {
        await cleanTestJobs(MONITOR_JOB_NAME);
        await cleanTestJobs(TEST_JOB_NAME);
    });

    /**********************************************/
    // API methods "SearchJobs..." system tests
    describe("Search Jobs APIs", () => {

        /**********************************************/
        // API methods "Searchobs" system tests
        describe("search jobs API", () => {
            describe("invalid request error handling", () => {
                it("should detect and surface an error for an invalid user", async () => {
                    let err;
                    try {
                        await SearchJobs.searchJobs(INVALID_SESSION,{jobName: "IBMUSER", searchString: "dummy"});
                    } catch (e) {
                        err = e;
                    }
                    expect(err).toBeDefined();
                    expect(err instanceof ImperativeError).toBe(true);
                    expect(err.message).toContain("status 401"); // unauthorized - bad credentials
                });
            });
        });
    });
});