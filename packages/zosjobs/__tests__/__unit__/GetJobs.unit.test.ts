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

import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { AbstractSession, ImperativeError, NextVerFeatures, ProcessUtils, Session } from "@zowe/imperative";
import { GetJobs } from "../../src";
import { GetJobsData } from "../__resources__/api/GetJobsData";

const pretendSession = new Session({user: "test", password: "test", hostname: "Test"});

function mockGetJobsJSONData(data: object) {
    const mock = jest.fn((session: AbstractSession, resource: string, headers?: any[]): Promise<object> => {
        return new Promise<object>((resolve, reject) => {
            ProcessUtils.nextTick(() => {
                resolve(data);
            });
        });
    });
    return mock;
}

function mockGetJobsStringData(data: string) {
    const mock = jest.fn((session: AbstractSession, resource: string, headers?: any[]): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            ProcessUtils.nextTick(() => {
                resolve(data);
            });
        });
    });
    return mock;
}

// this mock only tests API rejection of promises by ZosmfRestClient
function mockGetJobsServerError(errorCode: string, causeErrors: string) {
    const mock = jest.fn((session: AbstractSession, resource: string, headers?: any[]): Promise<object> => {
        return new Promise((resolve, reject) => {
            ProcessUtils.nextTick(() => {
                reject(new ImperativeError({
                    msg: "Rest API failure with HTTP(S) status " + errorCode,
                    causeErrors,
                    additionalDetails:
                    "Resource: " + resource +
                    "Request: " + "GET" +
                    "Headers: " + JSON.stringify(headers) +
                    "Payload: " + undefined,
                    errorCode
                }));
            });
        });
    });
    return mock;
}

describe("GetJobs tests", () => {

    beforeEach(() => {
        /* This avoids having to mock ImperativeConfig.envVariablePrefix.
         * Unless overridden, tests will use our legacy format for errors.
         */
        jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(false);
    });

    describe("getStatus APIs", () => {

        it("should reject the promise when the server gets an error http code", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsServerError("500", JSON.stringify(GetJobsData.WRONG_JOBS_URI));
            let error;
            try {
                const job = await GetJobs.getStatusCommon(pretendSession, {jobname: "testjob", jobid: "fakeid"});
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toMatchSnapshot();
            expect(error.causeErrors).toMatchSnapshot();
        });

        // eslint-disable-next-line jest/no-done-callback
        it("should get an error for missing jobname on getStatus when using callbacks", (done) => {
            let error;
            try {
                GetJobs.getStatus(pretendSession, undefined, "JOB015123").catch((err) => {
                    expect(err instanceof ImperativeError).toBe(true);
                    expect(err.message).toMatchSnapshot();
                    done();
                });
            } catch (thrownError) {
                error = thrownError;
            }
            // this error should not occur (that is, not error should occur that ".catch" does not catch)
            expect(error).toBeUndefined();
        });

        it("should get an error for missing jobname on getStatus", async () => {
            let error;
            try {
                const job = await GetJobs.getStatus(pretendSession, undefined, "JOB015123");
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toMatchSnapshot();
        });

        it("should get an error for missing jobname on getStatusCommon", async () => {
            let error;
            try {
                const job = await GetJobs.getStatusCommon(pretendSession, {jobname: undefined, jobid: "JOB015123"});
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toMatchSnapshot();
        });

        it("should get an error for missing jobid on getStatus", async () => {
            let error;
            try {
                const job = await GetJobs.getStatus(pretendSession, "testjob", " ");
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toMatchSnapshot();
        });

        it("should get an error for missing jobid on getStatusCommon", async () => {
            let error;
            try {
                const job = await GetJobs.getStatusCommon(pretendSession, {jobname: "testjob", jobid: " "});
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toMatchSnapshot();
        });

        it("should get a job via getStatus and getStatusCommon", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData(GetJobsData.SAMPLE_COMPLETE_JOB);

            const job = await GetJobs.getStatus(pretendSession, "testjob", "JOB015123");
            const jobCommon = await GetJobs.getStatusCommon(pretendSession, {jobname: "testjob", jobid: "JOB015123"});
            expect(job).toMatchSnapshot();
            expect(jobCommon).toMatchSnapshot();
        });

    });

    describe("getJobs APIs", () => {
        // eslint-disable-next-line jest/no-done-callback
        it("should reject promise if a session isn't provided", (done) => {
            let error;
            try {
                GetJobs.getJobs(undefined).catch((err) => {
                    expect(err instanceof ImperativeError).toBe(true);
                    expect(err.message).toMatchSnapshot();
                    done();
                });
            } catch (thrownError) {
                error = thrownError;
            }
            // this error should not occur (that is, not error should occur that ".catch" does not catch)
            expect(error).toBeUndefined();
        });

        it("should get a list of jobs from getJobs and getJobsCommon", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);

            const jobs = await GetJobs.getJobs(pretendSession);
            const jobCommon = await GetJobs.getJobsCommon(pretendSession);
            expect(jobs).toMatchSnapshot();
            expect(jobCommon).toMatchSnapshot();
        });

        it("should require prefix for getJobsByPrefix", async () => {
            let error;
            try {
                const job = await GetJobs.getJobsByPrefix(pretendSession, "    ");
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toMatchSnapshot();
        });

        it("should get jobs by prefix", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);

            const jobs = await GetJobs.getJobsByPrefix(pretendSession, "makeBelievePrefix");
            expect(jobs).toMatchSnapshot();
        });

        it("should require owner for getJobsByOwner", async () => {
            let error;
            try {
                const job = await GetJobs.getJobsByOwner(pretendSession, "    ");
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toMatchSnapshot();
        });

        it("should locate a job by jobid", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB]);
            const job = await GetJobs.getJob(pretendSession, GetJobsData.SAMPLE_COMPLETE_JOB.jobid);
            expect(job).toBeDefined();
            expect(job).toMatchSnapshot();
        });

        it("should throw an error if more than one job is returned for a job id", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);
            let err: Error | ImperativeError;
            try {
                await GetJobs.getJob(pretendSession, GetJobsData.SAMPLE_COMPLETE_JOB.jobid);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toMatchSnapshot();
        });

        it("should throw an error if more than one job is returned for a job id using V3_ERR_FORMAT", async () => {
            jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(true);
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);
            let err: Error | ImperativeError;
            try {
                await GetJobs.getJob(pretendSession, GetJobsData.SAMPLE_COMPLETE_JOB.jobid);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("Cannot obtain job info for job id = TSUxxx");
            expect((err as any).mDetails.causeErrors).toContain("2 jobs were returned. Only expected 1.");
            expect((err as any).mDetails.additionalDetails).toContain("Protocol:          https");
            expect((err as any).mDetails.additionalDetails).toContain("Host:              Test");
            expect((err as any).mDetails.additionalDetails).toContain("Port:              443");
        });

        it("should throw an error if zero jobs are returned when getting jobs by ID", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([]);
            let err: Error | ImperativeError;
            try {
                await GetJobs.getJob(pretendSession, GetJobsData.SAMPLE_COMPLETE_JOB.jobid);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toMatchSnapshot();
        });

        it("should throw an error if zero jobs are returned when getting jobs by ID using V3_ERR_FORMAT", async () => {
            jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(true);
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([]);
            let err: Error | ImperativeError;
            try {
                await GetJobs.getJob(pretendSession, GetJobsData.SAMPLE_COMPLETE_JOB.jobid);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("Cannot obtain job info for job id = TSUxxx");
            expect((err as any).mDetails.causeErrors).toContain("Zero jobs were returned.");
            expect((err as any).mDetails.additionalDetails).toContain("Protocol:          https");
            expect((err as any).mDetails.additionalDetails).toContain("Host:              Test");
            expect((err as any).mDetails.additionalDetails).toContain("Port:              443");
        });

        it("should get jobs by owner", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);

            const jobs = await GetJobs.getJobsByOwner(pretendSession, "makeBelieveOwner");
            expect(jobs).toMatchSnapshot();
        });

        it("should require owner for getJobsByOwnerAndPrefix", async () => {
            let error;
            try {
                const job = await GetJobs.getJobsByOwnerAndPrefix(pretendSession, "    ", "fakePrefix");
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toMatchSnapshot();
        });

        it("should require prefix for getJobsByOwnerAndPrefix", async () => {
            let error;
            try {
                const job = await GetJobs.getJobsByOwnerAndPrefix(pretendSession, "fakeOwner", undefined);
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toMatchSnapshot();
        });

        it("should get jobs by owner and prefix", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);

            const jobs = await GetJobs.getJobsByOwnerAndPrefix(pretendSession, "fakeOwner", "fakePrefix");
            expect(jobs).toMatchSnapshot();
        });

        it("should allow getting jobs by common method with max jobs", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);
            const jobs = await GetJobs.getJobsCommon(pretendSession, {maxJobs: 2});
            expect(jobs).toMatchSnapshot();
        });

        it("should allow getting jobs by common method with status", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);
            const jobs = await GetJobs.getJobsCommon(pretendSession, {status: 'active'});
            expect(jobs).toMatchSnapshot();
        });

        it("should have proper URI when using status", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsCommon(pretendSession, {status: "active"});
        });

        it("should have proper URI when using no parms", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsCommon(pretendSession, {});
        });

        it("should have proper URI when using prefix", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsCommon(pretendSession, {prefix: "fakePrefix"});
        });

        it("should have proper URI when using owner", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsCommon(pretendSession, {owner: "fakeOwner"});
        });

        it("should have proper URI when using maxjobs", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsCommon(pretendSession, {maxJobs: 10});
        });

        it("should have proper URI when using jobid", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsCommon(pretendSession, {jobid: "fakeJobid"});
        });

        it("should have proper URI when using jobname and jobid", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsByOwnerAndPrefix(pretendSession, "someOwner", "somePrefix");
        });

        it("should have proper URI when using jobname, prefix, and jobid", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsCommon(pretendSession, {jobid: "fakeJobid", prefix: "somePrefix", owner: "someOwner"});
        });

        it("should have proper URI when using all parms", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJobsCommon(pretendSession, {owner: "fakeOwner", prefix: "fakePrefix", maxJobs: 2, jobid: "fakeID"});
        });

        it("should get a list of jobs from getJobsCommon with their execution data", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);

            const jobCommon = await GetJobs.getJobsCommon(pretendSession, {execData: true});
            expect(jobCommon).toMatchSnapshot();
        });

        it("should get a list of jobs from getJobsCommon with their execution data with maxJobs param", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);

            const jobCommon = await GetJobs.getJobsCommon(pretendSession, {maxJobs: 2, execData: true});
            expect(jobCommon).toMatchSnapshot();
        });

        it("should get a list of jobs from getJobsCommon with their execution data with owner and maxJobs params", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);

            const jobCommon = await GetJobs.getJobsCommon(pretendSession, {owner: "someOwner", maxJobs: 2, execData: true});
            expect(jobCommon).toMatchSnapshot();
        });

        it("should get a list of jobs from getJobsCommon with their execution data with multiple other params", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);

            const jobCommon = await GetJobs.getJobsCommon(pretendSession, {owner: "someOwner", prefix: "fakePrefix", maxJobs: 2, execData: true});
            expect(jobCommon).toMatchSnapshot();
        });
    });

    describe("getJcl APIs", () => {
        it("should have proper URI when getting JCL", () => {
            (ZosmfRestClient.getExpectString as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getJcl(pretendSession, "fakeJob", "fakeId");
        });

        // eslint-disable-next-line jest/no-done-callback
        it("should error for missing jobname in callback scheme for jcl", (done) => {
            let error;
            try {
                GetJobs.getJcl(pretendSession, " ", "dummy").catch((err) => {
                    expect(err instanceof ImperativeError).toBe(true);
                    expect(err.message).toMatchSnapshot();
                    done();
                });
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).toBeUndefined();
        });

        it("should be able to get JCL", async () => {
            (ZosmfRestClient.getExpectString as any) = mockGetJobsStringData(GetJobsData.SAMPLE_IEFBR14_JCL);

            const jcl = await GetJobs.getJcl(pretendSession, "jobname", "jobid");
            const jclForJob = await GetJobs.getJclForJob(pretendSession, GetJobsData.SAMPLE_COMPLETE_JOB);
            const jclCommon = await GetJobs.getJclCommon(pretendSession, {jobname: "jobname", jobid: "jobid"});
            expect(jcl).toMatchSnapshot();
            expect(jclForJob).toMatchSnapshot();
            expect(jclCommon).toMatchSnapshot();
        });
    });

    describe("getSpoolFiles APIs", () => {
        it("should have proper URI when getting spool files", () => {
            (ZosmfRestClient.getExpectJSON as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getSpoolFiles(pretendSession, "fakeJob", "fakeId");
        });

        // eslint-disable-next-line jest/no-done-callback
        it("should error for missing jobname in callback scheme for spool files", (done) => {
            let error;
            try {
                GetJobs.getSpoolFiles(pretendSession, " ", "dummy").catch((err) => {
                    expect(err instanceof ImperativeError).toBe(true);
                    expect(err.message).toMatchSnapshot();
                    done();
                });
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).toBeUndefined();
        });

        it("should be able to get spool files", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData(GetJobsData.SAMPLE_SPOOL_FILES);

            const spoolFiles = await GetJobs.getSpoolFiles(pretendSession, "jobname", "jobid");
            const spoolFilesForJob = await GetJobs.getSpoolFilesForJob(pretendSession, GetJobsData.SAMPLE_COMPLETE_JOB);
            const spoolFilesCommon = await GetJobs.getSpoolFilesCommon(pretendSession, {jobname: "jobname", jobid: "jobid"});
            expect(spoolFiles).toMatchSnapshot();
            expect(spoolFilesForJob).toMatchSnapshot();
            expect(spoolFilesCommon).toMatchSnapshot();
        });
    });

    describe("getSpoolContent APIs", () => {
        it("should have proper URI when getting spool content", () => {
            (ZosmfRestClient.getExpectString as any) =
                jest.fn((session: AbstractSession, resource: string, headers?: any[]) => {
                    expect(resource).toMatchSnapshot();
                });
            GetJobs.getSpoolContent(pretendSession, GetJobsData.SAMPLE_JOB_FILE);
        });

        // eslint-disable-next-line jest/no-done-callback
        it("should error for missing jobname in callback scheme for spool content", (done) => {
            let error;
            try {
                GetJobs.getSpoolContent(pretendSession, undefined).catch((err) => {
                    expect(err instanceof ImperativeError).toBe(true);
                    expect(err.message).toMatchSnapshot();
                    done();
                });
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error).toBeUndefined();
        });

        it("should be able to get spool content", async () => {
            (ZosmfRestClient.getExpectString as any) = mockGetJobsStringData(GetJobsData.SAMPLE_JES_MSG_LG);

            const content = await GetJobs.getSpoolContent(pretendSession, GetJobsData.SAMPLE_JOB_FILE);
            const contentCommon = await GetJobs.getSpoolContentCommon(pretendSession, GetJobsData.SAMPLE_JOB_FILE);
            expect(content).toMatchSnapshot();
            expect(contentCommon).toMatchSnapshot();
        });

        it("should be able to get spool content with encoding", async () => {
            (ZosmfRestClient.getExpectString as any) = mockGetJobsStringData(GetJobsData.SAMPLE_JES_MSG_LG);
            const encoding = "IBM-037";

            const content = await GetJobs.getSpoolContent(pretendSession, GetJobsData.SAMPLE_JOB_FILE, encoding);
            const contentCommon = await GetJobs.getSpoolContentCommon(pretendSession, GetJobsData.SAMPLE_JOB_FILE, encoding);
            expect(content).toMatchSnapshot();
            expect(contentCommon).toMatchSnapshot();
        });

        it("should be able to get spool content with empty encoding", async () => {
            (ZosmfRestClient.getExpectString as any) = mockGetJobsStringData(GetJobsData.SAMPLE_JES_MSG_LG);
            const encoding = "       ";

            const content = await GetJobs.getSpoolContent(pretendSession, GetJobsData.SAMPLE_JOB_FILE, encoding);
            const contentCommon = await GetJobs.getSpoolContentCommon(pretendSession, GetJobsData.SAMPLE_JOB_FILE, encoding);
            expect(content).toMatchSnapshot();
            expect(contentCommon).toMatchSnapshot();
        });

        it("should return spool content from getSpoolContentById if z/OSMF response is mocked", async () => {
            (ZosmfRestClient.getExpectString as any) = mockGetJobsStringData(GetJobsData.SAMPLE_JES_MSG_LG);
            const content = await GetJobs.getSpoolContentById(pretendSession, "MYJOB1", "JOB0123", 1);
            expect(content).toEqual(GetJobsData.SAMPLE_JES_MSG_LG);
        });

        it("should return spool content from getSpoolContentById with encoding if z/OSMF response is mocked", async () => {
            (ZosmfRestClient.getExpectString as any) = mockGetJobsStringData(GetJobsData.SAMPLE_JES_MSG_LG);
            const content = await GetJobs.getSpoolContentById(pretendSession, "MYJOB1", "JOB0123", 1, "IBM-037");
            expect(content).toEqual(GetJobsData.SAMPLE_JES_MSG_LG);
        });

        it("should error if spoolID is omitted from getSpoolContentById", async () => {
            let err: Error;
            try {
                await GetJobs.getSpoolContentById(pretendSession, "MYJOB1", "JOB0123", undefined);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("spoolId");
        });

        it("should error if jobname is omitted from getSpoolContentById", async () => {
            let err: Error;
            try {
                await GetJobs.getSpoolContentById(pretendSession, undefined, "JOB0123", 1);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("job");
            expect(err.message).toContain("name");
        });


        it("should error if jobid is omitted from getSpoolContentById", async () => {
            let err: Error;
            try {
                await GetJobs.getSpoolContentById(pretendSession, "MYJOB1", undefined, 1);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobid");
        });
    });

    describe("getJobsByParameters", () => {
        it("should get jobs even when no params are passed in", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);
            const jobs = await GetJobs.getJobsByParameters(pretendSession, {});
            expect(jobs).toMatchSnapshot();
        });
        it("should get jobs when any of the valid parameters are passed in", async () => {
            (ZosmfRestClient.getExpectJSON as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);
            const jobs = await GetJobs.getJobsByParameters(pretendSession, { status: 'active', owner: '*'});
            expect(jobs).toMatchSnapshot();
        });
    });

    describe("filterResultsByStatuses", () => {
        it("should return all results if status is active", () => {
            const jobs: any[] = [
                {
                    jobid: '1', status: 'active'
                },
                {
                    jobid: '2', status: 'active'
                },
                {
                    jobid: '3',  status: 'active'
                }
            ];
            const filteredResults = GetJobs['filterResultsByStatuses'](jobs, { status: 'active' });
            expect(filteredResults).toEqual(jobs);
        });
        it("should return only Output", () => {
            const jobs = [
                {
                    jobid: '1', jobname: 'a', subsystem: 'sub',
                    owner: 'zowe', status: 'active', type: 't',
                    class: 'c', retcode: 'r', url: '',
                    'files-url': '', 'job-correlator': '',
                    phase: 1, 'phase-name': 'name', 'reason-not-running': 'no'
                },
                {
                    jobid: '2', jobname: 'b', subsystem: 'sub',
                    owner: 'zowe', status: 'Output', type: 't',
                    class: 'c', retcode: 'r', url: '',
                    'files-url': '', 'job-correlator': '',
                    phase: 1, 'phase-name': 'name', 'reason-not-running': 'no'
                },
                {
                    jobid: '3', jobname: 'c', subsystem: 'sub',
                    owner: 'kri', status: 'Output', type: 't',
                    class: 'c', retcode: 'r', url: '',
                    'files-url': '', 'job-correlator': '',
                    phase: 1, 'phase-name': 'name', 'reason-not-running': 'no'
                }
            ];
            const expectedJobs = [
                {
                    jobid: '2', jobname: 'b', subsystem: 'sub',
                    owner: 'zowe', status: 'Output', type: 't',
                    class: 'c', retcode: 'r', url: '',
                    'files-url': '', 'job-correlator': '',
                    phase: 1, 'phase-name': 'name', 'reason-not-running': 'no'
                },
                {
                    jobid: '3', jobname: 'c', subsystem: 'sub',
                    owner: 'kri', status: 'Output', type: 't',
                    class: 'c', retcode: 'r', url: '',
                    'files-url': '', 'job-correlator': '',
                    phase: 1, 'phase-name': 'name', 'reason-not-running': 'no'
                }
            ];
            const filteredResults = GetJobs['filterResultsByStatuses'](jobs, { status: 'OUTPUT', owner: 'zowe' });
            expect(filteredResults).toEqual(expectedJobs);
        });
        it("should return all status jobs for status *", () => {
            const jobs: any[] = [
                {
                    jobid: '1', status: 'active'
                },
                {
                    jobid: '2', status: 'Output'
                },
                {
                    jobid: '3', status: 'Input'
                }
            ];
            const filteredResults = GetJobs['filterResultsByStatuses'](jobs, { status: '*' });
            expect(filteredResults).toEqual(jobs);
        });
        it("should return all jobs if parameters are missing", () => {
            const jobs: any[] = [
                {
                    jobid: '1', status: 'active'
                },
                {
                    jobid: '2', status: 'Output'
                },
                {
                    jobid: '3', status: 'Input'
                }
            ];
            const filteredResults = GetJobs['filterResultsByStatuses'](jobs, undefined);
            expect(filteredResults).toEqual(jobs);
        });
        it("should return all jobs if status in params is missing", () => {
            const jobs: any[] = [
                {
                    jobid: '1', status: 'active'
                },
                {
                    jobid: '2', status: 'Output'
                },
                {
                    jobid: '3', status: 'Input'
                }
            ];
            const filteredResults = GetJobs['filterResultsByStatuses'](jobs, { owner: 'zowe'});
            expect(filteredResults).toEqual(jobs);
        });
    });
});
