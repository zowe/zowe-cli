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

jest.mock("@zowe/core-for-zowe-sdk");
jest.mock("../../src/GetJobs");

import { ImperativeError, Session } from "@zowe/imperative";
import { JOB_STATUS, MonitorJobs, GetJobs } from "../../src";
import { sleep } from "@zowe/core-for-zowe-sdk";
import { IMonitorJobWaitForParms } from "../../src/doc/input/IMonitorJobWaitForParms";
import { IJob } from "../../src/doc/response/IJob";

const LONGER_TIMEOUT = 20000;
describe("MonitorJobs", () => {
    // Use this so that editors don't complain about us accessing private stuff
    const privateMonitorJobs = MonitorJobs as any;

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

    describe("Public Methods", () => {
        describe("waitForStatusCommon", () => {
            let pollForStatusSpy: any;
            let getStatusCommonSpy: any;
            beforeEach(() => {
                pollForStatusSpy = jest.spyOn(privateMonitorJobs, "pollForStatus");
                getStatusCommonSpy = jest.spyOn(GetJobs, "getStatusCommon");
            });

            afterEach(() => {
                pollForStatusSpy.mockRestore();
                getStatusCommonSpy.mockRestore();
            });

            describe("parameter expectations", () => {
                it("should detect if missing params", async () => {
                    let error;
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}), undefined);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing parms.jobname", async () => {
                    let error;
                    const obj: any = { jobid: "FAKE" };
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}), obj);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });
                it("should detect a blank jobname", async () => {
                    let error;
                    const obj: any = {jobname: " ", jobid: "FAKE"};
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                            obj);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing parms.jobid", async () => {
                    let error;
                    const obj: any = {jobname: "FAKE", jobid: undefined};
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                            obj);
                    } catch (e) {
                        error = e;
                    }
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });
                it("should detect a blank jobid", async () => {
                    let error;
                    const obj: any = {jobname: "FAKE", jobid: " "};
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                            obj);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing session", async () => {
                    let error;
                    try {
                        await MonitorJobs.waitForStatusCommon(undefined as any, {
                            jobname: "ABCD",
                            jobid  : "EFGH"
                        } as any);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if parms.status is not valid", async () => {
                    let error;
                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {
                            jobname: "ABCD",
                            jobid  : "EFGH",
                            status : "INVALID"
                        } as any);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if parms.attempts is not valid", async () => {
                    let error;
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
                });

                it("should error if parms.watchDelay is not valid", async () => {
                    let error;
                    try {
                        await MonitorJobs.waitForStatusCommon({} as any, {
                            jobname   : "ABCD",
                            jobid     : "EFGH",
                            watchDelay: "INVALID"
                        } as any);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should detect invalid attempts type", async () => {
                    let error;
                    const obj: any = {jobname: "fake", jobid: "fake", attempts: "blah"};
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                            obj);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should detect invalid watchDelay type", async () => {
                    let error;
                    const obj: any = {jobname: "fake", jobid: "fake", watchDelay: "blah"};
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                            obj);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });
            });

            describe("expects", () => {
                it("should successfully return a job using class defaults", async () => {
                    const returnVal = "THIS SHOULD BE RETURNED FROM THE CALLED FUNCTION";
                    pollForStatusSpy.mockReturnValueOnce(returnVal);

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
                    pollForStatusSpy.mockReturnValueOnce(returnVal);

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

                it("should return immediately if the initial status is the expected status", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });

                it("should return immediately if the initial status is OUTPUT and the expected status is ACTIVE", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });

                it("should return immediately if the initial status is ACTIVE and the expected status is INPUT", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });
                it("should return immediately if the initial status is ACTIVE and the expected status is ACTIVE", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });
                it("should return immediately if the initial status is OUTPUT and the expected status is OUTPUT", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });
                it("should return immediately if the initial status is OUTPUT and the expected status is INPUT", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });
                it("should produce a 'wrapped' error message if getJobs throws an error", async () => {
                    const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                    const mockedGetJobsCommon = jest.fn(async (args) => {
                        throw new ImperativeError({msg: ERROR_MSG});
                    });
                    getStatusCommonSpy.mockResolvedValueOnce(mockedGetJobsCommon);
                    let error: any;
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                            {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });
                // eslint-disable-next-line jest/no-done-callback
                it("should produce a 'wrapped' error message if getJobs throws an error - then/catch", (done) => {
                    const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                    const mockedGetJobsCommon = jest.fn(async (args) => {
                        throw new ImperativeError({msg: ERROR_MSG});
                    });
                    getStatusCommonSpy.mockResolvedValueOnce(mockedGetJobsCommon);
                    MonitorJobs.waitForOutputStatus(new Session({hostname: "fake", port: 443}), "FAKE", "FAKE").then((response) => {
                        done("Monitor jobs should not have fulfilled the promise because getJobs should have thrown and error");
                    }).catch((error) => {
                        expect(error).toBeDefined();
                        expect(error instanceof ImperativeError).toBe(true);
                        expect(error.message).toMatchSnapshot();
                        expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                        done();
                    });
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

                    let expectError: Error;

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

                    let expectError: Error;

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
        });

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

        describe("waitForJobOutputStatus", () => {
            let waitForStatusCommonSpy = jest.spyOn(privateMonitorJobs, "waitForStatusCommon");

            beforeEach(() => {
                waitForStatusCommonSpy.mockReset();
                waitForStatusCommonSpy = jest.spyOn(privateMonitorJobs, "waitForStatusCommon");
            });

            afterAll(() => {
                waitForStatusCommonSpy.mockRestore();
            });

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

            it("should throw an error when job is not passed", async () => {
                let error;

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
    });

    // NOTE: constructErrorMsg is so simple that it will be covered by other functions in this class.
    describe("Private Methods", () => {
        describe("pollForStatus", () => {
            let checkStatusSpy = jest.spyOn(privateMonitorJobs, "checkStatus");
            let getStatusCommonSpy: any;
            const sleepMock = jest.mocked(sleep);

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

            beforeEach(() => {
                checkStatusSpy = jest.spyOn(privateMonitorJobs, "checkStatus");
                getStatusCommonSpy = jest.spyOn(GetJobs, "getStatusCommon");
                sleepMock.mockReset();
                sleepMock.mockImplementation();
            });
            afterEach(() => {
                checkStatusSpy.mockRestore();
                getStatusCommonSpy.mockRestore();
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

                let error;

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

                let error;

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

            it("should return after the status has changed from INPUT to ACTIVE", async () => {
                const CHANGE_AT_ATTEMPT = 10;
                let attempts = 0;
                const mockedGetJobsCommon = async (args: any): Promise<any> => {
                    attempts++;
                    if (attempts < CHANGE_AT_ATTEMPT) {
                        return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                    } else {
                        return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                    }
                };

                getStatusCommonSpy.mockImplementation(mockedGetJobsCommon);
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
                expect(getStatusCommonSpy).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
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

            it("should expire after the specified number of max attempts", async () => {
                const attempts: number = 10;
                getStatusCommonSpy.mockResolvedValue({jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                let error: any;
                try {
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE", attempts, watchDelay: 1});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(getStatusCommonSpy).toHaveBeenCalledTimes(attempts);
            });

            it("should expire after the specified number of max attempts and use the default watch delay", async () => {
                const attempts: number = 2;
                const mockedGetJobsCommon = async (args: any): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                };
                getStatusCommonSpy.mockImplementation(mockedGetJobsCommon);
                let error: any;
                try {
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE", attempts});
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
                expect(getStatusCommonSpy).toHaveBeenCalledTimes(attempts);
            });
            fit("should expire after the max attempts and the total time should exceed the attempts multiplied by the delay", async () => {
                const attempts: number = 4;
                sleepMock.mockRestore();
                const mockedGetJobsCommon = async (args: any): Promise<any> => {
                    return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                };
                getStatusCommonSpy.mockImplementation(mockedGetJobsCommon);

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
                expect(getStatusCommonSpy).toHaveBeenCalledTimes(attempts);
            }, LONGER_TIMEOUT);
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

                let error;

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
    });
});
