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

import { ZosmfHeaders, ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { ImperativeError } from "@zowe/imperative";
import { DeleteJobs, IJob } from "../../src";

jest.mock("@zowe/core-for-zowe-sdk");

const returnEmpty = async () => {
    return;
};

const mockErrorText = "My fake error for unit tests has this text - Delete Jobs unit tests";
const throwImperativeError = async () => {
    throw new ImperativeError({msg: mockErrorText});
};
const fakeSession: any = {};

describe("Delete Jobs unit tests", () => {

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
        it("should allow users to call deleteJob with correct parameters", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(returnEmpty);
            await DeleteJobs.deleteJob(fakeSession, "MYJOB1", "JOB00001");
        });

        it("should allow users to call deleteJobForJob with correct parameters", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(returnEmpty);
            await DeleteJobs.deleteJobForJob(fakeSession, fakeJob);
        });

        it("should allow users to call deleteJobForJob with correct parameters (with modify version 1_0)", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(async (session: any, resource: string, headers: any[]) => {
                expect(headers).toContain(ZosmfHeaders.X_IBM_JOB_MODIFY_VERSION_1);
                return {};
            });
            await DeleteJobs.deleteJobForJob(fakeSession, fakeJob, "1.0");
        });

        it("should allow users to call deleteJobForJob with correct parameters (with modify version 2_0)", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(async (session: any, resource: string, headers: any[]) => {
                expect(headers).toContain(ZosmfHeaders.X_IBM_JOB_MODIFY_VERSION_2);
                return {};
            });
            await DeleteJobs.deleteJobForJob(fakeSession, fakeJob, "2.0");
        });

        it("should allow users to call deleteJobCommon with correct parameters", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(returnEmpty);
            await DeleteJobs.deleteJobCommon(fakeSession, {jobname: "MYJOB1", jobid: "JOB00001"});
        });

        it("should allow users to call deleteJobCommon with correct parameters (with modify version 1_0)", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(async (session: any, resource: string, headers: any[]) => {
                expect(headers).toContain(ZosmfHeaders.X_IBM_JOB_MODIFY_VERSION_1);
                return {};
            });
            await DeleteJobs.deleteJobCommon(fakeSession, {jobname: "MYJOB1", jobid: "JOB00001", modifyVersion: "1.0"});
        });
        it("should allow users to call deleteJobCommon with correct parameters (with modify version 2_0)", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(async (session: any, resource: string, headers: any[]) => {
                expect(headers).toContain(ZosmfHeaders.X_IBM_JOB_MODIFY_VERSION_2);
                return {};
            });
            await DeleteJobs.deleteJobCommon(fakeSession, {jobname: "MYJOB1", jobid: "JOB00001", modifyVersion: "2.0"});
        });
    });

    describe("Error handling tests - async/await", () => {
        it("should be able to catch errors from deleteJob with async/await syntax", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJob(fakeSession, "MYJOB1", "JOB0000");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch errors from deleteJobForJob with async/await syntax", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJobForJob(fakeSession, fakeJob);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch errors from deleteJobCommon with async/await syntax", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJobCommon(fakeSession, {
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
        it("should be able to catch errors from deleteJob with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            DeleteJobs.deleteJob(fakeSession, "MYJOB1", "JOB0000").then(() => {
                expect(".catch() should have been called").toEqual("test failed");
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toEqual(mockErrorText);
                done();
            });
        });

        it("should be able to catch errors from deleteJobForJob with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            DeleteJobs.deleteJobForJob(fakeSession, fakeJob)
                .then(() => {
                    expect(".catch() should have been called").toEqual("test failed");
                }).catch((err) => {
                    expect(err).toBeDefined();
                    expect(err instanceof ImperativeError).toEqual(true);
                    expect(err.message).toEqual(mockErrorText);
                    done();
                });
        });

        it("should be able to catch errors from deleteJobCommon with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            DeleteJobs.deleteJobCommon(fakeSession, {
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

        it("should reject calls to deleteJob that omit jobname", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJob(fakeSession, undefined, "JOB0000");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobname");
        });

        it("should reject calls to deleteJob that omit jobid", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJob(fakeSession, "MYJOB1", undefined);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobid");
        });

        it("should reject calls to deleteJobForJob that omit jobname", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            const badJob: IJob = JSON.parse(JSON.stringify(fakeJob));
            delete badJob.jobname;
            try {
                await DeleteJobs.deleteJobForJob(fakeSession, badJob);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobname");
        });

        it("should reject calls to deleteJobForJob that omit jobid", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            const badJob: IJob = JSON.parse(JSON.stringify(fakeJob));
            delete badJob.jobid;
            try {
                await DeleteJobs.deleteJobForJob(fakeSession, badJob);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobid");
        });

        it("should reject calls to deleteJobCommon that omit jobname from the parms object", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJobCommon(fakeSession, {
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

        it("should reject calls to deleteJobCommon that omit jobid from the parms object", async () => {
            ZosmfRestClient.deleteExpectString = jest.fn(throwImperativeError);
            let err: Error | ImperativeError;
            try {
                await DeleteJobs.deleteJobCommon(fakeSession, {
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
