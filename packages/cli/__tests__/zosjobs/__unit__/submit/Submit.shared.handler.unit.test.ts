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

jest.mock("@zowe/zos-jobs-for-zowe-sdk");
import { MonitorJobs, SubmitJobs, ISubmitParms } from "@zowe/zos-jobs-for-zowe-sdk";
import { IHandlerParameters, ImperativeError, IO } from "@zowe/imperative";
import * as SubmitDefinition from "../../../../src/zosjobs/submit/Submit.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "submit", "data-set"],
    definition: SubmitDefinition.SubmitDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

const USSFILE_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "submit", "uss-file"],
    definition: SubmitDefinition.SubmitDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

const LOCALFILE_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "submit", "local-file"],
    definition: SubmitDefinition.SubmitDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("submit shared handler", () => {

    describe("error handling", () => {
        it("should detect if the JCL source type (data set, etc.) could not be determined", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // The handler should fail
            let error;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                const copy = Object.assign({}, DEFAULT_PARAMETERS);
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toMatchSnapshot();
        });

        it("should not transform an error thrown by the submit JCL API", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Mock the submit JCL function
            const errMsg = "YOUR JCL IS BAD!";
            let dataSetSpecified: string;
            SubmitJobs.submitJobCommon = jest.fn((session, dataset) => {
                dataSetSpecified = dataset.jobDataSet;
                throw new ImperativeError({msg: errMsg});
            });

            // The handler should fail
            const theDataSet = "DATA.SET";
            const copy = Object.assign({}, DEFAULT_PARAMETERS);
            copy.arguments.dataset = theDataSet;
            let error;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe(errMsg);
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(dataSetSpecified).toBe(theDataSet);
        });
    });

    describe("process method", () => {
        it("should submit JCL contained within a data-set if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let dataSetSpecified;

            // Mock the submit JCL function
            SubmitJobs.submitJobCommon = jest.fn((session, dataset) => {
                dataSetSpecified = dataset.jobDataSet;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });

            // The handler should fail
            const theDataSet = "DATA.SET";
            const copy = Object.assign({}, DEFAULT_PARAMETERS);
            copy.arguments.dataset = theDataSet;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(dataSetSpecified).toBe(theDataSet);
        });

        it("should submit JCL contained within a data-set if requested and wait for output", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let dataSetSpecified;

            // Mock the submit JCL function
            SubmitJobs.submitJobCommon = jest.fn((session, dataset) => {
                dataSetSpecified = dataset.jobDataSet;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });

            const completedJob: any = {
                jobname: "MYJOB",
                jobid: "JOB123",
                status: "OUTPUT",
                retcode: "CC 0000"
            };


            MonitorJobs.waitForJobOutputStatus = jest.fn((session, jobToWaitFor) => {
                return completedJob;
            });

            SubmitJobs.checkSubmitOptions = jest.fn((session, parms) => {
                return MonitorJobs.waitForJobOutputStatus(session, parms);
            });
            // The handler should fail
            const theDataSet = "DATA.SET";
            const copy = Object.assign({}, DEFAULT_PARAMETERS);
            copy.arguments.dataset = theDataSet;
            copy.arguments.waitForOutput = true;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(SubmitJobs.checkSubmitOptions).toHaveBeenCalledTimes(1);
            expect(MonitorJobs.waitForJobOutputStatus).toHaveBeenCalledTimes(1);
            expect(dataSetSpecified).toBe(theDataSet);
        });

        it("should submit JCL contained within a data-set if requested and wait for active", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let dataSetSpecified;

            // Mock the submit JCL function
            SubmitJobs.submitJobCommon = jest.fn((session, dataset) => {
                dataSetSpecified = dataset.jobDataSet;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });

            const completedJob: any = {
                jobname: "MYJOB",
                jobid: "JOB123",
                status: "OUTPUT",
                retcode: "CC 0000"
            };


            MonitorJobs.waitForStatusCommon = jest.fn((session, jobToWaitFor) => {
                return completedJob;
            });

            SubmitJobs.checkSubmitOptions = jest.fn((session, parms) => {
                return MonitorJobs.waitForStatusCommon(session, parms);
            });
            // The handler should fail
            const theDataSet = "DATA.SET";
            const copy = Object.assign({}, DEFAULT_PARAMETERS);
            copy.arguments.dataset = theDataSet;
            copy.arguments.waitForActive = true;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(SubmitJobs.checkSubmitOptions).toHaveBeenCalledTimes(1);
            expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledTimes(1);
            expect(dataSetSpecified).toBe(theDataSet);
        });

        it("should submit JCL contained within a uss-file if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let ussFileSpecified;

            // Mock the submit JCL function
            SubmitJobs.submitJobCommon = jest.fn((session, opts) => {
                ussFileSpecified = opts.jobUSSFile;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });

            // The handler should fail
            const theFile = "/a/the/file.txt";
            const copy = Object.assign({}, USSFILE_PARAMETERS);
            copy.arguments.ussFile = theFile;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(ussFileSpecified).toBe(theFile);
        });

        it("should submit JCL contained within a uss-file if requested and wait for output", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let ussFileSpecified;

            // Mock the submit JCL function
            SubmitJobs.submitJobCommon = jest.fn((session, opts) => {
                ussFileSpecified = opts.jobUSSFile;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });

            const completedJob: any = {
                jobname: "MYJOB",
                jobid: "JOB123",
                status: "OUTPUT",
                retcode: "CC 0000"
            };


            MonitorJobs.waitForJobOutputStatus = jest.fn((session, jobToWaitFor) => {
                return completedJob;
            });

            SubmitJobs.checkSubmitOptions = jest.fn((session, parms) => {
                return MonitorJobs.waitForJobOutputStatus(session, parms);
            });
            // The handler should fail
            const theFile = "/a/the/file.txt";
            const copy = Object.assign({}, USSFILE_PARAMETERS);
            copy.arguments.ussFile = theFile;
            copy.arguments.waitForOutput = true;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(SubmitJobs.checkSubmitOptions).toHaveBeenCalledTimes(1);
            expect(MonitorJobs.waitForJobOutputStatus).toHaveBeenCalledTimes(1);
            expect(ussFileSpecified).toBe(theFile);
        });

        it("should submit JCL contained within a uss-file if requested and wait for active", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let ussFileSpecified;

            // Mock the submit JCL function
            SubmitJobs.submitJobCommon = jest.fn((session, opts) => {
                ussFileSpecified = opts.jobUSSFile;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });

            const completedJob: any = {
                jobname: "MYJOB",
                jobid: "JOB123",
                status: "OUTPUT",
                retcode: "CC 0000"
            };


            MonitorJobs.waitForStatusCommon = jest.fn((session, jobToWaitFor) => {
                return completedJob;
            });

            SubmitJobs.checkSubmitOptions = jest.fn((session, parms) => {
                return MonitorJobs.waitForStatusCommon(session, parms);
            });
            // The handler should fail
            const theFile = "/a/the/file.txt";
            const copy = Object.assign({}, USSFILE_PARAMETERS);
            copy.arguments.ussFile = theFile;
            copy.arguments.waitForActive = true;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(SubmitJobs.checkSubmitOptions).toHaveBeenCalledTimes(1);
            expect(MonitorJobs.waitForStatusCommon).toHaveBeenCalledTimes(1);
            expect(ussFileSpecified).toBe(theFile);
        });

        it("should submit JCL contained within a local-file if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let LocalFileSpecified: ISubmitParms;

            // Local file
            const theLocalFile: string = "test.txt";

            // Mock the submit JCL function
            SubmitJobs.submitJclString = jest.fn((session, localFile) => {
                LocalFileSpecified = localFile;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });

            // The handler should fail
            const badJCL: Buffer = Buffer.from("Bad JCL");
            IO.createFileSync(theLocalFile);
            IO.writeFile(theLocalFile, badJCL);

            const copy = Object.assign({}, LOCALFILE_PARAMETERS);
            copy.arguments.localFile = theLocalFile;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJclString).toHaveBeenCalledTimes(1);
            expect(LocalFileSpecified).toBe(`${badJCL}`);
            IO.deleteFile(theLocalFile);
        });
    });
});
