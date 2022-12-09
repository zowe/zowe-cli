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

import { IMonitorJobWaitForParms } from "../../src/doc/input/IMonitorJobWaitForParms";
import { MonitorJobs } from "../../src/MonitorJobs";
import { IJob } from "../../src/doc/response/IJob";
import { ImperativeError, Session } from "@zowe/imperative";
import { JOB_STATUS, GetJobs } from "../../src";
import { sleep } from "@zowe/core-for-zowe-sdk";

jest.mock("../../src/GetJobs");

// Longer timeout for async poll test
const LONGER_TIMEOUT = 20000;
// Use this so that editors don't complain about us accessing private stuff
const privateMonitorJobs = MonitorJobs as any;
// Save for restore after "mock"
const ORIG_ATTEMPTS = MonitorJobs.DEFAULT_ATTEMPTS;

// Monitor jobs API unit tests
describe("Monitor Jobs", () => {

    // Cleanup/reset before each tests
    beforeEach(() => {
        Object.defineProperty(MonitorJobs, "DEFAULT_ATTEMPTS", {value: ORIG_ATTEMPTS});
    });

    /*************************************************************/
    // Unit tests for the file constants and defaults
    describe("constant defaults", () => {
        it("should have a watch delay interval", () => {
            expect(MonitorJobs.DEFAULT_WATCH_DELAY).toMatchSnapshot();
        });
        it("should have a max attempts", () => {
            expect(MonitorJobs.DEFAULT_ATTEMPTS).toMatchSnapshot();
        });
        it("should have a job status", () => {
            expect(MonitorJobs.DEFAULT_STATUS).toMatchSnapshot();
        });
    });

    /*************************************************************/
    // Unit tests for the "wait for output status" API methods
    describe("api method wait for output status", () => {
        describe("waitForOutputStatus", () => {
            let waitForStatusCommonSpy = jest.spyOn(privateMonitorJobs, "waitForStatusCommon");

            beforeEach(() => {
                waitForStatusCommonSpy.mockReset();
                waitForStatusCommonSpy = jest.spyOn(privateMonitorJobs, "waitForStatusCommon");
            });

            afterAll(() => {
                waitForStatusCommonSpy.mockRestore();
            });

            it("should call waitForStatusCommon", async () => {
                const returnValue = "RETURNED FROM COMMON METHOD";
                waitForStatusCommonSpy.mockReturnValue(returnValue);

                const jobname = "JOB52712";
                const jobid = "52712";

                expect(await MonitorJobs.waitForOutputStatus({test: "1234"} as any, jobname, jobid)).toBe(returnValue);

                expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledTimes(1);
                expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledWith({test: "1234"}, {
                    jobname,
                    jobid,
                    status: JOB_STATUS.OUTPUT
                });
            });
        });
        // Invalid parameter checking
        describe("parameter checks", () => {

            it("should detect a missing session", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForOutputStatus(undefined, "FAKE", "FAKE");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            // eslint-disable-next-line jest/no-done-callback
            it("should detect a missing session - then/catch", (done) => {
                MonitorJobs.waitForOutputStatus(undefined, "FAKE", "FAKE").then((response) => {
                    done(`Monitor jobs should have thrown an error because the session is missing.`);
                }).catch((error) => {
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    done();
                });
            });

            it("should detect a missing jobname", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), undefined, "FAKE");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a blank jobname", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), " ", "FAKE");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a missing jobid", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", undefined);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a blank jobid", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", " ");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });
        });

        describe("initial status check", () => {
            it("should return immediately if the initial status is OUTPUT", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return { jobname: "FAKE", jobid: "FAKE", status: "OUTPUT" };
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                const response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE");
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should produce a 'wrapped' error message if getJobs throws an error", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args) => {
                    throw new ImperativeError({msg: ERROR_MSG});
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(1);
            });

            // eslint-disable-next-line jest/no-done-callback
            it("should produce a 'wrapped' error message if getJobs throws an error - then/catch", (done) => {
                // Mock GetJobs.getStatusCommon
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args) => {
                    throw new ImperativeError({msg: ERROR_MSG});
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE").then((response) => {
                    done("Monitor jobs should not have fulfilled the promise because getJobs should have thrown and error");
                }).catch((error) => {
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(mockedGetJobsCommon).toHaveBeenCalledTimes(1);
                    done();
                });
            });
        });
        describe("checkStatus", () => {
            const getStatusCommonMock = jest.mocked(GetJobs.getStatusCommon);

            beforeEach(() => {
                getStatusCommonMock.mockReset();
            });

            it("should report back with true", async () => {
                const job: Partial<IJob> = {
                    status: "ACTIVE"
                };

                const parms: Partial<IMonitorJobWaitForParms> = {
                    status: "ACTIVE"
                };

                getStatusCommonMock.mockResolvedValue(job as any);

                let response: [boolean, IJob];

                // The first call is for if the job status is equal to parms
                response = await privateMonitorJobs.checkStatus({}, parms);

                expect(response).toEqual([true, job]);
                expect(GetJobs.getStatusCommon).toHaveBeenCalledTimes(1);
                expect(GetJobs.getStatusCommon).toHaveBeenLastCalledWith({}, parms);

                job.status = "OUTPUT";

                // The second call is for if the job status is greater than parms
                response = await privateMonitorJobs.checkStatus({}, parms);

                expect(response).toEqual([true, job]);
                expect(GetJobs.getStatusCommon).toHaveBeenCalledTimes(2);
                expect(GetJobs.getStatusCommon).toHaveBeenLastCalledWith({}, parms);
            });

            it("should report back with false", async () => {
                const job: Partial<IJob> = {
                    status: "input"
                };

                const parms: Partial<IMonitorJobWaitForParms> = {
                    status: "ACTIVE"
                };

                getStatusCommonMock.mockResolvedValue(job as any);

                // The first call is for if the job status is equal to parms
                const response: [boolean, IJob] = await privateMonitorJobs.checkStatus({}, parms);

                expect(response).toEqual([false, job]);
                expect(GetJobs.getStatusCommon).toHaveBeenCalledTimes(1);
                expect(GetJobs.getStatusCommon).toHaveBeenLastCalledWith({}, parms);
            });

            it("should throw an error when an invalid status is present", async () => {
                const job: Partial<IJob> = {
                    status: undefined
                };

                const parms: Partial<IMonitorJobWaitForParms> = {
                    status: "ACTIVE"
                };

                getStatusCommonMock.mockResolvedValue(job as any);

                let error: any;

                try {
                    await privateMonitorJobs.checkStatus({}, parms);
                } catch (e) {
                    error = e;
                }

                expect(error).toBeInstanceOf(ImperativeError);
                expect(error.message).toMatchSnapshot();

                error = undefined;

                job.status = "something-invalid";

                try {
                    await privateMonitorJobs.checkStatus({}, parms);
                } catch (e) {
                    error = e;
                }

                expect(error).toBeInstanceOf(ImperativeError);
                expect(error.message).toMatchSnapshot();
            });
        });
        describe("polling", () => {
            it("should expire after the max attempts and the total time should exceed the attempts multiplied by the delay", async () => {
                const attempts: number = 4;

                // Mock GetJobs.getStatusCommon
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                // "Mock" the attempts value
                Object.defineProperty(MonitorJobs, "DEFAULT_ATTEMPTS", {value: attempts});

                // Start time
                const start = new Date().getTime();
                let error;
                try {
                    const response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE");
                } catch (e) {
                    error = e;
                }

                // Stop time & difference in milliseconds
                const stop = new Date().getTime();
                const diff = stop - start;

                expect(diff).toBeGreaterThan((attempts - 1) * MonitorJobs.DEFAULT_WATCH_DELAY);
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(attempts);
            }, LONGER_TIMEOUT);

            it("should return after the status has changed from INPUT to OUTPUT", async () => {
                // Mock GetJobs.getStatusCommon
                const CHANGE_AT_ATTEMPT = 2;
                let attempts = 0;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < CHANGE_AT_ATTEMPT) {

                        return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeUndefined();
                expect(response).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
            });

            it("should return after the status has changed from ACTIVE to OUTPUT", async () => {
                // Mock GetJobs.getStatusCommon
                const CHANGE_AT_ATTEMPT = 2;
                let attempts = 0;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < CHANGE_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeUndefined();
                expect(response).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
            });

            it("should produce a 'wrapped' error message if a follow-up poll throws an error", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_AT_ATTEMPT = 2;
                let attempts = 0;
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < ERROR_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        throw new ImperativeError({msg: ERROR_MSG});
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(ERROR_AT_ATTEMPT);
            });

            it("should produce a 'wrapped' error message if a follow-up poll does not return a status", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_AT_ATTEMPT = 2;
                let attempts = 0;
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < ERROR_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: undefined};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE");
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(ERROR_AT_ATTEMPT);
            });
        });

        describe("pollForStatus", () => {
            let checkStatusSpy = jest.spyOn(privateMonitorJobs, "checkStatus");

            const dummyParms: IMonitorJobWaitForParms = {
                jobid  : "123456",
                jobname: "TESTJOB",
                status : "ACTIVE"
            };

            const dummyJob: Partial<IJob> = {
                jobid  : "123456",
                jobname: "TESTJOB",
                status : "COMPLETE"
            };

            const sleepMock = jest.mocked(sleep);

            beforeEach(() => {
                checkStatusSpy.mockReset();
                checkStatusSpy = jest.spyOn(privateMonitorJobs, "checkStatus");

                // Reset the mock and program it to return immediately.
                sleepMock.mockReset();
                sleepMock.mockImplementation();
            });

            afterAll(() => {
                checkStatusSpy.mockRestore();
            });

            it("should call check status and return immediately", async () => {
                checkStatusSpy.mockReturnValueOnce([false, dummyJob]);

                const result = await privateMonitorJobs.pollForStatus({}, {
                    ...dummyParms,
                    attempts: 0
                });

                expect(result).toBe(dummyJob);
                expect(checkStatusSpy).toHaveBeenLastCalledWith({}, {
                    ...dummyParms,
                    attempts: 0
                });
                expect(sleep).not.toHaveBeenCalled();
            });

            it("should exit before the max number of attempts using default timeout", async () => {
                const attempts = 10;
                const expectedAttempts = 3;

                checkStatusSpy
                    .mockReturnValueOnce([false, dummyJob])
                    .mockReturnValueOnce([false, dummyJob])
                    .mockReturnValueOnce([true, dummyJob]);

                const result = await privateMonitorJobs.pollForStatus({}, {
                    ...dummyParms,
                    attempts
                });

                expect(result).toBe(dummyJob);
                expect(checkStatusSpy).toHaveBeenCalledTimes(expectedAttempts);
                expect(sleep).toHaveBeenCalledTimes(expectedAttempts - 1);
                expect(sleep).toHaveBeenLastCalledWith(MonitorJobs.DEFAULT_WATCH_DELAY);
            });

            it("should use the specified timeout", async () => {
                const attempts = 6;
                const expectedAttempts = 3;

                const parmObject = {
                    ...dummyParms,
                    attempts,
                    watchDelay: 123456
                };

                checkStatusSpy
                    .mockReturnValueOnce([false, dummyJob])
                    .mockReturnValueOnce([false, dummyJob])
                    .mockReturnValueOnce([true, dummyJob]);

                const result = await privateMonitorJobs.pollForStatus({}, parmObject);

                expect(result).toBe(dummyJob);
                expect(checkStatusSpy).toHaveBeenCalledTimes(expectedAttempts);
                expect(sleep).toHaveBeenCalledTimes(expectedAttempts - 1);
                expect(sleep).toHaveBeenLastCalledWith(parmObject.watchDelay);
            });

            it("should throw an error when the max attempts have been reached", async () => {
                const attempts = 10;

                const parmObject = {
                    ...dummyParms,
                    attempts,
                    watchDelay: 123456
                };

                checkStatusSpy.mockReturnValue([false, dummyJob]);

                let error: any;

                try {
                    await privateMonitorJobs.pollForStatus({}, parmObject);
                } catch (e) {
                    error = e;
                }

                expect(error).toBeDefined();
                expect(error).toBeInstanceOf(ImperativeError);
                expect(error.message).toContain(`Reached max poll attempts of "${attempts}"`);

                expect(checkStatusSpy).toHaveBeenCalledTimes(attempts);
                expect(sleep).toHaveBeenCalledTimes(attempts - 1);
                expect(sleep).toHaveBeenLastCalledWith(parmObject.watchDelay);
            });

            it("should allow a lot of attempts when the max attempts is infinity", async () => {
                const maxAttempts = 1000;
                const errMsg = "Too many attempts";
                let attempts = 0;

                const parmObject = {
                    ...dummyParms,
                    attempts: Infinity,
                    watchDelay: 123456
                };

                checkStatusSpy.mockReturnValue([false, dummyJob]);
                sleepMock.mockImplementation(async () => {
                    attempts++;
                    if (attempts === maxAttempts) {
                        throw Error(errMsg);
                    }
                });

                let error: any;

                try {
                    await privateMonitorJobs.pollForStatus({}, parmObject);
                } catch (e) {
                    error = e;
                }

                expect(error).toBeDefined();
                expect(error.message).toBe(errMsg);

                expect(checkStatusSpy).toHaveBeenCalledTimes(attempts);
                expect(sleep).toHaveBeenCalledTimes(attempts);
                expect(sleep).toHaveBeenLastCalledWith(parmObject.watchDelay);
            });

            it("should throw the error thrown from checkStatus", async () => {
                const error = new Error("WE SHOULD SEE THIS");
                checkStatusSpy.mockImplementation(() => {
                    throw error;
                });

                let expectedError: any;

                try {
                    await privateMonitorJobs.pollForStatus({} as any, {} as any);
                } catch (e) {
                    expectedError = e;
                }

                expect(expectedError).toBeDefined();
                expect(expectedError).toBe(error);
            });
        });
    });
    /*************************************************************/
    // Unit tests for the "wait for job output status" API methods
    describe("api method wait for job output status", () => {
        describe("waitForJobOutputStatus", () => {
            let waitForStatusCommonSpy = jest.spyOn(privateMonitorJobs, "waitForStatusCommon");

            beforeEach(() => {
                waitForStatusCommonSpy.mockReset();
                waitForStatusCommonSpy = jest.spyOn(privateMonitorJobs, "waitForStatusCommon");
            });

            afterAll(() => {
                waitForStatusCommonSpy.mockRestore();
            });

            it("should throw an error when job is not passed", async () => {
                let error: any;

                try {
                    await MonitorJobs.waitForJobOutputStatus({} as any, undefined as any);
                } catch (e) {
                    error = e;
                }

                expect(error).toBeInstanceOf(ImperativeError);
                expect(error.message).toMatchSnapshot();
            });

            it("should call waitForStatusCommon", async () => {
                const returnVal = "THIS SHOULD BE RETURNED BY waitForJobOutputStatus";
                waitForStatusCommonSpy.mockReturnValue(returnVal);

                const job: Partial<IJob> = {
                    jobname: "ABCD123",
                    jobid: "782314"
                };

                expect(await MonitorJobs.waitForJobOutputStatus({shouldPassDown: true} as any, job as any)).toBe(returnVal);

                expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledTimes(1);
                expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledWith({shouldPassDown: true}, {
                    ...job,
                    status: JOB_STATUS.OUTPUT
                });
            });
        });
        // Invalid parameter checking
        describe("parameter checks", () => {

            it("should detect missing IJob", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), undefined);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a missing jobname", async () => {
                let error;
                try {
                    const obj = {jobname: undefined as string, jobid: "FAKE"};
                    const response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), obj as IJob);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a blank jobname", async () => {
                let error;
                try {
                    const obj = {jobname: " ", jobid: "FAKE"};
                    const response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), obj as IJob);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a missing jobid", async () => {
                let error;
                try {
                    const obj = {jobid: undefined as string, jobname: "FAKE"};
                    const response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), obj as IJob);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a blank jobid", async () => {
                let error;
                try {
                    const obj = {jobid: " ", jobname: "FAKE"};
                    const response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), obj as IJob);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a missing session", async () => {
                let error;
                try {
                    const obj = {jobname: "fake", jobid: "fake"};
                    const response = await MonitorJobs.waitForJobOutputStatus(undefined, obj as IJob);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            // eslint-disable-next-line jest/no-done-callback
            it("should detect a missing session - then/catch", (done) => {
                const obj = {jobname: "fake", jobid: "fake"};
                MonitorJobs.waitForJobOutputStatus(undefined, obj as IJob).then((response) => {
                    done(`Monitor jobs should have thrown an error because the session is missing.`);
                }).catch((error) => {
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    done();
                });
            });
        });

        describe("initial status check", () => {
            it("should return immediately if the initial status is OUTPUT", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                // IJob requires more fields to be populated - fake it out with only the required here.
                const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                const response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), iJobParms);
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            // eslint-disable-next-line jest/no-done-callback
            it("should produce a 'wrapped' error message if getJobs throws an error - then/catch", (done) => {
                // Mock GetJobs.getStatusCommon
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args) => {
                    throw new ImperativeError({msg: ERROR_MSG});
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), iJobParms).then((response) => {
                    done("Monitor jobs should not have fulfilled the promise because getJobs should have thrown and error");
                }).catch((error) => {
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(mockedGetJobsCommon).toHaveBeenCalledTimes(1);
                    done();
                });
            });

            it("should produce a 'wrapped' error message if getJobs throws an error", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args) => {
                    throw new ImperativeError({msg: ERROR_MSG});
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    // IJob requires more fields to be populated - fake it out with only the required here.
                    const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                    response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), iJobParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(1);
            });
        });

        describe("polling", () => {
            it("should expire after the max attempts and the total time should exceed the attempts multiplied by the delay", async () => {
                const attempts: number = 4;

                // Mock GetJobs.getStatusCommon
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                // "Mock" the attempts value
                Object.defineProperty(MonitorJobs, "DEFAULT_ATTEMPTS", {value: attempts});

                // Start time
                const start = new Date().getTime();
                let error;
                try {
                    // IJob requires more fields to be populated - fake it out with only the required here.
                    const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                    const response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), iJobParms);
                } catch (e) {
                    error = e;
                }

                // Stop time & difference in milliseconds
                const stop = new Date().getTime();
                const diff = stop - start;

                expect(diff).toBeGreaterThan((attempts - 1) * MonitorJobs.DEFAULT_WATCH_DELAY);
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(attempts);
            }, LONGER_TIMEOUT);

            it("should return after the status has changed from INPUT to OUTPUT", async () => {
                // Mock GetJobs.getStatusCommon
                const CHANGE_AT_ATTEMPT = 2;
                let attempts = 0;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < CHANGE_AT_ATTEMPT) {

                        return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    // IJob requires more fields to be populated - fake it out with only the required here.
                    const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                    response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), iJobParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeUndefined();
                expect(response).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
            });

            it("should return after the status has changed from ACTIVE to OUTPUT", async () => {
                // Mock GetJobs.getStatusCommon
                const CHANGE_AT_ATTEMPT = 2;
                let attempts = 0;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < CHANGE_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    // IJob requires more fields to be populated - fake it out with only the required here.
                    const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                    response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), iJobParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeUndefined();
                expect(response).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
            });

            it("should produce a 'wrapped' error message if a follow-up poll throws an error", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_AT_ATTEMPT = 2;
                let attempts = 0;
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < ERROR_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        throw new ImperativeError({msg: ERROR_MSG});
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    // IJob requires more fields to be populated - fake it out with only the required here.
                    const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                    response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), iJobParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(ERROR_AT_ATTEMPT);
            });

            it("should produce a 'wrapped' error message if a follow-up poll does not return a status", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_AT_ATTEMPT = 2;
                let attempts = 0;
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < ERROR_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: undefined};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    // IJob requires more fields to be populated - fake it out with only the required here.
                    const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                    response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "fake", port: 443}), iJobParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(ERROR_AT_ATTEMPT);
            });
        });
    });

    // Unit tests for the "wait for output status common" API methods
    describe("api method wait for status common", () => {
        describe("waitForStatusCommon", () => {
            let pollForStatusSpy = jest.spyOn(privateMonitorJobs, "pollForStatus");

            beforeEach(() => {
                pollForStatusSpy = jest.spyOn(privateMonitorJobs, "pollForStatus");
                pollForStatusSpy.mockReset();
            });

            afterAll(() => {
                pollForStatusSpy.mockRestore();
            });

            describe("expects", () => {
                it("should error if missing parms", async () => {
                    let error: any;

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, undefined as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing parms.jobname", async () => {
                    let error: any;

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {} as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing parms.jobid", async () => {
                    let error: any;

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {
                            jobname: "ABCD"
                        } as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing session", async () => {
                    let error: any;

                    try {
                        await MonitorJobs.waitForStatusCommon(undefined as any, {
                            jobname: "ABCD",
                            jobid  : "EFGH"
                        } as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if parms.status is not valid", async () => {
                    let error: any;

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {
                            jobname: "ABCD",
                            jobid  : "EFGH",
                            status : "INVALID"
                        } as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if parms.attempts is not valid", async () => {
                    let error: any;

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {
                            jobname : "ABCD",
                            jobid   : "EFGH",
                            attempts: "INVALID"
                        } as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();

                    error = undefined;

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {
                            jobname : "ABCD",
                            jobid   : "EFGH",
                            attempts: -155
                        } as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if parms.watchDelay is not valid", async () => {
                    let error: any;

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {
                            jobname   : "ABCD",
                            jobid     : "EFGH",
                            watchDelay: "INVALID"
                        } as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();

                    error = undefined;

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {
                            jobname   : "ABCD",
                            jobid     : "EFGH",
                            watchDelay: -155
                        } as any);
                    } catch (e) {
                        error = e;
                    }

                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });
            });

            describe("error handling", () => {
                const parms: IMonitorJobWaitForParms = {
                    jobid  : "123456",
                    jobname: "JOB1234"
                };

                it("should throw the proper error if pollForStatus throws an ImperativeError", async () => {
                    const error = new ImperativeError({
                        msg: "EXPECT THIS TO BE THROWN"
                    });

                    let expectError: any;

                    pollForStatusSpy.mockImplementationOnce(async () => {
                        throw error;
                    });

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, parms);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeInstanceOf(ImperativeError);
                    expect(expectError.message).toMatchSnapshot();
                });

                it("should throw the proper error if pollForStatus throws a normal error", async () => {
                    const error = new Error("THIS IS A NORMAL ERROR");

                    let expectError: any;

                    pollForStatusSpy.mockImplementationOnce(async () => {
                        throw error;
                    });

                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, parms);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeInstanceOf(ImperativeError);
                    expect(expectError.message).toMatchSnapshot();
                });
            });

            it("should successfully return a job using class defaults", async () => {
                const returnVal = "THIS SHOULD BE RETURNED FROM THE CALLED FUNCTION";
                pollForStatusSpy.mockReturnValue(returnVal);

                const parms: IMonitorJobWaitForParms = {
                    jobid  : "JOB123456",
                    jobname: "ABCDEF"
                };

                expect(await MonitorJobs.waitForStatusCommon({sessionInfo: "Should be here"} as any, parms)).toBe(returnVal);

                expect(pollForStatusSpy).toHaveBeenCalledTimes(1);
                expect(pollForStatusSpy).toHaveBeenLastCalledWith({sessionInfo: "Should be here"}, {
                    ...parms,
                    status  : MonitorJobs.DEFAULT_STATUS,
                    attempts: MonitorJobs.DEFAULT_ATTEMPTS
                });
            });

            it("should successfully return a job using specified parameters", async () => {
                const returnVal = "THIS SHOULD BE RETURNED FROM THE CALLED FUNCTION";
                pollForStatusSpy.mockReturnValue(returnVal);

                const parms: IMonitorJobWaitForParms = {
                    jobid     : "JOB123456",
                    jobname   : "ABCDEF",
                    status    : "INPUT",
                    attempts  : 150,
                    watchDelay: 20000
                };

                expect(await MonitorJobs.waitForStatusCommon({} as any, parms)).toBe(returnVal);

                expect(pollForStatusSpy).toHaveBeenCalledTimes(1);
                expect(pollForStatusSpy).toHaveBeenLastCalledWith({}, parms);
            });
        });

        // Invalid parameter checking
        describe("parameter checks", () => {

            it("should detect missing IMonitorJobParms", async () => {
                let error;
                try {
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}), undefined);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a missing jobname", async () => {
                let error;
                try {
                    const obj = {jobname: undefined as string, jobid: "FAKE"};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a blank jobname", async () => {
                let error;
                try {
                    const obj = {jobname: " ", jobid: "FAKE"};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a missing jobid", async () => {
                let error;
                try {
                    const obj = {jobid: undefined as string, jobname: "FAKE"};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a blank jobid", async () => {
                let error;
                try {
                    const obj = {jobid: " ", jobname: "FAKE"};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect a missing session", async () => {
                let error;
                try {
                    const obj = {jobname: "fake", jobid: "fake"};
                    const response = await MonitorJobs.waitForStatusCommon(undefined, obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            // eslint-disable-next-line jest/no-done-callback
            it("should detect a missing session - then/catch", (done) => {
                const obj = {jobname: "fake", jobid: "fake"};
                MonitorJobs.waitForStatusCommon(undefined, obj).then((response) => {
                    done(`Monitor jobs should have thrown an error because the session is missing.`);
                }).catch((error) => {
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    done();
                });
            });

            it("should detect an invalid status", async () => {
                let error;
                try {
                    const obj = {jobname: "fake", jobid: "fake", status: "BOGUS"};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect invalid attempts", async () => {
                let error;
                try {
                    const obj = {jobname: "fake", jobid: "fake", attempts: -1};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect invalid attempts type", async () => {
                let error;
                try {
                    const obj: any = {jobname: "fake", jobid: "fake", attempts: "blah"};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect invalid watchDelay", async () => {
                let error;
                try {
                    const obj: any = {jobname: "fake", jobid: "fake", watchDelay: -1};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect invalid watchDelay type", async () => {
                let error;
                try {
                    const obj: any = {jobname: "fake", jobid: "fake", watchDelay: "blah"};
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        obj as IMonitorJobWaitForParms);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });
        });

        describe("initial status check", () => {
            it("should return immediately if the initial status is the expected status", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE"});
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should return immediately if the initial status is OUTPUT and the expected status is ACTIVE", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should return immediately if the initial status is ACTIVE and the expected status is INPUT", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should return immediately if the initial status is ACTIVE and the expected status is ACTIVE", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should return immediately if the initial status is OUTPUT and the expected status is OUTPUT", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should return immediately if the initial status is OUTPUT and the expected status is INPUT", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should return immediately if the initial status is INPUT and the expected status is INPUT", async () => {

                // Mock GetJobs.getStatusCommon
                const mockedGetJobs = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobs;

                const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                expect(response).toMatchSnapshot();
                expect(mockedGetJobs).toHaveBeenCalledTimes(1);
            });

            it("should produce a 'wrapped' error message if getJobs throws an error", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args) => {
                    throw new ImperativeError({msg: ERROR_MSG});
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(1);
            });

            // eslint-disable-next-line jest/no-done-callback
            it("should produce a 'wrapped' error message if getJobs throws an error - then/catch", (done) => {
                // Mock GetJobs.getStatusCommon
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args) => {
                    throw new ImperativeError({msg: ERROR_MSG});
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"}).then((response) => {
                    done("Monitor jobs should not have fulfilled the promise because getJobs should have thrown and error");
                }).catch((error) => {
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(mockedGetJobsCommon).toHaveBeenCalledTimes(1);
                    done();
                });
            });

            // eslint-disable-next-line jest/no-done-callback
            it("should produce a 'wrapped' error message if getJobs throws a non imperative error - then/catch", (done) => {
                // Mock GetJobs.getStatusCommon
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args) => {
                    throw new Error(ERROR_MSG);
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                    {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"}).then((response) => {
                    done("Monitor jobs should not have fulfilled the promise because getJobs should have throw and error");
                }).catch((error) => {
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(mockedGetJobsCommon).toHaveBeenCalledTimes(1);
                    done();
                });
            });
        });

        describe("polling", () => {
            it("should expire after the specified number of max attempts", async () => {
                const attempts: number = 10;

                // Mock GetJobs.getStatusCommon
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                try {
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE", attempts, watchDelay: 1});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(attempts);
            });

            it("should expire after the specified number of max attempts and use the default watch delay", async () => {
                const attempts: number = 2;

                // Mock GetJobs.getStatusCommon
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                try {
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE", attempts});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(attempts);
            });

            it("should expire after the max attempts and the total time should exceed the attempts multiplied by the delay", async () => {
                const attempts: number = 4;

                // Mock GetJobs.getStatusCommon
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;

                // Start time
                const start = new Date().getTime();
                try {
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE", attempts});
                } catch (e) {
                    error = e;
                }

                // Stop time & difference in milliseconds
                const stop = new Date().getTime();
                const diff = stop - start;

                expect(diff).toBeGreaterThan((attempts - 1) * MonitorJobs.DEFAULT_WATCH_DELAY);
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(attempts);
            }, LONGER_TIMEOUT);

            it("should return after the status has changed from INPUT to ACTIVE", async () => {
                // Mock GetJobs.getStatusCommon
                const CHANGE_AT_ATTEMPT = 10;
                let attempts = 0;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < CHANGE_AT_ATTEMPT) {

                        return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE", watchDelay: 1});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeUndefined();
                expect(response).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
            });

            it("should return after the status has changed from INPUT to OUTPUT", async () => {
                // Mock GetJobs.getStatusCommon
                const CHANGE_AT_ATTEMPT = 10;
                let attempts = 0;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < CHANGE_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT", watchDelay: 1});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeUndefined();
                expect(response).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
            });

            it("should return after the status has changed from ACTIVE to OUTPUT", async () => {
                // Mock GetJobs.getStatusCommon
                const CHANGE_AT_ATTEMPT = 10;
                let attempts = 0;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < CHANGE_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT", watchDelay: 1});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeUndefined();
                expect(response).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
            });

            it("should produce a 'wrapped' error message if a follow-up poll throws an error", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_AT_ATTEMPT = 5;
                let attempts = 0;
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < ERROR_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        throw new ImperativeError({msg: ERROR_MSG});
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT", watchDelay: 1});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(ERROR_AT_ATTEMPT);
            });

            it("should produce a 'wrapped' error message if a follow-up poll does not return a status", async () => {
                // Mock GetJobs.getStatusCommon
                const ERROR_AT_ATTEMPT = 5;
                let attempts = 0;
                const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                const mockedGetJobsCommon = jest.fn(async (args): Promise<any> => {
                    attempts++;
                    if (attempts < ERROR_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: undefined};
                    }
                });
                GetJobs.getStatusCommon = mockedGetJobsCommon;

                let error;
                let response;
                try {
                    response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT", watchDelay: 1});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(mockedGetJobsCommon).toHaveBeenCalledTimes(ERROR_AT_ATTEMPT);
            });
        });

    });
});
