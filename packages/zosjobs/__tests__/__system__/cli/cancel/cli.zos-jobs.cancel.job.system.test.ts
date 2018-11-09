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

import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { JobTestsUtils } from "../../api/JobTestsUtils";
import { IO } from "@brightside/imperative";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
const LOCAL_JCL_FILE: string = __dirname + "/" + "testFileOfLocalJCL.txt";
let systemProps: TestProperties;

describe("zos-jobs cancel job command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_cancel_job_command",
            tempProfileTypes: ["zosmf"]
        });
        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        const defaultSystem = systemProps.getDefaultSystem();

        const jcl = JobTestsUtils.getIefbr14JCL(defaultSystem.zosmf.user, defaultSystem.tso.account);
        const bufferJCL: Buffer = Buffer.from(jcl);
        IO.createFileSync(LOCAL_JCL_FILE);
        IO.writeFile(LOCAL_JCL_FILE, bufferJCL);
    });

    afterAll(async () => {
        IO.deleteFile(LOCAL_JCL_FILE);
    });

    describe("help", () => {
        it("should not have changed", async () => {
            const response = runCliScript(__dirname + "/__scripts__/job/help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("error handling", () => {
        it("should display an error when jobid is missing", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/missing_jobid.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/not_found.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("Obtaining job info for a single job id JOB00000 on");
            expect(response.stderr.toString()).toContain("failed: Job not found");
        });
    });

    describe("successful scenario", () => {
        it("should cancel a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/cancel_job.sh",
                TEST_ENVIRONMENT, [LOCAL_JCL_FILE]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Successfully canceled job");
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
            let DEFAULT_SYSTEM_PROPS: ITestSystemSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_cancel_job_without_profiles"
                });

                DEFAULT_SYSTEM_PROPS = systemProps.getDefaultSystem();

            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("cancel a job without a profile", async () => {
                const response = runCliScript(__dirname + "/__scripts__/job/cancel_job_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        LOCAL_JCL_FILE,
                        DEFAULT_SYSTEM_PROPS.zosmf.host,
                        DEFAULT_SYSTEM_PROPS.zosmf.port,
                        DEFAULT_SYSTEM_PROPS.zosmf.user,
                        DEFAULT_SYSTEM_PROPS.zosmf.pass
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Successfully canceled job");
            });
        });
    });
});
