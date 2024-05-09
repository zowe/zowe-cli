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
import * as fs from "fs";
import { Session, TextUtils } from "@zowe/imperative";
import { IJob, SubmitJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { TEST_RESOURCES_DIR } from "../../../../../../packages/zosjobs/__tests__/__src__/ZosJobsTestConstants";
import { join } from "path";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let IEFBR14_JOB: string;
let REAL_SESSION: Session;
let ACCOUNT: string;
let JOB_NAME: string;
let NON_HELD_JOBCLASS: string;

// Long test timeout
const LONG_TIMEOUT = 100000;

const trimMessage = (message: string) => {
    // don't use more than one space or tab when checking error details
    // this allows us to expect things like "reason: 6" regardless of how prettyjson aligns the text
    return message.replace(/( {2,})|\t/g, " ");
};

describe("zos-jobs list spool-files-by-jobid command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_list_spool_files_by_jobid_command",
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

    describe("error handling", () => {
        it("should present an error message if the JOBID is not found", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-files-by-jobid/not_found.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            // TODO:V3_ERR_FORMAT - In V3 remove the following lines
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("Obtaining job info for a single job id j0");
            expect(response.stderr.toString()).toContain("failed: Job not found");
            /* TODO:V3_ERR_FORMAT - Use the following lines instead
            expect(response.stderr.toString()).toContain("Cannot obtain job info for job id = j0");
            expect(response.stderr.toString()).toContain("Zero jobs were returned");
            */
            expect(response.status).toBe(1);
        });

        it("should present an error message if the JOBID is not valid", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-files-by-jobid/invalid_jobid.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            const trimmed = trimMessage(response.stderr.toString());
            expect(trimmed).toContain("status 400");
            expect(trimmed).toContain("category: 6");
            expect(trimmed).toContain("reason: 4");
            expect(trimmed).toContain("Value of jobid query parameter is not valid");
            expect(trimmed).toContain("rc: 4");
            expect(trimmed).toContain("Resource: /zosmf/restjobs/jobs");
            expect(trimmed).toContain("Request: GET");
            expect(response.status).toBe(1);
        });
    });

    describe("response", () => {
        it("should display the ddnames for a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-files-by-jobid/submit_and_list_dds.sh",
                TEST_ENVIRONMENT, [IEFBR14_JOB]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            // TODO: Hopefully these DDs are deterministic on all of our test systems.
            // TODO: Once available, we can submit from a local file via command
            // TODO: with certain DDs (wanted this test to be entirely script driven
            // TODO: to capture a "real world" scenario)
            expect(response.stdout.toString()).toContain("JESMSGLG");
            expect(response.stdout.toString()).toContain("JESJCL");
            expect(response.stdout.toString()).toContain("JESYSMSG");
        });

        it("should display the the procnames and ddnames for a job", async () => {
            // Construct the JCL
            const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/multiple_procs.jcl")).toString();
            const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                {JOBNAME: JOB_NAME, ACCOUNT, JOBCLASS: NON_HELD_JOBCLASS});

            // Submit the job
            const job: IJob = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);

            // View the DDs
            const response = runCliScript(__dirname + "/__scripts__/spool-files-by-jobid/list_dds.sh",
                TEST_ENVIRONMENT, [job.jobid]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("STEP1");
            expect(response.stdout.toString()).toContain("STEP2");
            expect(response.stdout.toString()).toContain("SYSTSPRT");
            expect(response.stdout.toString()).toContain("TSOSTEP1");
            expect(response.stdout.toString()).toContain("TSOSTEP2");
        }, LONG_TIMEOUT);

        describe("without profiles", () => {

            // Create a separate test environment for no profiles
            let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
            let SYSTEM_PROPS: ITestPropertiesSchema;

            beforeAll(async () => {
                TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                    testName: "zos_jobs_list_spool_files_by_jobid_without_profiles"
                });

                SYSTEM_PROPS = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
            });

            afterAll(async () => {
                await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
            });

            it("should display the ddnames for a job", async () => {
                const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

                // if API Mediation layer is being used (basePath has a value) then
                // set an ENVIRONMENT variable to be used by zowe.
                if (SYSTEM_PROPS.zosmf.basePath != null) {
                    TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = SYSTEM_PROPS.zosmf.basePath;
                }

                const response = runCliScript(__dirname + "/__scripts__/spool-files-by-jobid/submit_and_list_dds_fully_qualified.sh",
                    TEST_ENVIRONMENT_NO_PROF,
                    [
                        TEST_ENVIRONMENT_NO_PROF.systemTestProperties.zosjobs.iefbr14Member,
                        SYSTEM_PROPS.zosmf.host,
                        SYSTEM_PROPS.zosmf.port,
                        SYSTEM_PROPS.zosmf.user,
                        SYSTEM_PROPS.zosmf.password,
                    ]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("JESMSGLG");
                expect(response.stdout.toString()).toContain("JESJCL");
                expect(response.stdout.toString()).toContain("JESYSMSG");
            }, LONG_TIMEOUT);
        });
    });
});
