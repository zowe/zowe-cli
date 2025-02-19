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
import { MonitorJobs, SubmitJobs, ISubmitJobUSSParms, ISubmitJobParms } from "@zowe/zos-jobs-for-zowe-sdk";
import { IHandlerParameters, ImperativeError, IO } from "@zowe/imperative";
import * as SubmitDefinition from "../../../../src/zosjobs/submit/Submit.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";
let DEFAULT_PARAMETERS: IHandlerParameters;
let USSFILE_PARAMETERS: IHandlerParameters;
let LOCALFILE_PARAMETERS: IHandlerParameters;

describe("submit shared handler", () => {
    beforeEach(() => {
        DEFAULT_PARAMETERS = mockHandlerParameters({
            arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
            positionals: ["zos-jobs", "submit", "data-set"],
            definition: SubmitDefinition.SubmitDefinition
        });

        USSFILE_PARAMETERS = mockHandlerParameters({
            arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
            positionals: ["zos-jobs", "submit", "uss-file"],
            definition: SubmitDefinition.SubmitDefinition
        });

        LOCALFILE_PARAMETERS = mockHandlerParameters({
            arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
            positionals: ["zos-jobs", "submit", "local-file"],
            definition: SubmitDefinition.SubmitDefinition
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

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
            expect(error.message).toContain("Unable to determine the JCL source. Please contact support");
        });

        it("should return any caught error, ie: ENOENT", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;

            // Local file doesn't exist and should be cause of failure
            const theLocalFile: string = "fakefile";

            const copy = Object.assign({}, LOCALFILE_PARAMETERS);
            copy.arguments.localFile = theLocalFile;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(ImperativeError);
            expect(error.message).toContain("Node.js File System API error");
            expect(error.additionalDetails).toContain("ENOENT: no such file or directory, open");
            expect(error.additionalDetails).toContain("fakefile");
        });

        it("should not transform an error thrown by the submit JCL API", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Mock the submit JCL function
            const errMsg = "YOUR JCL IS BAD!";
            let dataSetSpecified: string;
            SubmitJobs.submitJobCommon = jest.fn((session, dataset: ISubmitJobParms) => {
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
            SubmitJobs.submitJobCommon = jest.fn(async (session, dataset: ISubmitJobParms): Promise<any> => {
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
            SubmitJobs.submitJobCommon = jest.fn(async (session, dataset: ISubmitJobParms): Promise<any> => {
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


            MonitorJobs.waitForJobOutputStatus = jest.fn((_session, _jobToWaitFor) => {
                return completedJob;
            });

            SubmitJobs.checkSubmitOptions = jest.fn((session, parms) => {
                return MonitorJobs.waitForJobOutputStatus(session, parms as any);
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
            SubmitJobs.submitJobCommon = jest.fn(async (session, dataset: ISubmitJobParms): Promise<any> => {
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


            MonitorJobs.waitForStatusCommon = jest.fn((_session, _jobToWaitFor) => {
                return completedJob;
            });

            SubmitJobs.checkSubmitOptions = jest.fn((session, parms) => {
                return MonitorJobs.waitForStatusCommon(session, parms as any);
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

        it("should submit JCL contained within a data-set if requested and view all spool content", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let dataSetSpecified;

            // Mock the submit JCL function
            SubmitJobs.submitJobCommon = jest.fn(async (session, dataset: ISubmitJobParms): Promise<any> => {
                dataSetSpecified = dataset.jobDataSet;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });
            SubmitJobs.checkSubmitOptions = jest.fn(async (_session, _parms): Promise<any> => {
                return [{
                    ddName: "fakeDD1",
                    id: 1,
                    stepName: "fakeStep1",
                    data: "FakeData1"
                }, {
                    ddName: "fakeDD2",
                    id: 2,
                    stepName: "fakeStep2",
                    data: "FakeData2"
                }];
            });

            // The handler should fail
            const theDataSet = "DATA.SET";
            const copy = Object.assign({}, DEFAULT_PARAMETERS);
            copy.arguments.dataset = theDataSet;
            copy.arguments.viewAllSpoolContent = true;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(copy.response.console.log).toHaveBeenCalledTimes(4);
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
            SubmitJobs.submitJobCommon = jest.fn(async (session, opts: ISubmitJobUSSParms): Promise<any> => {
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
            copy.arguments.file = theFile;
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
            SubmitJobs.submitJobCommon = jest.fn(async (session, opts: ISubmitJobUSSParms): Promise<any> => {
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


            MonitorJobs.waitForJobOutputStatus = jest.fn((_session, _jobToWaitFor) => {
                return completedJob;
            });

            SubmitJobs.checkSubmitOptions = jest.fn((session, parms) => {
                return MonitorJobs.waitForJobOutputStatus(session, parms as any);
            });
            // The handler should fail
            const theFile = "/a/the/file.txt";
            const copy = Object.assign({}, USSFILE_PARAMETERS);
            copy.arguments.file = theFile;
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
            SubmitJobs.submitJobCommon = jest.fn(async (session, opts: ISubmitJobUSSParms): Promise<any> => {
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


            MonitorJobs.waitForStatusCommon = jest.fn((_session, _jobToWaitFor) => {
                return completedJob;
            });

            SubmitJobs.checkSubmitOptions = jest.fn((session, parms) => {
                return MonitorJobs.waitForStatusCommon(session, parms as any);
            });
            // The handler should fail
            const theFile = "/a/the/file.txt";
            const copy = Object.assign({}, USSFILE_PARAMETERS);
            copy.arguments.file = theFile;
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

        it("should submit JCL contained within a uss-file if requested and view all spool content", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let ussFileSpecified;

            // Mock the submit JCL function
            SubmitJobs.submitJobCommon = jest.fn(async (session, opts: ISubmitJobUSSParms): Promise<any> => {
                ussFileSpecified = opts.jobUSSFile;
                return {
                    jobname: "MYJOB",
                    jobid: "JOB123",
                    status: "INPUT",
                    retcode: "UNKNOWN"
                };
            });
            SubmitJobs.checkSubmitOptions = jest.fn(async (_session, _parms): Promise<any> => {
                return [{
                    ddName: "fakeDD1",
                    id: 1,
                    stepName: "fakeStep1",
                    data: "FakeData1"
                }, {
                    ddName: "fakeDD2",
                    id: 2,
                    stepName: "fakeStep2",
                    data: "FakeData2"
                }];
            });

            // The handler should fail
            const theFile = "/a/the/file.txt";
            const copy = Object.assign({}, USSFILE_PARAMETERS);
            copy.arguments.file = theFile;
            copy.arguments.viewAllSpoolContent = true;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJobCommon).toHaveBeenCalledTimes(1);
            expect(copy.response.console.log).toHaveBeenCalledTimes(4);
            expect(ussFileSpecified).toBe(theFile);
        });

        it("should submit JCL contained within a local-file if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let LocalFileSpecified: string;

            // Local file
            const theLocalFile: string = "test.txt";

            // Mock the submit JCL function
            SubmitJobs.submitJclString = jest.fn(async (session, localFile): Promise<any> => {
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

        it("should submit JCL contained within a local-file if requested with additional parameters", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let LocalFileSpecified: string;

            // Local file
            const theLocalFile: string = "test.txt";

            // Mock the submit JCL function
            const submitJclStringSpy = jest.spyOn(SubmitJobs, "submitJclString").mockImplementation(async (session, localFile): Promise<any> => {
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
            copy.arguments.jobEncoding = "IBM-037";
            copy.arguments.jobRecordLength = 80;
            copy.arguments.jobRecordFormat = "F";
            copy.arguments.localFile = theLocalFile;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJclString).toHaveBeenCalledTimes(1);
            expect(submitJclStringSpy.mock.calls[0][2]).toEqual(
                expect.objectContaining({internalReaderFileEncoding: "IBM-037", internalReaderLrecl: "80", internalReaderRecfm: "F"})
            );
            expect(LocalFileSpecified).toBe(`${badJCL}`);
            IO.deleteFile(theLocalFile);
        });

        it("should submit JCL contained within a local-file if requested and view all spool content", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/zosjobs/submit/Submit.shared.handler");
            const handler = new handlerReq.default();

            // Vars populated by the mocked function
            let error;
            let LocalFileSpecified: string;

            // Local file
            const theLocalFile: string = "test.txt";

            // Mock the submit JCL function
            SubmitJobs.submitJclString = jest.fn(async (session, localFile): Promise<any> => {
                LocalFileSpecified = localFile;
                return [{
                    ddName: "fakeDD1",
                    id: 1,
                    stepName: "fakeStep1",
                    data: "FakeData1"
                }, {
                    ddName: "fakeDD2",
                    id: 2,
                    stepName: "fakeStep2",
                    data: "FakeData2"
                }];
            });

            // The handler should fail
            const badJCL: Buffer = Buffer.from("Bad JCL");
            IO.createFileSync(theLocalFile);
            IO.writeFile(theLocalFile, badJCL);

            const copy = Object.assign({}, LOCALFILE_PARAMETERS);
            copy.arguments.localFile = theLocalFile;
            copy.arguments.viewAllSpoolContent = true;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(copy);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(SubmitJobs.submitJclString).toHaveBeenCalledTimes(1);
            expect(copy.response.console.log).toHaveBeenCalledTimes(4);
            expect(LocalFileSpecified).toBe(`${badJCL}`);
            IO.deleteFile(theLocalFile);
        });
    });
});
