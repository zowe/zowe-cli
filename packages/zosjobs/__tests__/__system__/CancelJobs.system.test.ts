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

import { ImperativeError, Session, RestClientError } from "@zowe/imperative";
import { CancelJobs, SubmitJobs, IJob } from "../../src";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { JobTestsUtils } from "./JobTestsUtils";

let REAL_SESSION: Session;
let sleepJCL: string;

let systemProps: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
const LONG_TIMEOUT = 100000; // 100 second timeout - jobs could take a while to complete due to system load

describe("CancelJobs System tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_cancel_jobs"
        });
        systemProps = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        const ACCOUNT = systemProps.tso.account;
        const maxStepNum = 6;  // Use lots of steps to make the job stay in INPUT status longer

        sleepJCL = JobTestsUtils.getSleepJCL(REAL_SESSION.ISession.user, ACCOUNT, systemProps.zosjobs.jobclass, maxStepNum);
    });

    describe("Positive tests", () => {
        it("should be able to cancel a job using cancelJob (modify version 1)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid, "1.0");
            expect(response).toBeUndefined();
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJob (modify version 2)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid, "2.0");
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJob (modify version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid);
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob (modify version 1)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobForJob(REAL_SESSION, job, "1.0");
            expect(response).toBeUndefined();
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob (modify version 2)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobForJob(REAL_SESSION, job, "2.0");
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob (modify version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobForJob(REAL_SESSION, job);
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 1)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "1.0"});
            expect(response).toBeUndefined();
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 2.0 - synchronous)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response).toBeDefined();
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 2.0 - synchronous) and return an error feedback object", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            let response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response?.status).toEqual("0");
            response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response?.status).toEqual("156");
        }, LONG_TIMEOUT);
    });

    describe("Negative tests", () => {
        it("should surface errors from z/OSMF when trying to cancel a non existent job with cancelJob", async () => {
            let err: ImperativeError;
            try {
                await CancelJobs.cancelJob(REAL_SESSION, "FAKEJOB", "JOB00001");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(JSON.parse(err.causeErrors).message).toContain("FAKEJOB");
        });

        it("should surface errors from z/OSMF when trying to cancel a non-existent job using cancelJobForJob", async () => {
            let err: ImperativeError;
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
            expect(JSON.parse(err.causeErrors).message).toContain("FAKEJOB");
        });

        it("should surface errors from z/OSMF when trying to cancel a non-existent job using cancelJobCommon", async () => {
            let err: ImperativeError;
            try {
                await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: "FAKEJOB", jobid: "JOB00001"});
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(JSON.parse(err.causeErrors).message).toContain("FAKEJOB");
        });
    });
});

describe("CancelJobs System tests - encoded", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_cancel_jobs_encoded"
        });
        systemProps = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        const ACCOUNT = systemProps.tso.account;
        const maxStepNum = 6;  // Use lots of steps to make the job stay in INPUT status longer

        sleepJCL = JobTestsUtils.getSleepJCL(REAL_SESSION.ISession.user, ACCOUNT, systemProps.zosjobs.jobclass, maxStepNum, true);
    });

    describe("Positive tests", () => {
        it("should be able to cancel a job using cancelJob (modify version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid);
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob (modify version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobForJob(REAL_SESSION, job);
            expect(response).not.toBeUndefined();
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version default)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            const response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});
            expect(response?.status).toEqual("0"); // intermittent failure
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 2.0 - synchronous) and return an error feedback object", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: sleepJCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            let response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response?.status).toEqual("0");
            response = await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
            expect(response?.status).toEqual("156");
        }, LONG_TIMEOUT);
    });
});
