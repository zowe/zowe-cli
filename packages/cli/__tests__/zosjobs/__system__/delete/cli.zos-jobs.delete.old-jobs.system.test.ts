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

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let IEFBR14_JCL: string;

describe("zos-jobs delete old-jobs command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_delete_old_jobs_command",
            tempProfileTypes: ["zosmf"]
        });
        IEFBR14_JCL = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
    });

    describe("error handling", () => {
        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/old-jobs/not_found.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("No jobs found with prefix");
        });
    });

    describe("successful scenario", () => {
        it("should delete all old jobs sequentially default", () => {
            const response = runCliScript(__dirname + "/__scripts__/old-jobs/delete_old_jobs.sh",
                TEST_ENVIRONMENT, [IEFBR14_JCL]);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("Successfully deleted");
        });

        it("should delete all old jobs in parallel default", () => {
            const response = runCliScript(__dirname + "/__scripts__/old-jobs/delete_old_jobs.sh",
                TEST_ENVIRONMENT, [IEFBR14_JCL, "--mcr", "0"]);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("Successfully deleted");
        });

        it("should delete all old jobs with modifyVersion 1.0 sequentially", () => {
            const response = runCliScript(__dirname + "/__scripts__/old-jobs/delete_old_jobs.sh",
                TEST_ENVIRONMENT, [IEFBR14_JCL, "--modify-version", "1.0"]);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("Successfully deleted");
        });

        it("should delete all old jobs with modifyVersion 1.0 parallel", () => {
            const response = runCliScript(__dirname + "/__scripts__/old-jobs/delete_old_jobs.sh",
                TEST_ENVIRONMENT, [IEFBR14_JCL, "--mcr", "0", "--modify-version", "1.0"]);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("Successfully deleted");
        });

        it("should delete all old jobs with modifyVersion 2.0 sequentially", () => {
            const response = runCliScript(__dirname + "/__scripts__/old-jobs/delete_old_jobs.sh",
                TEST_ENVIRONMENT, [IEFBR14_JCL, "--modify-version", "2.0"]);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("Successfully deleted");
        });

        it("should delete all old jobs with modifyVersion 2.0 parallel", () => {
            const response = runCliScript(__dirname + "/__scripts__/old-jobs/delete_old_jobs.sh",
                TEST_ENVIRONMENT, [IEFBR14_JCL, "--mcr", "0", "--modify-version", "2.0"]);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("Successfully deleted");
        });
    });
});
