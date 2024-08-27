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

import { ImperativeError, RestClientError, AbstractSession } from "@zowe/imperative";
import { CancelJobs, SubmitJobs, IJob } from "../../src";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { JobTestsUtils } from "./JobTestsUtils";
import { ITestEnvironment, TestEnvironment } from "@zowe/cli-test-utils";

let REAL_SESSION: AbstractSession;
let sleepJCL: string;

let systemProps: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
const LONG_TIMEOUT = 100000; // 100 second timeout - jobs could take a while to complete due to system load

describe("CancelJobs System tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_cancel_jobs"
        }, REAL_SESSION = await TestEnvironment.createSession());
        systemProps = testEnvironment.systemTestProperties;

        const ACCOUNT = systemProps.tso.account;
        const maxStepNum = 6;  // Use lots of steps to make the job stay in INPUT status longer

        sleepJCL = JobTestsUtils.getSleepJCL(REAL_SESSION.ISession.user, ACCOUNT, systemProps.zosjobs.jobclass, maxStepNum);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Positive tests", () => {
        it("should be able to cancel a job using cancelJob (modify version 1)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid, "1.0");
            expect(response).toBeUndefined();
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJob (modify version 2)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid, "2.0");
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJob (modify version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid);
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob (modify version 1)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobForJob(REAL_SESSION, job, "1.0");
            expect(response).toBeUndefined();
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob (modify version 2)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobForJob(REAL_SESSION, job, "2.0");
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob (modify version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobForJob(REAL_SESSION, job);
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 1)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "1.0"});
            expect(response).toBeUndefined();
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 2.0 - synchronous)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response).toBeDefined();
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 2.0 - synchronous) and return an error feedback object", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            let response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response?.status).toEqual("0");
            response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response?.status).toEqual("156");
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);
    });

    describe("Negative tests", () => {
        it("should surface errors from z/OSMF when trying to cancel a non existent job with cancelJob", async () => {
            let err: ImperativeError | RestClientError | Error;
            try {
                await CancelJobs.cancelJob(REAL_SESSION, "FAKEJOB", "JOB00001");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("FAKEJOB");
        });

        it("should surface errors from z/OSMF when trying to cancel a non-existent job using cancelJobForJob", async () => {
            let err: Error | ImperativeError;
            const badJob: IJob = {
                "jobid": "JOB00001",
                "jobname": "FAKEJOB",
                "retcode": "CC 0000",
                "owner": "dummy",
                "subsystem": "JES2",
                "status": "OUTPUT",
                "type": "JOB",
                "class": "A",
                "url": "myfakeurl.com",
                "files-url": "myfakeurl.com/files/records",
                "phase": 2,
                "phase-name": "OUTPUT",
                "job-correlator": "mycorrelator"
            };
            try {
                await CancelJobs.cancelJobForJob(REAL_SESSION, badJob);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("FAKEJOB");
        });

        it("should surface errors from z/OSMF when trying to cancel a non-existent job using cancelJobCommon", async () => {
            let err: Error | ImperativeError;
            try {
                await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: "FAKEJOB", jobid: "JOB00001"});
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("FAKEJOB");
        });
    });
});

describe("CancelJobs System tests - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_cancel_jobs_encoded"
        }, REAL_SESSION = await TestEnvironment.createSession());
        systemProps = testEnvironment.systemTestProperties;

        const ACCOUNT = systemProps.tso.account;
        const maxStepNum = 6;  // Use lots of steps to make the job stay in INPUT status longer

        sleepJCL = JobTestsUtils.getSleepJCL(REAL_SESSION.ISession.user, ACCOUNT, systemProps.zosjobs.jobclass, maxStepNum, true);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Positive tests", () => {
        it("should be able to cancel a job using cancelJob (modify version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid);
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob (modify version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobForJob(REAL_SESSION, job);
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});
            expect(response?.status).toEqual("0"); // intermittent failure
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 2.0 - synchronous) and return an error feedback object", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            let response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response?.status).toEqual("0");
            response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response?.status).toEqual("156");
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);
    });
});
