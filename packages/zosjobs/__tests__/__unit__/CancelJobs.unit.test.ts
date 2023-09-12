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
import { ImperativeError } from "@zowe/imperative";
import { CancelJobs, IJob } from "../../src";
import { CancelJobsData } from "../__resources__/api/CancelJobsData";

jest.mock("@zowe/core-for-zowe-sdk");

const returnCancelJobsDataAsync = async () => {
    return CancelJobsData.SAMPLE_JOB_FEEDBACK_ASYNC;
};

const mockErrorText = "My fake error for unit tests has this text - Cancel Jobs unit tests";
const throwImperativeError = async () => {
    throw new ImperativeError({ msg: mockErrorText });
};
const fakeSession: any = {};

describe("Cancel Jobs unit tests", () => {

    const fakeJob: IJob = {
        "jobid": "JOB00001",
        "jobname": "MYJOB1",
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

    describe("Positive tests", () => {
        it("should allow users to call cancelJob with correct parameters", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(returnCancelJobsDataAsync);
            let caughtError;
            let response;
            try {
                response = await CancelJobs.cancelJob(fakeSession, "MYJOB1", "JOB00001");
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_ASYNC);
        });

        it("should allow users to call cancelJobForJob with correct parameters", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(returnCancelJobsDataAsync);
            let caughtError;
            let response;
            try {
                response = await CancelJobs.cancelJobForJob(fakeSession, fakeJob);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_ASYNC);
        });

        it("should allow users to call cancelJobForJob with correct parameters (with version 1_0)", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(async (session: any, resource: string, headers: any[], body: any) => {
                expect(body).toMatchSnapshot();
                return CancelJobsData.SAMPLE_JOB_FEEDBACK_ASYNC;
            });
            const response = await CancelJobs.cancelJobForJob(fakeSession, fakeJob, "1.0");
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_ASYNC);
        });

        it("should allow users to call cancelJobForJob with correct parameters (with version 2_0)", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(async (session: any, resource: string, headers: any[], body: any) => {
                expect(body).toMatchSnapshot();
                return CancelJobsData.SAMPLE_JOB_FEEDBACK_GOOD;
            });
            const response = await CancelJobs.cancelJobForJob(fakeSession, fakeJob, "2.0");
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_GOOD);
        });

        it("should allow users to call cancelJobForJob with correct parameters (with version 2_0) and get a bad response", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(async (session: any, resource: string, headers: any[], body: any) => {
                expect(body).toMatchSnapshot();
                return CancelJobsData.SAMPLE_JOB_FEEDBACK_BAD;
            });
            const response = await CancelJobs.cancelJobForJob(fakeSession, fakeJob, "2.0");
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_BAD);
        });

        it("should allow users to call cancelJobCommon with correct parameters", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(returnCancelJobsDataAsync);
            let caughtError;
            let response;
            try {
                response = await CancelJobs.cancelJobCommon(fakeSession, { jobname: "MYJOB1", jobid: "JOB00001" });
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_ASYNC);
        });

        it("should allow users to call cancelJobCommon with correct parameters (with version 1_0)", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(async (session: any, resource: string, headers: any[], body: any) => {
                expect(body).toMatchSnapshot();
                return CancelJobsData.SAMPLE_JOB_FEEDBACK_ASYNC;
            });
            const response = await CancelJobs.cancelJobCommon(fakeSession, { jobname: "MYJOB1", jobid: "JOB00001", version: "1.0" });
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_ASYNC);
        });

        it("should allow users to call cancelJobCommon with correct parameters (with version 2_0)", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(async (session: any, resource: string, headers: any[], body: any) => {
                expect(body).toMatchSnapshot();
                return CancelJobsData.SAMPLE_JOB_FEEDBACK_GOOD;
            });
            const response = await CancelJobs.cancelJobCommon(fakeSession, { jobname: "MYJOB1", jobid: "JOB00001", version: "2.0" });
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_GOOD);
        });

        it("should allow users to call cancelJobCommon with correct parameters (with version 2_0) and get a failed response", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(async (session: any, resource: string, headers: any[], body: any) => {
                expect(body).toMatchSnapshot();
                return CancelJobsData.SAMPLE_JOB_FEEDBACK_BAD;
            });
            const response = await CancelJobs.cancelJobCommon(fakeSession, { jobname: "MYJOB1", jobid: "JOB00001", version: "2.0" });
            expect(response).toEqual(CancelJobsData.SAMPLE_JOB_FEEDBACK_BAD);
        });
    });

    describe("Error handling tests - async/await", () => {
        it("should be able to catch errors from cancelJob with async/await syntax", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await CancelJobs.cancelJob(fakeSession, "MYJOB1", "JOB0000");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch errors from cancelJobForJob with async/await syntax", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await CancelJobs.cancelJobForJob(fakeSession, fakeJob);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch errors from cancelJobCommon with async/await syntax", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await CancelJobs.cancelJobCommon(fakeSession, {
                    jobname: "MYJOB1",
                    jobid: "JOB0001"
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toEqual(mockErrorText);
        });
    });

    describe("Error handling tests - Promise catch() syntax", () => {
        /* eslint-disable jest/no-done-callback */
        it("should be able to catch errors from cancelJob with Promise.catch() syntax", (done: any) => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            CancelJobs.cancelJob(fakeSession, "MYJOB1", "JOB0000").then(() => {
                expect(".catch() should have been called").toEqual("test failed");
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toEqual(mockErrorText);
                done();
            });
        });

        it("should be able to catch errors from cancelJobForJob with Promise.catch() syntax", (done: any) => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            CancelJobs.cancelJobForJob(fakeSession, fakeJob)
                .then(() => {
                    expect(".catch() should have been called").toEqual("test failed");
                }).catch((err) => {
                    expect(err).toBeDefined();
                    expect(err instanceof ImperativeError).toEqual(true);
                    expect(err.message).toEqual(mockErrorText);
                    done();
                });
        });

        it("should be able to catch errors from cancelJobCommon with Promise.catch() syntax", (done: any) => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            CancelJobs.cancelJobCommon(fakeSession, {
                jobname: "MYJOB1",
                jobid: "JOB0001"
            }).then(() => {
                expect(".catch() should have been called").toEqual("test failed");
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toEqual(mockErrorText);
                done();
            });
        });
        /* eslint-enable jest/no-done-callback */
    });

    describe("Parameter validation", () => {

        it("should reject calls to cancelJob that omit jobname", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await CancelJobs.cancelJob(fakeSession, undefined, "JOB0000");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobname");
        });

        it("should reject calls to cancelJob that omit jobid", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await CancelJobs.cancelJob(fakeSession, "MYJOB1", undefined);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobid");
        });

        it("should reject calls to cancelJobForJob that omit jobname", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            const badJob: IJob = JSON.parse(JSON.stringify(fakeJob));
            delete badJob.jobname;
            try {
                await CancelJobs.cancelJobForJob(fakeSession, badJob);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobname");
        });

        it("should reject calls to cancelJobForJob that omit jobid", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            const badJob: IJob = JSON.parse(JSON.stringify(fakeJob));
            delete badJob.jobid;
            try {
                await CancelJobs.cancelJobForJob(fakeSession, badJob);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobid");
        });

        it("should reject calls to cancelJobCommon that omit jobname from the parms object", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await CancelJobs.cancelJobCommon(fakeSession, {
                    jobname: undefined,
                    jobid: "JOB0001"
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobname");
        });

        it("should reject calls to cancelJobCommon that omit jobid from the parms object", async () => {
            (ZosmfRestClient.putExpectJSON as any) = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await CancelJobs.cancelJobCommon(fakeSession, {
                    jobname: "MYJOB1",
                    jobid: undefined
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobid");
        });
    });

});
