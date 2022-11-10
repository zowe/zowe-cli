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
import { IJob, SubmitJobs, ModifyJobs, CancelJobs } from "../../src";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let systemProps: ITestPropertiesSchema;
let REAL_SESSION: Session;
let account: string;
let jobname: string;
let jobclass: string;
let modifiedJobClass: string;
let sleepJob: IJob;
const badJobID = "Job1234";

describe("Modify Jobs - System Tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_modify_jobs"
        });
        systemProps = testEnvironment.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        account = systemProps.tso.account; 
        jobname = testEnvironment.systemTestProperties.zosmf.user;
        jobclass = testEnvironment.systemTestProperties.zosjobs.jobclass;
        modifiedJobClass = testEnvironment.systemTestProperties.zosjobs.modifiedJobclass;
        sleepJob = await SubmitJobs.submitJob(REAL_SESSION, 
            testEnvironment.systemTestProperties.zosjobs.sleepMember
        );
    });

    afterAll(async () => {
        await CancelJobs.cancelJob(REAL_SESSION, jobname, sleepJob.jobid);
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Positive tests", () => {
        it("should return a success message once jobclass has been modified", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(REAL_SESSION, {
                jobname: sleepJob.jobname,
                jobid: sleepJob.jobid,
                jobclass: modifiedJobClass,
                hold: false,
                release: false,
            });
            expect(job.jobid).toMatch(sleepJob.jobid);
            expect(job.message).toContain("Request was successful")
        });

        it("should return a success message once hold has been added to job", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(REAL_SESSION, {
                jobname: sleepJob.jobname,
                jobid: sleepJob.jobid,
                jobclass: modifiedJobClass,
                hold: true,
                release: false,
            });
            expect(job.jobid).toMatch(sleepJob.jobid);
            expect(job.message).toContain("Request was successful")
        });

        it("should return a success message once job has been released", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(REAL_SESSION, {
                jobname: sleepJob.jobname,
                jobid: sleepJob.jobid,
                jobclass: modifiedJobClass,
                hold: false,
                release: true,
            });
            expect(job.jobid).toMatch(sleepJob.jobid);
            expect(job.message).toContain("Request was successful")
        });
    });

    describe("Negative tests", () => {

        it("should surface an error from z/OSMF when calling an unknown jobid", async () => {
            let err: any;
            try {
                await ModifyJobs.modifyJobCommon(REAL_SESSION, {
                    jobname: badJobID,
                    jobid: sleepJob.jobid,
                    jobclass: modifiedJobClass,
                    hold: false,
                    release: false,
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.mMessage).toContain("No job found for reference");
        });
    });
});
