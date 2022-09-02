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
import { GetJobs } from "../../src";

jest.mock("../../src/GetJobs");

// Longer timeout for async poll test
const LONGER_TIMEOUT = 20000;

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
    });

    /*************************************************************/
    // Unit tests for the "wait for job output status" API methods
    describe("api method wait for job output status", () => {

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
