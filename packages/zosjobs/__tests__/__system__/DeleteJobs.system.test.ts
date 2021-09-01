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
import { DeleteJobs, SubmitJobs } from "../../src";
import { IJob } from "../../src/doc/response/IJob";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { Get } from "@zowe/zos-files-for-zowe-sdk";

let REAL_SESSION: Session;
let iefbr14JCL: string;

let defaultSystem: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment;
const LONG_TIMEOUT = 100000; // 100 second timeout - jobs could take a while to complete due to system load

describe("DeleteJobs System tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_get_jobs"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        const ACCOUNT = defaultSystem.tso.account;

        // download the valid IEFBR14 from the data set specified in the properties file
        const iefbr14DataSet = testEnvironment.systemTestProperties.zosjobs.iefbr14Member;
        iefbr14JCL = (await Get.dataSet(REAL_SESSION, iefbr14DataSet)).toString();
    });

    describe("Positive tests", () => {
        it("should be able to delete a job using deleteJob", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: iefbr14JCL});
            expect(job.retcode).toEqual("CC 0000");
            await DeleteJobs.deleteJob(REAL_SESSION, job.jobname, job.jobid);
        }, LONG_TIMEOUT);

        it("should be able to delete a job using deleteJobForJob", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: iefbr14JCL});
            expect(job.retcode).toEqual("CC 0000");
            await DeleteJobs.deleteJobForJob(REAL_SESSION, job);
        }, LONG_TIMEOUT);

        it("should be able to delete a job using deleteJobCommon", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: iefbr14JCL});
            expect(job.retcode).toEqual("CC 0000");
            await DeleteJobs.deleteJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});
        }, LONG_TIMEOUT);

        it("should be able to delete a job using deleteJobCommon (job modify version 2.0 - synchronous)", async () => {
            const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {jcl: iefbr14JCL});
            await DeleteJobs.deleteJobCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});
        }, LONG_TIMEOUT);
    });

    describe("Negative tests", () => {
        it("should surface errors from z/OSMF when trying to delete a non existent job with deleteJob", async () => {
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJob(REAL_SESSION, "FAKEJOB", "JOB00001");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("FAKEJOB");
        });

        it("should surface errors from z/OSMF when trying to delete a non-existent job using deleteJobForJob", async () => {
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
                await DeleteJobs.deleteJobForJob(REAL_SESSION, badJob);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("FAKEJOB");
        });

        it("should surface errors from z/OSMF when trying to delete a non-existent job using deleteJobCommon", async () => {
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJobCommon(REAL_SESSION, {jobname: "FAKEJOB", jobid: "JOB00001"});
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("FAKEJOB");
        });
    });
});
