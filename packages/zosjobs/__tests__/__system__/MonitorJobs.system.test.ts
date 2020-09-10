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

import { TEST_RESOURCES_DIR } from "./../__src__/ZosJobsTestConstants";
import { DeleteJobs, GetJobs, IJob, MonitorJobs, SubmitJobs } from "../../";
import { ImperativeError, Session, TextUtils } from "@zowe/imperative";
import * as fs from "fs";
import { join } from "path";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// long running test timeout
const LONG_TIMEOUT = 100000;
const TIMEOUT_TEST_CHECK = 10000;

// Original get jobs status
const ORIG_JOBS_STATUS = GetJobs.getStatusCommon;

// Causes the job to be immediately held
const TYPE_RUN_HOLD = ",TYPRUN=HOLD";

// The jobclass
let JOBCLASS: string;
let SYSAFF: string;

// The account number for ***REMOVED***
let ACCOUNT: string;

// The session to use for the APIS
let REAL_SESSION: Session;

// The job name - should be the same for cleanup, etc.
let MONITOR_JOB_NAME: string;

// Utility function to cleanup
async function cleanTestJobs() {
    // The tests may submit jobs - we will clean every job that may have been left by failures, etc.
    const jobs: IJob[] = await GetJobs.getJobsCommon(REAL_SESSION, {owner: REAL_SESSION.ISession.user, prefix: MONITOR_JOB_NAME});
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

let defaultSystem: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment;

const trimMessage = (message: string) => {
    // don't use more than one space or tab when checking error details
    // this allows us to expect things like "reason: 6" regardless of how prettyjson aligns the text
    return message.replace(/( {2,})|\t/g, " ");
};

describe("System Tests - Monitor Jobs", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_monitor_jobs"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        ACCOUNT = defaultSystem.tso.account;
        const JOB_LENGTH = 6;
        MONITOR_JOB_NAME = REAL_SESSION.ISession.user.substr(0, JOB_LENGTH).toUpperCase() + "MJ";

        JOBCLASS = testEnvironment.systemTestProperties.zosjobs.jobclass;
        SYSAFF = testEnvironment.systemTestProperties.zosjobs.sysaff;
    });

    // Cleanup before & after each test - this will ensure that hopefully no jobs are left outstanding (or are currently
    // outstanding) when the tests run
    beforeEach(async () => {
        GetJobs.getStatusCommon = ORIG_JOBS_STATUS;
        await cleanTestJobs();
    });
    afterEach(async () => {
        GetJobs.getStatusCommon = ORIG_JOBS_STATUS;
        await cleanTestJobs();
    });

    /**********************************************/
    // API method "waitForOutputStatus" system tests
    describe("api method wait for output status", () => {

        // Single error situation - the majority are tested via the common method (which this method invokes)
        describe("invalid request error handling", () => {
            it("should detect and surface an error if the job requested is not found", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForOutputStatus(REAL_SESSION, "JOB1", "JOB123");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                // const regex: RegExp = new RegExp(fs.readFileSync(TEST_REGEX_DIR + "/not_found_job.regex").toString(), "g");
                // expect(regex.test(error.message)).toBe(true);
                const trimmedErrorMessage = trimMessage(error.message);
                expect(trimmedErrorMessage).toContain("Error obtaining status for jobname \"JOB1\" jobid \"JOB123\"");
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 10");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
                expect(trimmedErrorMessage).toContain("No job found for reference");
            });
        });

        // Single polling situation - the majority are tested via the common method (which this method invokes)
        describe("polling/transitions", () => {
            it("should detect when a job transitions from INPUT to OUTPUT", (done) => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_delay.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: TYPE_RUN_HOLD, SYSAFF});

                // submit the job
                SubmitJobs.submitJcl(REAL_SESSION, renderedJcl).then((jobInfo) => {

                    // Initial status should be input because of HELD jobclass
                    expect(jobInfo.status).toBe("INPUT");

                    // start checking the job status
                    let doneCalled: boolean = false;
                    MonitorJobs.waitForOutputStatus(REAL_SESSION, jobInfo.jobname, jobInfo.jobid).then((status) => {
                        expect(status.jobid).toEqual(jobInfo.jobid);
                        expect(status.jobname).toEqual(jobInfo.jobname);
                        expect(status.status).toBe("OUTPUT");
                        done();
                    }).catch((error) => {
                        if (!done) {
                            doneCalled = true;
                            done(`wait for status error: ${error.message}`);
                        }
                    });

                    // Change the jobclass after a period of time
                    setTimeout(() => {
                        new ZosmfRestClient(REAL_SESSION).performRest(`/zosmf/restjobs/jobs/${jobInfo.jobname}/${jobInfo.jobid}`,
                            "PUT", [{"Content-Type": "application/json"}], {
                                request: "release",
                                version: "2.0"
                            }).then((response) => {
                            // Nothing to do here
                        }).catch((releaseErr) => {
                            if (!done) {
                                doneCalled = true;
                                done(`Release error: ${releaseErr.message}`);
                            }
                        });
                    }, TIMEOUT_TEST_CHECK);

                }).catch((submitErr) => {
                    done(`Job submission error: ${submitErr.message}`);
                });
            }, LONG_TIMEOUT);
        });
    });

    /**********************************************/
    // API method "waitForJobOutputStatus" system tests
    describe("api method wait for job output status", () => {

        // Single error situation - the majority are tested via the common method (which this method invokes)
        describe("invalid request error handling", () => {
            it("should detect and surface an error if the job requested is not found", async () => {
                let error;
                try {
                    const params: any = {jobname: "JOB1", jobid: "JOB123"};
                    const response = await MonitorJobs.waitForJobOutputStatus(REAL_SESSION, params);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                // const regex: RegExp = new RegExp(fs.readFileSync(TEST_REGEX_DIR + "/not_found_job.regex").toString(), "g");
                // expect(regex.test(error.message)).toBe(true);
                const trimmedErrorMessage = trimMessage(error.message);
                expect(trimmedErrorMessage).toContain("Error obtaining status for jobname \"JOB1\" jobid \"JOB123\"");
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 10");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
                expect(trimmedErrorMessage).toContain("No job found for reference");
            });
        });

        // Single polling situation - the majority are tested via the common method (which this method invokes)
        describe("polling/transitions", () => {
            it("should detect when the job submitted transitions from INPUT to OUTPUT", (done) => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_delay.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: TYPE_RUN_HOLD, SYSAFF});

                // submit the job
                SubmitJobs.submitJcl(REAL_SESSION, renderedJcl).then((jobInfo) => {

                    // Initial status should be input because of HELD jobclass
                    expect(jobInfo.status).toBe("INPUT");

                    // start checking the job status
                    let doneCalled: boolean = false;
                    MonitorJobs.waitForJobOutputStatus(REAL_SESSION, jobInfo).then((status) => {
                        expect(status.jobid).toEqual(jobInfo.jobid);
                        expect(status.jobname).toEqual(jobInfo.jobname);
                        expect(status.status).toBe("OUTPUT");
                        done();
                    }).catch((error) => {
                        if (!done) {
                            doneCalled = true;
                            done(`wait for status error: ${error.message}`);
                        }
                    });

                    // Release the job
                    setTimeout(() => {
                        new ZosmfRestClient(REAL_SESSION).performRest(`/zosmf/restjobs/jobs/${jobInfo.jobname}/${jobInfo.jobid}`,
                            "PUT", [{"Content-Type": "application/json"}], {
                                request: "release",
                                version: "2.0"
                            }).then((response) => {
                            // Nothing to do here
                        }).catch((releaseErr) => {
                            if (!done) {
                                doneCalled = true;
                                done(`Release error: ${releaseErr.message}`);
                            }
                        });
                    }, TIMEOUT_TEST_CHECK);

                }).catch((submitErr) => {
                    done(`Job submission error: ${submitErr.message}`);
                });
            }, LONG_TIMEOUT);
        });
    });

    /**********************************************/
    // API method "waitForStatusCommon" system tests
    describe("api method wait for output status common", () => {

        // All error situations/scenarios - negative system
        describe("invalid request error handling", () => {
            it("should detect and surface an error message if an invalid jobname is specified", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForStatusCommon(REAL_SESSION, {jobid: "JOB123", jobname: "((((("});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                // const regex: RegExp = new RegExp(fs.readFileSync(TEST_REGEX_DIR + "/invalid_jobname.regex").toString(), "g");
                // expect(regex.test(error.message)).toBe(true);
                const trimmedErrorMessage = trimMessage(error.message);
                expect(trimmedErrorMessage).toContain("Error obtaining status for jobname \"(((((\" jobid \"JOB123\"");
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 7");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
                expect(trimmedErrorMessage).toContain("No match for method GET and pathInfo");
            });

            it("should detect and surface an error message if an invalid jobid is specified", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForStatusCommon(REAL_SESSION, {jobid: "(", jobname: "JOB1"});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                // const regex: RegExp = new RegExp(fs.readFileSync(TEST_REGEX_DIR + "/invalid_jobid.regex").toString(), "g");
                // expect(regex.test(error.message)).toBe(true);
                const trimmedErrorMessage = trimMessage(error.message);
                expect(trimmedErrorMessage).toContain("Error obtaining status for jobname \"JOB1\" jobid \"(\"");
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 7");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
                expect(trimmedErrorMessage).toContain("No match for method GET and pathInfo");
            });

            it("should detect and surface an error if the job requested is not found", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForStatusCommon(REAL_SESSION, {jobid: "JOB123", jobname: "JOB1"});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                // const regex: RegExp = new RegExp(fs.readFileSync(TEST_REGEX_DIR + "/not_found_job.regex").toString(), "g");
                // expect(regex.test(error.message)).toBe(true);
                const trimmedErrorMessage = trimMessage(error.message);
                expect(trimmedErrorMessage).toContain("Error obtaining status for jobname \"JOB1\" jobid \"JOB123\"");
                expect(trimmedErrorMessage).toContain("category: 6");
                expect(trimmedErrorMessage).toContain("reason: 10");
                expect(trimmedErrorMessage).toContain("rc: 4");
                expect(trimmedErrorMessage).toContain("status 400");
                expect(trimmedErrorMessage).toContain("No job found for reference");
            });
        });

        // Tests that do not initiate polling - should return immediately from a request
        describe("initial status checks", () => {
            it("should detect that a job is in INPUT status", async () => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: TYPE_RUN_HOLD, SYSAFF});

                // submit the job
                const jobInfo = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);
                expect(jobInfo.status).toBe("INPUT");

                // "Mock" the function - which just invokes the actual function
                const mockedGetJobs = jest.fn(async (session, parms) => {
                    return ORIG_JOBS_STATUS(session, parms);
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                // check that the status is input
                const status = await MonitorJobs.waitForStatusCommon(REAL_SESSION,
                    {
                        jobname: jobInfo.jobname,
                        jobid: jobInfo.jobid,
                        status: "INPUT"
                    });

                // verify that the status and info is correct
                expect(status.jobid).toEqual(jobInfo.jobid);
                expect(status.jobname).toEqual(jobInfo.jobname);
                expect(status.status).toBe("INPUT");
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should detect that a job is in ACTIVE status", async () => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_forever_loop.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // submit the job
                const jobInfo = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

                // Wait for the job to become active indefinitely - jest timeout will occur eventually
                let jobCheck: IJob;
                do {
                    jobCheck = await GetJobs.getStatusCommon(REAL_SESSION, {jobname: jobInfo.jobname, jobid: jobInfo.jobid});
                } while (jobCheck.status !== "ACTIVE");

                // "Mock" the function - which just invokes the actual function
                const mockedGetJobs = jest.fn(async (session, parms) => {
                    return ORIG_JOBS_STATUS(session, parms);
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                // check that the status is active
                const status = await MonitorJobs.waitForStatusCommon(REAL_SESSION,
                    {
                        jobname: jobInfo.jobname,
                        jobid: jobInfo.jobid,
                        status: "ACTIVE"
                    });

                // verify that the status and info is correct
                expect(status.jobid).toEqual(jobInfo.jobid);
                expect(status.jobname).toEqual(jobInfo.jobname);
                expect(status.status).toBe("ACTIVE");
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            }, LONG_TIMEOUT);

            it("should detect that a job is in OUTPUT status", async () => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/iefbr14.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // submit the job
                const jobInfo = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

                // Wait for the job to become active indefinitely - jest timeout will occur eventually
                let jobCheck: IJob;
                do {
                    jobCheck = await GetJobs.getStatusCommon(REAL_SESSION, {jobname: jobInfo.jobname, jobid: jobInfo.jobid});
                } while (jobCheck.status !== "OUTPUT");

                // "Mock" the function - which just invokes the actual function
                const mockedGetJobs = jest.fn(async (session, parms) => {
                    return ORIG_JOBS_STATUS(session, parms);
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                // check that the status is output
                const status = await MonitorJobs.waitForStatusCommon(REAL_SESSION,
                    {
                        jobname: jobInfo.jobname,
                        jobid: jobInfo.jobid,
                        status: "OUTPUT"
                    });

                // verify that the status and info is correct
                expect(status.jobid).toEqual(jobInfo.jobid);
                expect(status.jobname).toEqual(jobInfo.jobname);
                expect(status.status).toBe("OUTPUT");
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            }, LONG_TIMEOUT);
        });

        // All tests that perform polling, etc to eventually obtain the status
        describe("polling/transitions", () => {

            it("should detect and surface an error if the job is purged/deleted while waiting for status", (done) => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_forever_loop.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // "Mock" the function - which just invokes the actual function
                const mockedGetJobs = jest.fn(async (session, parms) => {
                    return ORIG_JOBS_STATUS(session, parms);
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                // submit the job
                SubmitJobs.submitJcl(REAL_SESSION, renderedJcl).then((jobInfo) => {

                    // start checking the job status
                    let doneCalled: boolean = false;
                    MonitorJobs.waitForStatusCommon(REAL_SESSION, {
                        jobname: jobInfo.jobname, jobid: jobInfo.jobid, status: "OUTPUT"
                    }).then((status) => {
                        if (!doneCalled) {
                            doneCalled = true;
                            done(`Error - we should not have received a status of OUTPUT`);
                        }
                    }).catch((error) => {
                        // const regex: RegExp = new RegExp(fs.readFileSync(TEST_REGEX_DIR + "/polling_job_deleted.regex").toString(), "g");
                        // expect(regex.test(error.message)).toBe(true);
                        const trimmedErrorMessage = trimMessage(error.message);
                        expect(trimmedErrorMessage).toContain("Error obtaining status for jobname");
                        expect(trimmedErrorMessage).toContain("category: 6");
                        expect(trimmedErrorMessage).toContain("reason: 10");
                        expect(trimmedErrorMessage).toContain("rc: 4");
                        expect(trimmedErrorMessage).toContain("status 400");
                        expect(trimmedErrorMessage).toContain("No job found for reference");
                        if (!doneCalled) {
                            doneCalled = true;
                            done();
                        }
                    });

                    // Cancel and purge the job after a period of time
                    setTimeout(() => {
                        DeleteJobs.deleteJob(REAL_SESSION, jobInfo.jobname, jobInfo.jobid).catch((error) => {
                            if (!doneCalled) {
                                doneCalled = true;
                                done(`Error deleting the job: ${error.message}`);
                            }
                        });
                    }, TIMEOUT_TEST_CHECK);

                }).catch((submitErr) => {
                    done(`Job submission error: ${submitErr.message}`);
                });
            }, LONG_TIMEOUT);

            it("should detect and surface an error if the max poll attempts are exceeded", (done) => {
                // Attempts
                const ATTEMPTS = 3;

                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_forever_loop.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // "Mock" the function - which just invokes the actual function
                const mockedGetJobs = jest.fn(async (session, parms) => {
                    return ORIG_JOBS_STATUS(session, parms);
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                // submit the job
                SubmitJobs.submitJcl(REAL_SESSION, renderedJcl).then((jobInfo) => {

                    // start checking the job status
                    MonitorJobs.waitForStatusCommon(REAL_SESSION, {
                        jobname: jobInfo.jobname, jobid: jobInfo.jobid, status: "OUTPUT", attempts: ATTEMPTS
                    }).then((status) => {
                        done(`Error - we should not have received a status of OUTPUT`);
                    }).catch((error) => {
                        expect(error instanceof ImperativeError).toBe(true);
                        expect(error.message).toContain("Error obtaining status for jobname");
                        expect(error.message).toContain("Error Details: Reached max poll attempts of \"3\"");
                        expect(mockedGetJobs).toHaveBeenCalledTimes(ATTEMPTS);
                        done();
                    });

                }).catch((submitErr) => {
                    done(`Job submission error: ${submitErr.message}`);
                });
            }, LONG_TIMEOUT);

            it("should detect when a job transitions from INPUT to ACTIVE", (done) => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_forever_loop.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: TYPE_RUN_HOLD, SYSAFF});

                // submit the job
                SubmitJobs.submitJcl(REAL_SESSION, renderedJcl).then((jobInfo) => {

                    // Initial status should be input because of HELD jobclass
                    expect(jobInfo.status).toBe("INPUT");

                    // start checking the job status
                    let doneCalled: boolean = false;
                    MonitorJobs.waitForStatusCommon(REAL_SESSION, {
                        jobname: jobInfo.jobname, jobid: jobInfo.jobid, status: "ACTIVE"
                    }).then((status) => {
                        expect(status.jobid).toEqual(jobInfo.jobid);
                        expect(status.jobname).toEqual(jobInfo.jobname);
                        expect(status.status).toBe("ACTIVE");
                        done();
                    }).catch((error) => {
                        if (!done) {
                            doneCalled = true;
                            done(`wait for status error: ${error.message}`);
                        }
                    });

                    // Change the jobclass after a period of time
                    setTimeout(() => {
                        new ZosmfRestClient(REAL_SESSION).performRest(`/zosmf/restjobs/jobs/${jobInfo.jobname}/${jobInfo.jobid}`,
                            "PUT", [{"Content-Type": "application/json"}], {
                                request: "release",
                                version: "2.0"
                            }).then((response) => {
                            // Nothing to do here
                        }).catch((releaseErr) => {
                            if (!done) {
                                doneCalled = true;
                                done(`Release error: ${releaseErr.message}`);
                            }
                        });
                    }, TIMEOUT_TEST_CHECK);

                }).catch((submitErr) => {
                    done(`Job submission error: ${submitErr.message}`);
                });
            }, LONG_TIMEOUT);

            it("should detect when a job transitions from INPUT to OUTPUT", (done) => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_delay.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: TYPE_RUN_HOLD, SYSAFF});

                // submit the job
                SubmitJobs.submitJcl(REAL_SESSION, renderedJcl).then((jobInfo) => {

                    // Initial status should be input because of HELD jobclass
                    expect(jobInfo.status).toBe("INPUT");

                    // start checking the job status
                    let doneCalled: boolean = false;
                    MonitorJobs.waitForStatusCommon(REAL_SESSION, {
                        jobname: jobInfo.jobname, jobid: jobInfo.jobid, status: "OUTPUT"
                    }).then((status) => {
                        expect(status.jobid).toEqual(jobInfo.jobid);
                        expect(status.jobname).toEqual(jobInfo.jobname);
                        expect(status.status).toBe("OUTPUT");
                        done();
                    }).catch((error) => {
                        if (!done) {
                            doneCalled = true;
                            done(`wait for status error: ${error.message}`);
                        }
                    });

                    // Change the jobclass after a period of time
                    setTimeout(() => {
                        new ZosmfRestClient(REAL_SESSION).performRest(`/zosmf/restjobs/jobs/${jobInfo.jobname}/${jobInfo.jobid}`,
                            "PUT", [{"Content-Type": "application/json"}], {
                                request: "release",
                                version: "2.0"
                            }).then((response) => {
                            // Nothing to do here
                        }).catch((releaseErr) => {
                            if (!done) {
                                doneCalled = true;
                                done(`Release error: ${releaseErr.message}`);
                            }
                        });
                    }, TIMEOUT_TEST_CHECK);

                }).catch((submitErr) => {
                    done(`Job submission error: ${submitErr.message}`);
                });
            }, LONG_TIMEOUT);

            it("should detect when a job transitions from INPUT to ACTIVE to OUTPUT", (done) => {
                // Construct the JCL
                const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/instream_rexx_delay.jcl")).toString();
                const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                    {JOBNAME: MONITOR_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

                // submit the job
                SubmitJobs.submitJcl(REAL_SESSION, renderedJcl).then((jobInfo) => {

                    // Wait for the status to be active
                    MonitorJobs.waitForStatusCommon(REAL_SESSION, {
                        jobname: jobInfo.jobname, jobid: jobInfo.jobid, status: "ACTIVE"
                    }).then((status) => {
                        expect(status.jobid).toEqual(jobInfo.jobid);
                        expect(status.jobname).toEqual(jobInfo.jobname);
                        expect(status.status).toBe("ACTIVE");

                        // Wait for the status to be output
                        MonitorJobs.waitForStatusCommon(REAL_SESSION, {
                            jobname: jobInfo.jobname, jobid: jobInfo.jobid, status: "OUTPUT"
                        }).then((nextStatus) => {
                            expect(nextStatus.jobid).toEqual(jobInfo.jobid);
                            expect(nextStatus.jobname).toEqual(jobInfo.jobname);
                            expect(nextStatus.status).toBe("OUTPUT");
                            done();
                        }).catch((error) => {
                            done(`wait for status error: ${error.message}`);
                        });
                    }).catch((error) => {
                        done(`wait for status error: ${error.message}`);
                    });
                }).catch((submitErr) => {
                    done(`Job submission error: ${submitErr.message}`);
                });
            }, LONG_TIMEOUT);
        });
    });
});
