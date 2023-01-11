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

describe("MonitorJobs", () => {
    const privateMonitorJobs = MonitorJobs as any;
    const session = new Session({hostname: "FAKE", port: 443}) as any;
    const LONGER_TIMEOUT = 20000;

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
                it("should error if missing session", async () => {
                    let error;
                    const parms: any = {
                        jobname: "FAKE",
                        jobid  : "FAKE"
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(undefined as any, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing parms", async () => {
                    let error;
                    try {
                        await MonitorJobs.waitForStatusCommon(session, undefined as any);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing parms.jobname", async () => {
                    let error;
                    const parms: any = { jobid: "FAKE" };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing parms.jobid", async () => {
                    let error;
                    const parms: any = {
                        jobname: "FAKE",
                        jobid  : undefined
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if blank parms.jobname", async () => {
                    let error;
                    const parms: any = {
                        jobname: " ",
                        jobid  : "FAKE"
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if blank parms.jobid", async () => {
                    let error;
                    const parms: any = {
                        jobname: "FAKE",
                        jobid  : " "
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if invalid parms.status", async () => {
                    let error;
                    const parms: any = {
                        jobname: "FAKE",
                        jobid  : "FAKE",
                        status : "INVALID"
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if invalid parms.attempts", async () => {
                    let error;
                    const parms : any = {
                        jobname : "FAKE",
                        jobid   : "FAKE",
                        attempts: "INVALID"
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if invalid parms.watchDelay", async () => {
                    let error;
                    const parms: any = {
                        jobname: "FAKE",
                        jobid  : "FAKE",
                        watchDelay: "INVALID"
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error).toBeInstanceOf(ImperativeError);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if invalid type for status", async () => {
                    let error;
                    const parms: any = {
                        jobname: "FAKE",
                        jobid  : "FAKE",
                        status : "FAKE"
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });
                it("should error if invalid type for attempts", async () => {
                    let error;
                    const parms : any = {
                        jobname : "FAKE",
                        jobid   : "FAKE",
                        attempts: "FAKE"
                    };
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if invalid type for watchDelay", async () => {
                    let error;
                    const parms: any = {
                        jobname: "FAKE",
                        jobid  : "FAKE",
                        watchDelay: "FAKE"};
                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
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
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });

                it("should return immediately if the initial status is OUTPUT and the expected status is ACTIVE", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });

                it("should return immediately if the initial status is OUTPUT and the expected status is OUTPUT", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });

                it("should return immediately if the initial status is OUTPUT and the expected status is INPUT", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });

                it("should return immediately if the initial status is INPUT and the expected status is INPUT", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });

                it("should return immediately if the initial status is ACTIVE and the expected status is INPUT", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "INPUT"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });

                it("should return immediately if the initial status is ACTIVE and the expected status is ACTIVE", async () => {
                    getStatusCommonSpy.mockResolvedValueOnce({jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                    const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"});
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                });
            });

            describe("error handling", () => {
                const parms: IMonitorJobWaitForParms = {
                    jobid  : "FAKE",
                    jobname: "FAKE"
                };

                it("should throw the proper error if pollForStatus throws an ImperativeError", async () => {
                    const error = new ImperativeError({
                        msg: "EXPECT THIS ERROR TO BE THROWN"
                    });

                    let expectError: any;

                    pollForStatusSpy.mockImplementationOnce(async () => {
                        throw error;
                    });

                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
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
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeInstanceOf(ImperativeError);
                    expect(expectError.message).toMatchSnapshot();
                });

                it("should produce a 'wrapped' error message if getJobs throws an error", async () => {
                    const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                    const mockedGetJobsCommon = jest.fn(async (args) => {
                        throw new ImperativeError({msg: ERROR_MSG});
                    });
                    getStatusCommonSpy.mockResolvedValueOnce(mockedGetJobsCommon);
                    let error: any;
                    try {
                        await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
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
                    MonitorJobs.waitForOutputStatus(new Session({hostname: "FAKE", port: 443}), "FAKE", "FAKE").then((response) => {
                        done("Monitor jobs should not have fulfilled the promise because getJobs should have thrown and error");
                    }).catch((error) => {
                        expect(error).toBeDefined();
                        expect(error instanceof ImperativeError).toBe(true);
                        expect(error.message).toMatchSnapshot();
                        expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                        done();
                    });
                });

                // eslint-disable-next-line jest/no-done-callback
                it("should produce a 'wrapped' error message if getJobs throws a non imperative error - then/catch", (done) => {
                    const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                    const mockedGetJobsCommon = jest.fn(async (args) => {
                        throw new ImperativeError({msg: ERROR_MSG});
                    });
                    getStatusCommonSpy.mockResolvedValueOnce(mockedGetJobsCommon);

                    MonitorJobs.waitForStatusCommon(new Session({hostname: "fake", port: 443}),
                        {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"}).then((response) => {
                        done("Monitor jobs should not have fulfilled the promise because getJobs should have throw and error");
                    }).catch((error) => {
                        expect(error).toBeDefined();
                        expect(error instanceof ImperativeError).toBe(true);
                        expect(error.message).toMatchSnapshot();
                        expect(getStatusCommonSpy).toHaveBeenCalledTimes(1);
                        done();
                    });
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

            describe("expects", () => {
                it("should call waitForStatusCommon", async () => {
                    const returnValue = "RETURNED FROM COMMON METHOD";
                    const jobname = "FAKE";
                    const jobid = "FAKE";
                    waitForStatusCommonSpy.mockReturnValue(returnValue);

                    expect(await MonitorJobs.waitForOutputStatus({test: "1234"} as any, jobname, jobid)).toBe(returnValue);
                    expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledTimes(1);
                    expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledWith({test: "1234"}, {
                        jobname,
                        jobid,
                        status: JOB_STATUS.OUTPUT
                    });
                });

                it("should error if missing session", async () => {
                    let error;
                    const jobname = "FAKE";
                    const jobid = "FAKE";
                    try {
                        await MonitorJobs.waitForOutputStatus(undefined as any, jobname, jobid);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing jobname", async () => {
                    let error;
                    const jobname = undefined as any;
                    const jobid = "FAKE";
                    try {
                        await MonitorJobs.waitForOutputStatus(session, jobname, jobid);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should error if missing jobid", async () => {
                    let error;
                    const jobname = "FAKE";
                    const jobid = undefined as any;
                    try {
                        await MonitorJobs.waitForOutputStatus(session, jobname, jobid);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });
            });
            describe("error handling", () => {
                const parms: IMonitorJobWaitForParms = {
                    jobid  : "FAKE",
                    jobname: "FAKE"
                };

                it("should throw the proper error if catching an ImperativeError", async () => {
                    const error = new ImperativeError({
                        msg: "EXPECT THIS ERROR TO BE THROWN"
                    });

                    let expectError: any;

                    waitForStatusCommonSpy.mockImplementationOnce(async () => {
                        throw error;
                    });

                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeInstanceOf(ImperativeError);
                    expect(expectError.message).toMatchSnapshot();
                });

                it("should throw the proper error if catching a normal error", async () => {
                    const error = new Error("THIS IS A NORMAL ERROR");

                    let expectError: Error;

                    waitForStatusCommonSpy.mockImplementationOnce(async () => {
                        throw error;
                    });

                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeInstanceOf(Error);
                    expect(expectError.message).toMatchSnapshot();
                });

                it("should throw the proper error if catching a wrapped error", async () => {
                    const ERROR_MSG: string = `THIS IS A WRAPPED ERROR!`;
                    let expectError: any;
                    waitForStatusCommonSpy.mockImplementationOnce(async () => {
                        throw new ImperativeError({msg: ERROR_MSG});
                    });

                    try {
                        await MonitorJobs.waitForStatusCommon(session, parms);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeDefined();
                    expect(expectError instanceof ImperativeError).toBe(true);
                    expect(expectError.message).toMatchSnapshot();
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

            describe("expects", () => {
                it("should call waitForStatusCommon", async () => {
                    const returnVal = "THIS SHOULD BE RETURNED BY waitForJobOutputStatus";
                    const job: Partial<IJob> = {
                        jobname: "ABCD123",
                        jobid: "782314"
                    };
                    waitForStatusCommonSpy.mockReturnValue(returnVal);

                    expect(await MonitorJobs.waitForJobOutputStatus({shouldPassDown: true} as any, job as any)).toBe(returnVal);
                    expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledTimes(1);
                    expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledWith({shouldPassDown: true}, {
                        ...job,
                        status: JOB_STATUS.OUTPUT
                    });
                });

                it("should detect missing session", async () => {
                    let error;
                    try {
                        const response = await MonitorJobs.waitForJobOutputStatus(undefined as any, {
                            jobname: "FAKE",
                            jobid  : "FAKE"
                        } as any);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });

                it("should detect missing IJob", async () => {
                    let error;
                    try {
                        const response = await MonitorJobs.waitForJobOutputStatus(session, undefined as any);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                });
            });

            describe("error handling", () => {
                const job: any = {
                    jobid  : "FAKE",
                    jobname: "FAKE"
                };

                it("should throw the proper error if catching an ImperativeError", async () => {
                    const error = new ImperativeError({
                        msg: "EXPECT THIS ERROR TO BE THROWN"
                    });
                    let expectError: any;
                    waitForStatusCommonSpy.mockImplementationOnce(async () => {
                        throw error;
                    });

                    try {
                        await MonitorJobs.waitForJobOutputStatus(session, job);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeDefined();
                    expect(expectError).toBeInstanceOf(ImperativeError);
                    expect(expectError.message).toMatchSnapshot();
                });

                it("should throw the proper error if catching a normal error", async () => {
                    const error = new Error("THIS IS A NORMAL ERROR");
                    let expectError: any;
                    waitForStatusCommonSpy.mockImplementationOnce(async () => {
                        throw error;
                    });

                    try {
                        await MonitorJobs.waitForJobOutputStatus(session, job);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeDefined();
                    expect(expectError).toBeInstanceOf(Error);
                    expect(expectError.message).toMatchSnapshot();
                });

                it("should throw the proper error if catching a wrapped error", async () => {
                    const ERROR_MSG: string = `THIS IS A WRAPPED ERROR!`;
                    let expectError: any;
                    waitForStatusCommonSpy.mockImplementationOnce(async () => {
                        throw new ImperativeError({msg: ERROR_MSG});
                    });

                    try {
                        await MonitorJobs.waitForJobOutputStatus(session, job);
                    } catch (e) {
                        expectError = e;
                    }

                    expect(expectError).toBeDefined();
                    expect(expectError instanceof ImperativeError).toBe(true);
                    expect(expectError.message).toMatchSnapshot();
                });
            });
        });
    });

    describe("Private Methods", () => {
        describe("pollForStatus", () => {
            let checkStatusSpy = jest.spyOn(privateMonitorJobs, "checkStatus");
            let getStatusCommonSpy: any;
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
            const session: any = new Session({hostname: "FAKE", port: 443});
            const sleepMock = jest.mocked(sleep);

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

            describe("expects", () => {
                it("should call check status and return immediately", async () => {
                    checkStatusSpy.mockReturnValueOnce([false, dummyJob]);

                    const result = await privateMonitorJobs.pollForStatus(session, {
                        ...dummyParms,
                        attempts: 0
                    });

                    expect(result).toBe(dummyJob);
                    expect(checkStatusSpy).toHaveBeenLastCalledWith(session, {
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

                    const result = await privateMonitorJobs.pollForStatus(session, {
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

                    const result = await privateMonitorJobs.pollForStatus(session, parmObject);

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
                        await privateMonitorJobs.pollForStatus(session, parmObject);
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
                        await privateMonitorJobs.pollForStatus(session, parmObject);
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
                        await privateMonitorJobs.pollForStatus(session, {} as any);
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
                        const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
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
                        const response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                            {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE", attempts});
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(attempts);
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
                        response = await MonitorJobs.waitForStatusCommon(new Session({hostname: "FAKE", port: 443}),
                            {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE", watchDelay: 1});
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeUndefined();
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
                });

                it("should return after the status has changed from INPUT to OUTPUT", async () => {
                    const CHANGE_AT_ATTEMPT = 2;
                    let attempts = 0;
                    const mockedGetJobsCommon = async (args: any): Promise<any> => {
                        attempts++;
                        if (attempts < CHANGE_AT_ATTEMPT) {
                            return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                        } else {
                            return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                        }
                    };
                    getStatusCommonSpy.mockImplementation(mockedGetJobsCommon);
                    let error;
                    let response;
                    try {
                        response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "FAKE", port: 443}), "FAKE", "FAKE");
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeUndefined();
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
                });

                it("should return after the status has changed from ACTIVE to OUTPUT", async () => {
                    const CHANGE_AT_ATTEMPT = 2;
                    let attempts = 0;
                    const mockedGetJobsCommon = async (args: any): Promise<any> => {
                        attempts++;
                        if (attempts < CHANGE_AT_ATTEMPT) {
                            return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                        } else {
                            return {jobname: "FAKE", jobid: "FAKE", status: "OUTPUT"};
                        }
                    };
                    getStatusCommonSpy.mockImplementation(mockedGetJobsCommon);
                    let error;
                    let response;
                    try {
                        // IJob requires more fields to be populated - fake it out with only the required here.
                        const iJobParms: any = {jobname: "FAKE", jobid: "FAKE"};
                        response = await MonitorJobs.waitForJobOutputStatus(new Session({hostname: "FAKE", port: 443}), iJobParms);
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeUndefined();
                    expect(response).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(CHANGE_AT_ATTEMPT);
                });

                it("should expire after the max attempts and the total time should exceed the attempts multiplied by the delay", async () => {
                    const attempts: number = 4;
                    sleepMock.mockImplementation(jest.requireActual("@zowe/core-for-zowe-sdk").sleep);
                    const mockedGetJobsCommon = async (args: any): Promise<any> => {
                        return {jobname: "FAKE", jobid: "FAKE", status: "INPUT"};
                    };
                    getStatusCommonSpy.mockImplementation(mockedGetJobsCommon);

                    // "Mock" the attempts value
                    Object.defineProperty(MonitorJobs, "DEFAULT_ATTEMPTS", {value: attempts});

                    // Start time
                    const start = Date.now();
                    let error;
                    try {
                        const response = await MonitorJobs.waitForOutputStatus(session, "FAKE", "FAKE");
                    } catch (e) {
                        error = e;
                    }

                    // Stop time & difference in milliseconds
                    const stop = Date.now();
                    const diff = stop - start;

                    expect(diff).toBeGreaterThan((attempts - 1) * MonitorJobs.DEFAULT_WATCH_DELAY);
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(attempts);
                }, LONGER_TIMEOUT);
            });

            describe("error handling", () => {
                it("should produce a 'wrapped' error message if a follow-up poll throws an error", async () => {
                    const ERROR_AT_ATTEMPT = 2;
                    let attempts = 0;
                    const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                    const mockedGetJobsCommon = async (args: any): Promise<any> => {
                        attempts++;
                        if (attempts < ERROR_AT_ATTEMPT) {
                            return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                        } else {
                            throw new ImperativeError({msg: ERROR_MSG});
                        }
                    };
                    getStatusCommonSpy.mockImplementation(mockedGetJobsCommon);
                    let error;
                    let response;
                    try {
                        response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "FAKE", port: 443}), "FAKE", "FAKE");
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(ERROR_AT_ATTEMPT);
                });

                it("should produce a 'wrapped' error message if a follow-up poll does not return a status", async () => {
                    const ERROR_AT_ATTEMPT = 2;
                    let attempts = 0;
                    const ERROR_MSG: string = `ERROR GETTING JOBS!`;
                    const mockedGetJobsCommon = async (args: any): Promise<any> => {
                        attempts++;
                        if (attempts < ERROR_AT_ATTEMPT) {
                            return {jobname: "FAKE", jobid: "FAKE", status: "ACTIVE"};
                        } else {
                            return {jobname: "FAKE", jobid: "FAKE", status: undefined};
                        }
                    };
                    getStatusCommonSpy.mockImplementation(mockedGetJobsCommon);
                    let error;
                    let response;
                    try {
                        response = await MonitorJobs.waitForOutputStatus(new Session({hostname: "FAKE", port: 443}), "FAKE", "FAKE");
                    } catch (e) {
                        error = e;
                    }
                    expect(error).toBeDefined();
                    expect(error instanceof ImperativeError).toBe(true);
                    expect(error.message).toMatchSnapshot();
                    expect(getStatusCommonSpy).toHaveBeenCalledTimes(ERROR_AT_ATTEMPT);
                });
            });
        });

        describe("checkStatus", () => {
            const getStatusCommonMock = jest.mocked(GetJobs.getStatusCommon);

            beforeEach(() => {
                getStatusCommonMock.mockReset();
            });

            describe("expects", () => {
                it("should report back with true", async () => {
                    const job: Partial<IJob> = {
                        status: "ACTIVE"
                    };
                    const parms: Partial<IMonitorJobWaitForParms> = {
                        status: "ACTIVE"
                    };
                    let response: [boolean, IJob];
                    getStatusCommonMock.mockResolvedValue(job as any);

                    // The first call is for if the job status is equal to parms
                    response = await privateMonitorJobs.checkStatus(session, parms);
                    expect(response).toEqual([true, job]);
                    expect(GetJobs.getStatusCommon).toHaveBeenCalledTimes(1);
                    expect(GetJobs.getStatusCommon).toHaveBeenLastCalledWith(session, parms);

                    job.status = "OUTPUT";

                    // The second call is for if the job status is greater than parms
                    response = await privateMonitorJobs.checkStatus(session, parms);
                    expect(response).toEqual([true, job]);
                    expect(GetJobs.getStatusCommon).toHaveBeenCalledTimes(2);
                    expect(GetJobs.getStatusCommon).toHaveBeenLastCalledWith(session, parms);
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
                    const response: [boolean, IJob] = await privateMonitorJobs.checkStatus(session, parms);

                    expect(response).toEqual([false, job]);
                    expect(GetJobs.getStatusCommon).toHaveBeenCalledTimes(1);
                    expect(GetJobs.getStatusCommon).toHaveBeenLastCalledWith(session, parms);
                });
            });

            describe("error handling", () => {
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
});
