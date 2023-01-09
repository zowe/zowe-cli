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

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let jclMember: string;
let jobclass: string;

describe("zos-jobs modify job command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_modify_job_command",
            tempProfileTypes: ["zosmf"]
        });
        jclMember = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        jobclass = TEST_ENVIRONMENT.systemTestProperties.zosjobs.jobclass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    describe("error handling", () => {
        it("should catch if the jobclass is invalid", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/bogus_jobclass.sh", TEST_ENVIRONMENT, [jclMember]);
            // zosmf doesn't consider invalid jobclass as an error
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("invalid");
        });
        it("should surface an Imperative error if the jobid is invalid", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/bogus_jobid.sh", TEST_ENVIRONMENT);
            // potential fix needed in imperative to count this type of error as status = 1
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toContain("Job not found");
        });
    });

    describe("successful response", () => {
        it("should use an existing jobid when attempting to modify job", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/real_jobid.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Successful");
        });

        it("should be able to modify job class", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/real_jobclass.sh",
                TEST_ENVIRONMENT, [jclMember, jobclass]);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain('class": "' + jobclass);
            expect(response.stdout.toString()).toContain("Successful");
        });

        it("should be able to hold a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/hold_job.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.stdout.toString()).toContain("Successful");
            expect(response.status).toBe(0);
        });

        it("should be able to release a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/release_job.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Successful");
        });
    });
});
