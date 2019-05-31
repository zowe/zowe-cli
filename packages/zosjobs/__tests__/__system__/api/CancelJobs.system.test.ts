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
import { CancelJobs, SubmitJobs } from "../../../";
import { IJob } from "../../../index";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { JobTestsUtils } from "./JobTestsUtils";

let REAL_SESSION: Session;
let iefbr14JCL: string;

let systemProps: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment;
const LONG_TIMEOUT = 100000; // 100 second timeout - jobs could take a while to complete due to system load

describe("CancelJobs System tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_cancel_jobs"
        });
        systemProps = testEnvironment.systemTestProperties;

        REAL_SESSION = new Session({
            user: systemProps.zosmf.user,
            password: systemProps.zosmf.pass,
            hostname: systemProps.zosmf.host,
            port: systemProps.zosmf.port,
            type: "basic",
            rejectUnauthorized: systemProps.zosmf.rejectUnauthorized
        });

        const ACCOUNT = systemProps.tso.account;

        iefbr14JCL = JobTestsUtils.getIefbr14JCL(REAL_SESSION.ISession.user, ACCOUNT);
    });

    describe("Positive tests", () => {
        it("should be able to cancel a job using cancelJob", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: iefbr14JCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            await CancelJobs.cancelJob(REAL_SESSION, job.jobname, job.jobid);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobForJob", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: iefbr14JCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            await CancelJobs.cancelJobForJob(REAL_SESSION, job);
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: iefbr14JCL, status: "INPUT"});
            expect(job.retcode).toBeNull(); // job is not complete, no CC
            await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});
        }, LONG_TIMEOUT);

        it("should be able to cancel a job using cancelJobCommon (job version 2.0 - synchronous)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: iefbr14JCL, status: "INPUT"});
            await CancelJobs.cancelJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid, version: "2.0"});
        }, LONG_TIMEOUT);
    });

    describe("Negative tests", () => {
        it("should surface errors from z/OSMF when trying to cancel a non existent job with cancelJob", async () => {
            let err: Error | ImperativeError;
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
