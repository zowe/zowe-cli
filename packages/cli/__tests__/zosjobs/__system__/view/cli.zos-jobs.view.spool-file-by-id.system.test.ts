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
import { Session, TextUtils } from "@zowe/imperative";
import * as fs from "fs";
import { IJob } from "../../../../../../packages/zosjobs/src/doc/response/IJob";
import { TEST_RESOURCES_DIR } from "../../../../../../packages/zosjobs/__tests__/__src__/ZosJobsTestConstants";
import { join } from "path";
import { SubmitJobs } from "../../../../../../packages/zosjobs/src/SubmitJobs";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let IEFBR14_JOB: string;
let REAL_SESSION: Session;
let ACCOUNT: string;
let JOB_NAME: string;
let NON_HELD_JOBCLASS: string;

describe("zos-jobs view spool-file-by-id command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_view_spool_file_by_id_command",
            tempProfileTypes: ["zosmf"]
        });

        IEFBR14_JOB = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        const defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        ACCOUNT = defaultSystem.tso.account;
        const JOB_LENGTH = 6;
        JOB_NAME = REAL_SESSION.ISession.user.substr(0, JOB_LENGTH).toUpperCase() + "SF";
        NON_HELD_JOBCLASS = TEST_ENVIRONMENT.systemTestProperties.zosjobs.jobclass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("response", () => {
        it("should be able to get the content of every spool file for a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/get_all_spool_content.sh",
                TEST_ENVIRONMENT, [IEFBR14_JOB]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("!!!SPOOL FILE");
            expect(response.stdout.toString()).toContain("PGM=IEFBR14");
        });

        it("should be able to view the contents of the requested DD", async () => {
            // Construct the JCL
            const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/multiple_procs.jcl")).toString();
            const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                {JOBNAME: JOB_NAME, ACCOUNT, JOBCLASS: NON_HELD_JOBCLASS});

            // Submit the job
            const job: IJob = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);

            // View the DDs
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/get_systsprt_dd.sh",
                TEST_ENVIRONMENT, [job.jobid]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("!!!SPOOL FILE!!!");
            expect(response.stdout.toString()).toContain("OUTPUT FROM PROC1");
            expect(response.stdout.toString()).toContain("OUTPUT FROM PROC2");
            expect(response.status).toBe(0);
        });

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
            let SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_view_spool_file_by_id_without_profiles"
                });

                SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should be able to get the content of every spool file for a job", async () => {
                const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                // if API Mediation layer is being used (basePath has a value) then
                // set an ENVIRONMENT variable to be used by zowe.
                if (SYSTEM_PROPS.zosmf.basePath != null) {
                    TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = SYSTEM_PROPS.zosmf.basePath;
                }

                const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/get_all_spool_content_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        IEFBR14_JOB,
                        SYSTEM_PROPS.zosmf.host,
                        SYSTEM_PROPS.zosmf.port,
                        SYSTEM_PROPS.zosmf.user,
                        SYSTEM_PROPS.zosmf.pass
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("!!!SPOOL FILE");
                expect(response.stdout.toString()).toContain("PGM=IEFBR14");
            });
        });
    });

    describe("error handling", () => {
        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/jobid_does_not_exist.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("Obtaining job info for a single job id J0 on");
            expect(response.stderr.toString()).toContain("failed: Job not found");
        });

        it("should surface an error if the spool file ID does not exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/spool_file_does_not_exist.sh",
                TEST_ENVIRONMENT, [IEFBR14_JOB]);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("z/OSMF REST API Error:");
            expect(response.stderr.toString()).toContain("does not contain spool file id 9999");
            expect(response.stderr.toString()).toContain("Error Details:");
            expect(response.stderr.toString()).toContain("Request:   GET");
        });
    });
});
