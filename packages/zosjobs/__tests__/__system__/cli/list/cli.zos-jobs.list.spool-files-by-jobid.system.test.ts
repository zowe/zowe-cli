/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ITestEnvironment } from "./../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "./../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "./../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { Session, TextUtils } from "@brightside/imperative";
import { IJob, SubmitJobs } from "../../../..";
import { TEST_RESOURCES_DIR } from "../../../__src__/ZosJobsTestConstants";
import { join } from "path";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
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
        const systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        const defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });

        ACCOUNT = defaultSystem.tso.account;
        const JOB_LENGTH = 6;
        JOB_NAME = REAL_SESSION.ISession.user.substr(0, JOB_LENGTH).toUpperCase() + "SF";
        NON_HELD_JOBCLASS = TEST_ENVIRONMENT.systemTestProperties.zosjobs.jobclass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("help", () => {
        it("should not have changed", async () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-files-by-jobid/help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("syntax", () => {
        it("should detect a missing jobid", async () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-files-by-jobid/missing_jobid.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
        });
    });

    describe("error handling", () => {
        it("should present an error message if the JOBID is not found", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-files-by-jobid/not_found.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("Obtaining job info for a single job id j0");
            expect(response.stderr.toString()).toContain("failed: Job not found");
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
    });
});
