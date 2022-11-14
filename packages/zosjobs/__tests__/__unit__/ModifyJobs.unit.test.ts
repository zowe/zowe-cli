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
import { ModifyJobs } from "../../src";

jest.mock("@zowe/core-for-zowe-sdk/src/rest/ZosmfRestClient");
jest.mock("../../src/MonitorJobs");

const fakeSession: any = {};
const fakeJobID = "JOB00001";
const fakeJobName = "MYJOB1";
const fakeClass = "A";
const returnIJob = async () => {
    return {jobid: fakeJobID, jobname: fakeJobName, retcode: "CC 0000", owner: "dummy"};
};

const mockErrorText = "Fake error for sdk modify unit test has this text";
const throwImperativeError = async () => {
    throw new ImperativeError({msg: mockErrorText});
};
describe("Modify Jobs API", () => {

    describe("Positive tests", () => {
        it("should allow users to call modifyJob with correct parameters", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            const job: any = await ModifyJobs.modifyJob(fakeSession, fakeJobID, fakeJobName, fakeClass);
            // mocking worked if fake job name is filled in
            expect(job.jobname).toEqual(fakeJobName);
        });

        it("should allow users to call modifyJobCommon with correct parameters", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            const job: any  = await ModifyJobs.modifyJobCommon(fakeSession, {
                jobid: fakeJobID,
                jobname: fakeJobName,
                jobclass: fakeClass,
                hold: false,
                release: false,
            });
            // mocking worked if fake job name is filled in
            expect(job.jobname).toEqual(fakeJobName);
        });
    });

    describe("Error handling tests - async/await", () => {
        it("should be able to catch an error awaiting modifyJob", async () => {
            (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
            let err: any;
            try {
                await ModifyJobs.modifyJob(fakeSession, fakeJobID, fakeJobName, fakeClass);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch an error awaiting modifyJobCommon", async () => {
            (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
            let err: any;
            try {
                await ModifyJobs.modifyJobCommon(fakeSession, {
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                    jobclass: fakeClass,
                    hold: false,
                    release: false,
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorText);
        });
    });

    describe("Error handling tests - Promise catch() syntax", () => {
        it("should be able to catch errors from modifyJob with Promise.catch() syntax", () => {
            return new Promise((done:any) => { //https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-done-callback.md
                (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
                ModifyJobs.modifyJob(
                    fakeSession,
                    fakeJobID,
                    fakeJobName,
                    fakeClass
                ).then(() => {
                    expect("Should have called .catch()").toEqual("test failed");
                }).catch((e) => {
                    expect(e).toBeDefined();
                    expect(e.message).toEqual(mockErrorText);
                    done();
                });
            });
        });

        it("should be able to catch errors from modifyJobForJob with Promise.catch() syntax", () => {
            return new Promise((done:any) => {
                (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
                ModifyJobs.modifyJobCommon(fakeSession, {
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                    jobclass: fakeClass,
                    hold: false,
                    release: false,
                }).then(() => {
                    expect("Should have called .catch()").toEqual("test failed");
                }).catch((e) => {
                    expect(e).toBeDefined();
                    expect(e.message).toEqual(mockErrorText);
                    done();
                });
            });
        });
    });

    describe("Parameter validation", () => {
        it("should reject calls to modifyJob that don't contain a jobid", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(throwImperativeError);
            let err: any;
            try {
                await ModifyJobs.modifyJobCommon(fakeSession, {
                    jobname: fakeJobName,
                    jobid: "",
                    jobclass: "A",
                    hold: true,
                    release: false,
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("jobid");
        });

        it("should reject calls to modifyJob that omit jobid from the parms object", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(throwImperativeError);
            let err: any;
            try {
                await ModifyJobs.modifyJobCommon(fakeSession, {
                    jobname: fakeJobName,
                    jobid: undefined,
                    jobclass: "A",
                    hold: true,
                    release: false,
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