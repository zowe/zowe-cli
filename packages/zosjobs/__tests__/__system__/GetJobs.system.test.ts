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

import { JOB_STATUS } from "./../../src/types/JobStatus";
import { ImperativeError, Session, TextUtils } from "@zowe/imperative";
import { DeleteJobs, GetJobs, IJob, JOB_STATUS_ORDER, SubmitJobs } from "../../../index";
import * as  fs from "fs";
import { TEST_RESOURCES_DIR } from "../__src__/ZosJobsTestConstants";
import { join } from "path";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

/**********************************************************************************/
let ACCOUNT: string;

// The job class for holding jobs on the input queue
let JOBCLASS: string;
let SYSAFF: string;

// Session to use for the tests
let REAL_SESSION: Session;

// Invalid credentials session
let INVALID_SESSION: Session;
// The job name - should be the same for cleanup, etc.
const SIX_CHARS = 6;
let MONITOR_JOB_NAME: string;
const TEST_JOB_NAME = "TSTMB";
// Sample JCL - TODO replace by JCL resources
let JCL: string;

const trimMessage = (message: string) => {
    // don't use more than one space or tab when checking error details
    // this allows us to expect things like "reason: 6" regardless of how prettyjson aligns the text
    return message.replace(/( {2,})|\t/g, " ");
};
const waitThreeSeconds = () => {
    return new Promise<void>((resolveWaitTime) => {
            const threeSeconds = 3000;
            setTimeout(() => {
                resolveWaitTime();
            }, threeSeconds);
        }
    );
};

let defaultSystem: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment;

// Utility function to cleanup
async function cleanTestJobs(prefix: string) {
    // The tests may submit jobs - we will clean every job that may have been left by failures, etc.
    const jobs: IJob[] = await GetJobs.getJobsCommon(REAL_SESSION, {owner: REAL_SESSION.ISession.user, prefix: prefix + "*"});
    if (jobs.length > 0) {
        for (const job of jobs) {
            try {
                const response = await DeleteJobs.deleteJob(REAL_SESSION, job.jobname, job.jobid);
            } catch (e) {
                // Don't worry about it
            }
        }
    }
}

const LONG_TIMEOUT = 200000;

describe("Get Jobs - System Tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_get_jobs"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        INVALID_SESSION = new Session({
            user: "fakeuser",
            password: "fake",
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: false
        });

        ACCOUNT = defaultSystem.tso.account;
        MONITOR_JOB_NAME = REAL_SESSION.ISession.user.toUpperCase().substring(0, SIX_CHARS) + "G";

        JOBCLASS = testEnvironment.systemTestProperties.zosjobs.jobclass;
        SYSAFF = testEnvironment.systemTestProperties.zosjobs.sysaff;

        // TODO: What string goes in the removed section?
        JCL =
            "//" + MONITOR_JOB_NAME + " JOB '" + ACCOUNT + "',CLASS=" + JOBCLASS + "\n" +
            "//IEFBR14 EXEC PGM=IEFBR14"; // GetJobs
    });

    // Cleanup before & after each test - this will ensure that hopefully no jobs are left outstanding (or are currently
    // outstanding) when the tests run
    beforeEach(async () => {
        await cleanTestJobs(MONITOR_JOB_NAME);
        await cleanTestJobs(TEST_JOB_NAME);
    });
    afterEach(async () => {
        await cleanTestJobs(MONITOR_JOB_NAME);
        await cleanTestJobs(TEST_JOB_NAME);
    });

    /**********************************************/
    // API methods "getJobs..." system tests
    describe("Get Jobs APIs", () => {

        /**********************************************/
        // API methods "getJobs" system tests
        describe("get jobs API", () => {
            describe("invalid request error handling", () => {
                // pending until z/OSMF returns 401 status code
                xit("should detect and surface an error for an invalid user", async () => {
                    let err;
                    try {
                        await GetJobs.getJobs(INVALID_SESSION);
                    } catch (e) {
                        err = e;
                    }
                    expect(err).toBeDefined();
                    expect(err instanceof ImperativeError).toBe(true);
                    expect(err.message).toMatchSnapshot();
                });
            });

            describe("list jobs", () => {
                it("should return all jobs for the user in the session", async () => {
                    // Read the JCL template file
                    const NUM_JOBS = 3;
                    const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();

                    // Submit a few jobs to list
                    const jobs: IJob[] = [];
                    for (let x = 0; x < NUM_JOBS; x++) {

                        // Render the job with increasing job name
                        const jobRender = iefbr14JclTemplate;
                        const renderedJcl = TextUtils.renderWithMustache(jobRender,
                            {JOBNAME: MONITOR_JOB_NAME + x.toString(), ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                        // Submit the job
                        const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
                        expect(job.status).toEqual("OUTPUT");
                        expect(job.retcode).toEqual("CC 0000");
                        jobs.push(job);
                    }
                    // TODO: this is a workaround for an issue where listing jobs immediately after they are completed
                    // results in the jobs being omitted from the results
                    await waitThreeSeconds();

                    // Obtain all jobs for the user
                    const allJobs: IJob[] = await GetJobs.getJobs(REAL_SESSION);
                    expect(allJobs.length).toBeGreaterThanOrEqual(NUM_JOBS);

                    // Search all jobs returned for each of the submitted jobs
                    jobs.forEach((submittedJob) => {
                        let found = false;
                        for (const returnedJob of allJobs) {
                            if (returnedJob.jobname === submittedJob.jobname && returnedJob.jobid === submittedJob.jobid) {
                                found = true;
                                break;
                            }
                        }
                        expect(found).toBe(true);
                    });
                }, LONG_TIMEOUT);

                it("should be able to get a single job by job ID", async () => {
                    // Read the JCL template file
                    const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();

                    // submit a job that we can list
                    // Render the job with increasing job name
                    const jobRender = iefbr14JclTemplate;
                    const renderedJcl = TextUtils.renderWithMustache(jobRender,
                        {JOBNAME: MONITOR_JOB_NAME + "S", ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                    // Submit the job
                    const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
                    expect(job.status).toEqual("OUTPUT");
                    expect(job.retcode).toEqual("CC 0000");


                    // TODO: this is a workaround for an issue where listing jobs immediately after they are completed
                    // results in the jobs being omitted from the results
                    await waitThreeSeconds();

                    // Search all jobs returned for each of the submitted jobs
                    const foundJob = await GetJobs.getJob(REAL_SESSION, job.jobid);
                    expect(foundJob).toBeDefined();
                    expect(foundJob.jobid).toEqual(job.jobid);
                    expect(foundJob.jobname).toEqual(job.jobname);
                }, LONG_TIMEOUT);

                it("should be able to get a single job by job ID", async () => {
                    // Read the JCL template file
                    const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();

                    // submit a job that we can list
                    // Render the job with increasing job name
                    const jobRender = iefbr14JclTemplate;
                    const renderedJcl = TextUtils.renderWithMustache(jobRender,
                        {JOBNAME: MONITOR_JOB_NAME + "S", ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                    // Submit the job
                    const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
                    expect(job.status).toEqual("OUTPUT");
                    expect(job.retcode).toEqual("CC 0000");


                    // TODO: this is a workaround for an issue where listing jobs immediately after they are completed
                    // results in the jobs being omitted from the results
                    await waitThreeSeconds();

                    // Search all jobs returned for each of the submitted jobs
                    const foundJob = await GetJobs.getJob(REAL_SESSION, job.jobid);
                    expect(foundJob).toBeDefined();
                    expect(foundJob.jobid).toEqual(job.jobid);
                    expect(foundJob.jobname).toEqual(job.jobname);
                }, LONG_TIMEOUT);
            });

            it("should be able to get a single job by job ID with jobid parm on the getJobs API", async () => {
                // Read the JCL template file
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();

                // submit a job that we can list
                // Render the job with increasing job name
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME + "S", ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
                expect(job.status).toEqual("OUTPUT");
                expect(job.retcode).toEqual("CC 0000");


                // TODO: this is a workaround for an issue where listing jobs immediately after they are completed
                // results in the jobs being omitted from the results
                await waitThreeSeconds();

                // Search all jobs returned for each of the submitted jobs
                const foundJobs = await GetJobs.getJobsCommon(REAL_SESSION, {jobid: job.jobid});
                expect(foundJobs).toBeDefined();
                expect(foundJobs.length).toEqual(1);
                expect(foundJobs[0].jobid).toEqual(job.jobid);
                expect(foundJobs[0].jobname).toEqual(job.jobname);
            }, LONG_TIMEOUT);

            it("should be able to get a single job by job ID with jobid parm on the getJobs API", async () => {
                // Read the JCL template file
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();

                // submit a job that we can list
                // Render the job with increasing job name
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME + "S", ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
                expect(job.status).toEqual("OUTPUT");
                expect(job.retcode).toEqual("CC 0000");


                // TODO: this is a workaround for an issue where listing jobs immediately after they are completed
                // results in the jobs being omitted from the results
                await waitThreeSeconds();

                // Search all jobs returned for each of the submitted jobs
                const foundJobs = await GetJobs.getJobsCommon(REAL_SESSION, {jobid: job.jobid});
                expect(foundJobs).toBeDefined();
                expect(foundJobs.length).toEqual(1);
                expect(foundJobs[0].jobid).toEqual(job.jobid);
                expect(foundJobs[0].jobname).toEqual(job.jobname);
            }, LONG_TIMEOUT);
        });
    });

    /**********************************************/
    // API methods "getJobsByPrefix" system tests
    describe("get jobs by prefix API", () => {
        describe("invalid request handling", () => {
            // pending until z/OSMF returns 401 status for invalid credentials
            xit("should detect and surface an error for an invalid userblah", async () => {
                let err;
                try {
                    const resp = await GetJobs.getJobsByPrefix(INVALID_SESSION, "TEST");
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                expect(err.message).toMatchSnapshot();
            });

            it("should detect and surface an error for an invalid prefix (by z/OS standards)", async () => {
                let err;
                try {
                    await GetJobs.getJobsByPrefix(REAL_SESSION, "~~~~~");
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 4");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
                expect(trimmedErrorMessage).toContain("prefix query parameter");
            });
        });

        describe("list jobs", () => {
            it("should return all jobs for the prefix of the user id and the owner is the session user id", async () => {
                // Read the JCL template file
                const NUM_JOBS = 3;
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();

                // Submit a few jobs to list
                const jobs: IJob[] = [];
                for (let x = 0; x < NUM_JOBS; x++) {

                    // Render the job with increasing job name
                    const jobRender = iefbr14JclTemplate;
                    const renderedJcl = TextUtils.renderWithMustache(jobRender,
                        {JOBNAME: MONITOR_JOB_NAME + x.toString(), ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                    // Submit the job
                    const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
                    expect(job.status).toEqual("OUTPUT");
                    expect(job.retcode).toEqual("CC 0000");
                    jobs.push(job);
                }

                // TODO: this is a workaround for an issue where listing jobs immediately after they are completed
                // results in the jobs being omitted from the results
                await waitThreeSeconds();

                // Obtain the three jobs submitted
                const allJobs: IJob[] = await GetJobs.getJobsByPrefix(REAL_SESSION, MONITOR_JOB_NAME + "*");
                expect(allJobs.length).toBeGreaterThanOrEqual(NUM_JOBS);

                // Search all jobs returned for each of the submitted jobs
                jobs.forEach((submittedJob) => {
                    let found = false;
                    for (const returnedJob of allJobs) {
                        if (returnedJob.jobname === submittedJob.jobname && returnedJob.jobid === submittedJob.jobid) {
                            found = true;
                            break;
                        }
                    }
                    expect(found).toBe(true);
                });
            }, LONG_TIMEOUT);

            it("should throw an error if we specify a job ID that doesn't exist", async () => {
                let err: Error | ImperativeError;
                try {
                    await GetJobs.getJob(REAL_SESSION, "J999999");
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err.message).toContain("not found");
            });

            it("should return no jobs for a prefix that doesn't match anything", async () => {
                const allJobs: IJob[] = await GetJobs.getJobsByPrefix(REAL_SESSION, "FAKENE");
                expect(allJobs.length).toBe(0);
            });

            it("should return all jobs for the non user id prefix specified and the owner is the session user id", async () => {
                // Read the JCL template file
                const NUM_JOBS = 3;
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();

                // Submit a few jobs to list
                const jobs: IJob[] = [];
                for (let x = 0; x < NUM_JOBS; x++) {

                    // Render the job with increasing job name
                    const jobRender = iefbr14JclTemplate;
                    const renderedJcl = TextUtils.renderWithMustache(jobRender,
                        {JOBNAME: TEST_JOB_NAME + x.toString(), ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                    // Submit the job
                    const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
                    expect(job.status).toEqual("OUTPUT");
                    expect(job.retcode).toEqual("CC 0000");
                    jobs.push(job);
                }

                // TODO: this is a workaround for an issue where listing jobs immediately after they are completed
                // results in the jobs being omitted from the results
                await waitThreeSeconds();

                // Obtain the three jobs submitted
                const allJobs: IJob[] = await GetJobs.getJobsByPrefix(REAL_SESSION, TEST_JOB_NAME + "*");
                expect(allJobs.length).toBeGreaterThanOrEqual(NUM_JOBS);

                // Search all jobs returned for each of the submitted jobs
                jobs.forEach((submittedJob) => {
                    let found = false;
                    for (const returnedJob of allJobs) {
                        if (returnedJob.jobname === submittedJob.jobname && returnedJob.jobid === submittedJob.jobid) {
                            found = true;
                            break;
                        }
                    }
                    expect(found).toBe(true);
                });
            }, LONG_TIMEOUT);
        });
    });

    /**********************************************/
    // API methods "getJobsByPrefix" system tests
    describe("get jobs by owner API", () => {
        describe("invalid request handling", () => {
            // pending until z/OSMF returns 401 status for invalid credentials
            xit("should detect and surface an error for an invalid user", async () => {
                let err;
                try {
                    await GetJobs.getJobsByPrefix(INVALID_SESSION, "TEST");
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                expect(err.message).toMatchSnapshot();
            });

            it("should detect and surface an error for an invalid owner (by z/OS standards)", async () => {
                let err;
                try {
                    await GetJobs.getJobsByOwner(REAL_SESSION, "~~~~~");
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 4");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
                expect(trimmedErrorMessage).toContain("owner query parameter");
            });
        });

        describe("list jobs", () => {
            it("should return no jobs for a nonexistent owner", async () => {
                // Obtain the three jobs submitted
                const allJobs: IJob[] = await GetJobs.getJobsByOwner(REAL_SESSION, "FAKENE");
                expect(allJobs.length).toBe(0);
            });

            it("should return all jobs for the user (of the session) when specified as the owner", async () => {
                // Read the JCL template file
                const NUM_JOBS = 3;
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();

                // Submit a few jobs to list
                const jobs: IJob[] = [];
                for (let x = 0; x < NUM_JOBS; x++) {

                    // Render the job with increasing job name
                    const jobRender = iefbr14JclTemplate;
                    const renderedJcl = TextUtils.renderWithMustache(jobRender,
                        {JOBNAME: MONITOR_JOB_NAME + x.toString(), ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                    // Submit the job
                    const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
                    expect(job.status).toEqual("OUTPUT");
                    expect(job.retcode).toEqual("CC 0000");
                    jobs.push(job);
                }

                // TODO: this is a workaround for an issue where listing jobs immediately after they are completed
                // results in the jobs being omitted from the results
                await waitThreeSeconds();
                // Obtain all jobs for ***REMOVED***
                const allJobs: IJob[] = await GetJobs.getJobsByOwner(REAL_SESSION, REAL_SESSION.ISession.user);
                expect(allJobs.length).toBeGreaterThanOrEqual(NUM_JOBS);

                // Search all jobs returned for each of the submitted jobs
                jobs.forEach((submittedJob) => {
                    let found = false;
                    for (const returnedJob of allJobs) {
                        if (returnedJob.jobname === submittedJob.jobname && returnedJob.jobid === submittedJob.jobid) {
                            found = true;
                            break;
                        }
                    }
                    expect(found).toBe(true);
                });
            }, LONG_TIMEOUT);
        });
    });
});

/**********************************************/
// API methods "getStatus..." system tests
describe("Get Status APIs", () => {

    /**********************************************/
    // API methods "getStatus" system tests
    describe("get status API", () => {
        describe("invalid request error handling", () => {
            // pending until z/OSMF returns 401 status for invalid credentials
            xit("should detect and surface and error for an invalid user",
                async () => {
                    let err;
                    try {
                        await GetJobs.getStatus(INVALID_SESSION, "FAKE", "FAKE");
                    } catch (e) {
                        err = e;
                    }
                    expect(err).toBeDefined();
                    expect(err instanceof ImperativeError).toBe(true);
                    expect(err.message).toContain("status 401"); // unauthorized - bad credentials
                }
            );

            it("should detect and surface and error for an invalid jobname", async () => {
                let err;
                try {
                    await GetJobs.getStatus(REAL_SESSION, "))))))))", "JOB123");
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 7");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
            });

            it("should detect and surface and error for an invalid jobid", async () => {
                let err;
                try {
                    await GetJobs.getStatus(REAL_SESSION, "***REMOVED***1", "))))))))))");
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 7");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
            });
        });

        describe("obtain job status", () => {
            it("should be able to get the status of a recently submitted job", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

                // Expect that the status is one of the three possible
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(JOB_STATUS_ORDER.indexOf(job.status as JOB_STATUS)).toBeGreaterThanOrEqual(0);

                // Get the status of the job submitted
                const status = await GetJobs.getStatus(REAL_SESSION, job.jobname, job.jobid);

                // Expect that the status is one of the three possible
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(JOB_STATUS_ORDER.indexOf(status.status as JOB_STATUS)).toBeGreaterThanOrEqual(0);
            });

            it("should be able to get the status of a recently submitted job on INPUT queue", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: ",TYPRUN=HOLD", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

                // Expect the jobname to match
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(job.status).toBe(JOB_STATUS.INPUT);

                // Get the status of the job submitted
                const status = await GetJobs.getStatus(REAL_SESSION, job.jobname, job.jobid);

                // Expect that the status is input
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(status.status).toBe(JOB_STATUS.INPUT);
            });

            it("should be able to get the status of a recently submitted and completed (OUTPUT) job", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);

                // Expect that the status is output
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(job.status).toBe(JOB_STATUS.OUTPUT);

                // Get the status of the job submitted
                const status = await GetJobs.getStatus(REAL_SESSION, job.jobname, job.jobid);

                // Expect that the status is output
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(status.status).toBe(JOB_STATUS.OUTPUT);
            }, LONG_TIMEOUT);
        });
    });

    /**********************************************/
    // API methods "getStatusCommon" system tests
    describe("get status common API", () => {
        describe("invalid request error handling", () => {
            // pending until z/OSMF returns 401 status for invalid credentials
            it("should detect and surface and error for an invalid user", async () => {
                let err;
                try {
                    await GetJobs.getStatusCommon(INVALID_SESSION, {jobname: "FAKE", jobid: "FAKE"});
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                // TODO: when system tests are running we'll add more expects
                // expect(err.message).toMatchSnapshot();
            });

            it("should detect and surface and error for an invalid jobname", async () => {
                let err;
                try {
                    await GetJobs.getStatusCommon(REAL_SESSION, {jobname: "))))))))", jobid: "JOB123"});
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 7");
                expect(trimmedErrorMessage).toContain("status 400");
                expect(trimmedErrorMessage).toContain("JOB123");
            });

            it("should detect and surface and error for an invalid jobid", async () => {
                let err;
                try {
                    await GetJobs.getStatusCommon(REAL_SESSION, {jobname: "***REMOVED***1", jobid: "))))))))))"});
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 7");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
            });
        });

        describe("obtain job status", () => {
            it("should be able to get the status of a recently submitted job", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

                // Expect that the status is one of the three possible
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(JOB_STATUS_ORDER.indexOf(job.status as JOB_STATUS)).toBeGreaterThanOrEqual(0);

                // Get the status of the job submitted
                const status = await GetJobs.getStatusCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});

                // Expect that the status is one of the three possible
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(JOB_STATUS_ORDER.indexOf(status.status as JOB_STATUS)).toBeGreaterThanOrEqual(0);
            });

            it("should be able to get the status of a recently submitted job on INPUT queue", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: ",TYPRUN=HOLD", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

                // Expect that the status is input
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(job.status).toBe(JOB_STATUS.INPUT);

                // Get the status of the job submitted
                const status = await GetJobs.getStatusCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});

                // Expect that the status is input
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(status.status).toBe(JOB_STATUS.INPUT);
            });

            it("should be able to get the status of a recently submitted and completed (OUTPUT) job", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);

                // Expect that the status is output
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(job.status).toBe(JOB_STATUS.OUTPUT);

                // Get the status of the job submitted
                const status = await GetJobs.getStatusCommon(REAL_SESSION, {jobname: job.jobname, jobid: job.jobid});

                // Expect that the status is output
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(status.status).toBe(JOB_STATUS.OUTPUT);
            }, LONG_TIMEOUT);
        });
    });

    /**********************************************/
    // API methods "getStatusForJob" system tests
    describe("get status for job API ", () => {
        describe("invalid request error handling", () => {
            // pending until z/OSMF returns 401 status for invalid credentials
            xit("should detect and surface and error for an invalid user", async () => {
                let err;
                try {
                    const job: any = {jobname: "FAKE", jobid: "fake"};
                    await GetJobs.getStatusForJob(INVALID_SESSION, job);
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("status 401");
            });

            it("should be able to get a job that was submitted and get proper error when the job is deleted", async () => {
                const job = await SubmitJobs.submitJcl(REAL_SESSION, JCL);
                const jobStatus = await GetJobs.getStatusForJob(REAL_SESSION, job);

                await DeleteJobs.deleteJobForJob(REAL_SESSION, job);
                await waitThreeSeconds(); // make sure jobs is deleted
                let error;
                try {
                    await GetJobs.getStatusForJob(REAL_SESSION, job);
                } catch (thrownError) {
                    error = thrownError;
                }
                expect(error).toBeDefined();
                expect(JSON.parse(error.causeErrors).rc).toMatchSnapshot();
                expect(JSON.parse(error.causeErrors).reason).toMatchSnapshot();
                expect(JSON.parse(error.causeErrors).category).toMatchSnapshot();
            }, LONG_TIMEOUT);

            it("should detect and surface and error for an invalid jobname", async () => {
                let err;
                try {
                    await GetJobs.getStatusForJob(REAL_SESSION, {jobname: "))))))))", jobid: "JOB123"} as any);
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 7");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
            });

            it("should detect and surface and error for an invalid jobid", async () => {
                let err;
                try {
                    await GetJobs.getStatusForJob(REAL_SESSION, {jobname: "***REMOVED***1", jobid: "))))))))))"} as any);
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toBe(true);
                const trimmedErrorMessage = trimMessage(err.message);
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 7");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
            });
        });

        describe("obtain job status", () => {
            it("should be able to get the status of a recently submitted job", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

                // Expect that the status is one of the three possible
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(JOB_STATUS_ORDER.indexOf(job.status as JOB_STATUS)).toBeGreaterThanOrEqual(0);

                // Get the status of the job submitted
                const status = await GetJobs.getStatusForJob(REAL_SESSION, job);

                // Expect that the status is one of the three possible
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(JOB_STATUS_ORDER.indexOf(status.status as JOB_STATUS)).toBeGreaterThanOrEqual(0);
            });

            it("should be able to get the status of a recently submitted job on INPUT queue", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: ",TYPRUN=HOLD", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

                // Expect that the status is input
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(job.status).toBe(JOB_STATUS.INPUT);

                // Get the status of the job submitted
                const status = await GetJobs.getStatusForJob(REAL_SESSION, job);

                // Expect that the status is input
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(status.status).toBe(JOB_STATUS.INPUT);
            });

            it("should be able to get the status of a recently submitted and completed (OUTPUT) job", async () => {
                // Render the job with increasing job name
                const iefbr14JclTemplate = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const jobRender = iefbr14JclTemplate;
                const renderedJcl = TextUtils.renderWithMustache(jobRender,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // Submit the job
                const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);

                // Expect that the status is output
                expect(job.jobname).toBe(MONITOR_JOB_NAME);
                expect(job.status).toBe(JOB_STATUS.OUTPUT);

                // Get the status of the job submitted
                const status = await GetJobs.getStatusForJob(REAL_SESSION, job);

                // Expect that the status is output
                expect(status.jobname).toBe(MONITOR_JOB_NAME);
                expect(status.status).toBe(JOB_STATUS.OUTPUT);
            }, LONG_TIMEOUT);
        });
    });
});

/**********************************************/
// API methods "getSpool..." system tests
describe("Get spool APIs", () => {
    describe("invalid request error handling", () => {
        it("should detect and surface an error for getting spool content that doesnt exist", async () => {
            const job = await SubmitJobs.submitJclNotify(REAL_SESSION, JCL);
            const files = await GetJobs.getSpoolFilesForJob(REAL_SESSION, job);
            await DeleteJobs.deleteJobForJob(REAL_SESSION, job);
            await waitThreeSeconds();
            let error;
            try {
                const content = await GetJobs.getSpoolContent(REAL_SESSION, files[0]);
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).toBeDefined();
            expect(JSON.parse(error.causeErrors).rc).toMatchSnapshot();
            expect(JSON.parse(error.causeErrors).reason).toMatchSnapshot();
            expect(JSON.parse(error.causeErrors).category).toMatchSnapshot();
            const trimmedErrorMessage = trimMessage(error.message);
            expect(trimmedErrorMessage).toContain("category: 6");
            expect(trimmedErrorMessage).toContain("reason: 10");
            expect(trimmedErrorMessage).toContain("rc: 4");
            expect(trimmedErrorMessage).toContain("status 400");
        }, LONG_TIMEOUT);
    });

    describe("list spool files/dds", () => {
        it("should be able to get all spool files in a job", async () => {
            const NUM_OF_SPOOL_FILES = 3;
            const job = await SubmitJobs.submitJclNotify(REAL_SESSION, JCL);
            const files = await GetJobs.getSpoolFilesForJob(REAL_SESSION, job);
            expect(files.length).toBe(NUM_OF_SPOOL_FILES); // verify expected number of DDs
            files.forEach((file) => {
                expect(file.jobname).toEqual(job.jobname); // verify jobname is in each jobfile
            });
            await DeleteJobs.deleteJobForJob(REAL_SESSION, job);
        });
    });

    describe("download spool files", () => {
        it("Should get spool content from a job", async () => {
            const idcams = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_content.jcl")).toString();
            const DATA_TO_CHECK = "PUTTYPUTTYPUTTYPUTTY";
            const renderedJcl = TextUtils.renderWithMustache(idcams,
                {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF, CONTENT: DATA_TO_CHECK});
            const NUM_OF_SPOOL_FILES = 4;
            const DD_WITH_CONTENT = "SYSTSPRT";
            const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
            const files = await GetJobs.getSpoolFilesForJob(REAL_SESSION, job);
            expect(files.length).toBe(NUM_OF_SPOOL_FILES); // verify expected number of DDs
            let found = false;

            for (const file of files) {
                if (file.ddname === DD_WITH_CONTENT) {
                    const dataContent = await GetJobs.getSpoolContent(REAL_SESSION, file);
                    expect(dataContent).toContain("NUMBER OF RECORDS PROCESSED WAS 3");
                    found = true;
                }
            }
            expect(found).toBe(true);
        }, LONG_TIMEOUT);

        it("Should get spool content for a single job", async () => {
            const idcams = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_content.jcl")).toString();
            const DATA_TO_CHECK = "PUTTYPUTTYPUTTYPUTTY";
            const renderedJcl = TextUtils.renderWithMustache(idcams,
                {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF, CONTENT: DATA_TO_CHECK});
            const NUM_OF_SPOOL_FILES = 4;
            const DD_WITH_CONTENT = "SYSTSPRT";
            const job = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);
            const files = await GetJobs.getSpoolFilesForJob(REAL_SESSION, job);
            expect(files.length).toBe(NUM_OF_SPOOL_FILES); // verify expected number of DDs
            for (const file of files) {
                if (file.ddname === DD_WITH_CONTENT) {
                    const content = await GetJobs.getSpoolContentById(REAL_SESSION, job.jobname, job.jobid, file.id);
                    expect(content).toContain("NUMBER OF RECORDS PROCESSED WAS 3");
                    break;
                }
            }
        }, LONG_TIMEOUT);
    });
});

/**********************************************/
// API methods "getJcl..." system tests
describe("Get JCL APIs", () => {
    describe("invalid request error handling", () => {
        it("should detect and surface an error for getting JCL that doesnt exist", async () => {
            const job = await SubmitJobs.submitJcl(REAL_SESSION, JCL);
            await DeleteJobs.deleteJobForJob(REAL_SESSION, job);
            await waitThreeSeconds();
            let error;
            try {
                await GetJobs.getJclForJob(REAL_SESSION, job);
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).toBeDefined();
            expect(JSON.parse(error.causeErrors).rc).toMatchSnapshot();
            expect(JSON.parse(error.causeErrors).reason).toMatchSnapshot();
            expect(JSON.parse(error.causeErrors).category).toMatchSnapshot();
            const trimmedErrorMessage = trimMessage(error.message);
            expect(trimmedErrorMessage).toContain("status 400");
            expect(trimmedErrorMessage).toContain(job.jobid);
        });
    });

    describe("download JCL", () => {
        it("should be able to get jcl from a job that was submitted", async () => {
            const job = await SubmitJobs.submitJcl(REAL_SESSION, JCL);
            const jcl = await GetJobs.getJclForJob(REAL_SESSION, job);
            expect(jcl).toContain("EXEC PGM=IEFBR14");
            expect(jcl).toContain("JOB");
        });
    });
});
