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
import { JobTestsUtils } from "./JobTestsUtils";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let systemProps: ITestPropertiesSchema;
let REAL_SESSION: Session;
let account: string;
let jobclass: string;
let modifiedJobClass: string;
let iefbr14Job: IJob;
let sleepJCLJob: IJob;
const badJobName = "Job1234";

describe("Modify Jobs - System Tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_modify_jobs"
        });
        systemProps = testEnvironment.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        account = systemProps.tso.account;
        jobclass = testEnvironment.systemTestProperties.zosjobs.jobclass;
        modifiedJobClass = testEnvironment.systemTestProperties.zosjobs.modifiedJobclass;
        iefbr14Job = await SubmitJobs.submitJob(REAL_SESSION,
            testEnvironment.systemTestProperties.zosjobs.iefbr14Member
        );
    });

    afterAll(async () => {
        await CancelJobs.cancelJob(REAL_SESSION, iefbr14Job.jobname, iefbr14Job.jobid);
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Positive tests", () => {
        it("should return a success message once jobclass has been modified", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(
                REAL_SESSION,
                {jobname: iefbr14Job.jobname, jobid: iefbr14Job.jobid},
                {jobclass: modifiedJobClass, hold: false, release: false}
            );
            expect(job.jobid).toMatch(iefbr14Job.jobid);
            expect(job.message).toContain("Request was successful");
        });

        it("should return a success message once hold has been added to job", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(
                REAL_SESSION,
                {jobname: iefbr14Job.jobname, jobid: iefbr14Job.jobid},
                {jobclass: modifiedJobClass, hold: true, release: false}
            );
            expect(job.jobid).toMatch(iefbr14Job.jobid);
            expect(job.message).toContain("Request was successful");
        });

        it("should return a success message once job has been released", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(
                REAL_SESSION,
                {jobname: iefbr14Job.jobname, jobid: iefbr14Job.jobid},
                {jobclass: modifiedJobClass, hold: false, release: true}
            );
            expect(job.jobid).toMatch(iefbr14Job.jobid);
            expect(job.message).toContain("Request was successful");
        });
    });

    describe("Negative tests", () => {

        it("should surface an error from z/OSMF when calling an unknown jobid", async () => {
            let err: any;
            try {
                await ModifyJobs.modifyJobCommon(
                    REAL_SESSION,
                    {jobname: badJobName, jobid: iefbr14Job.jobid},
                    {jobclass: modifiedJobClass, hold: false, release: false}
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.mMessage).toContain("No job found for reference");
        });
    });
});

describe("Modify Jobs - System Tests - Encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_modify_jobs_encoded"
        });
        systemProps = testEnvironment.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        account = systemProps.tso.account;
        jobclass = testEnvironment.systemTestProperties.zosjobs.jobclass;
        modifiedJobClass = testEnvironment.systemTestProperties.zosjobs.modifiedJobclass;
        const maxStepNum = 6;
        const sleepJCL = JobTestsUtils.getSleepJCL(REAL_SESSION.ISession.user, account, systemProps.zosjobs.jobclass, maxStepNum, true);
        sleepJCLJob = await SubmitJobs.submitJcl(REAL_SESSION, sleepJCL);
    });

    afterAll(async () => {
        await CancelJobs.cancelJob(REAL_SESSION, iefbr14Job.jobname, iefbr14Job.jobid);
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Positive tests", () => {
        it("should return a success message once jobclass has been modified", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(
                REAL_SESSION,
                {jobname: sleepJCLJob.jobname, jobid: sleepJCLJob.jobid},
                {jobclass: modifiedJobClass, hold: false, release: false}
            );
            expect(job.jobid).toMatch(sleepJCLJob.jobid);
            expect(job.message).toContain("Request was successful");
        });

        it("should return a success message once hold has been added to job", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(
                REAL_SESSION,
                {jobname: sleepJCLJob.jobname, jobid: sleepJCLJob.jobid},
                {jobclass: modifiedJobClass, hold: true, release: false}
            );
            expect(job.jobid).toMatch(sleepJCLJob.jobid);
            expect(job.message).toContain("Request was successful");
        });

        it("should return a success message once job has been released", async () => {
            const job: any = await ModifyJobs.modifyJobCommon(
                REAL_SESSION,
                {jobname: sleepJCLJob.jobname, jobid: sleepJCLJob.jobid},
                {jobclass: modifiedJobClass, hold: false, release: true}
            );
            expect(job.jobid).toMatch(sleepJCLJob.jobid);
            expect(job.message).toContain("Request was successful");
        });
    });
});