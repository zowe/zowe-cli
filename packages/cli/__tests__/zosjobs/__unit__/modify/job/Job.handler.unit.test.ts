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
import { IHandlerParameters, ImperativeError } from "@zowe/imperative";
import { GetJobs, IJob, IJobFeedback, ModifyJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import * as ModifyDefintion from "../../../../../src/zosjobs/modify/job/Job.definition";
import * as ModifyHandler from "../../../../../src/zosjobs/modify/job/Job.handler";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "modify", "job"],
    definition: ModifyDefintion.JobDefinition
});

const SAMPLE_COMPLETE_JOB: IJob= {
    "class": "C",
    "files-url": "https://tso1:443/zosmf/restjobs/jobs/J0003781USILDAMDD3CE8146.......%3A/files",
    "job-correlator": "J0007913USILCA11DC4DAED0.......:",
    "jobid": "JOB01234",
    "jobname": "AT0000",
    "owner": "AT0000",
    "phase": 130,
    "phase-name": "Job is actively converting",
    "retcode": "",
    "status": "0",
    "subsystem": "JES2",
    "type": "JOB",
    "url": "https://tso1:443/zosmf/restjobs/jobs/J0003781USILDAMDD3CE8146.......%3A",
    "exec-started": '2024-01-02T15:57:58.350Z',
    "exec-ended": '2024-01-02T15:58:00.600Z',
    "exec-member": 'SYS1',
    "exec-system": 'SYS1',
    "exec-submitted": '2024-01-02T15:58:00.600Z'
};

const SUCCESS_FEEDBACK: IJobFeedback = {
    "job-correlator": "J0007913USILCA11DC4DAED0.......:",
    "jobname": "AT0000",
    "jobid": 'JOB01234',
    "message": 'Successful.',
    "owner": "AT0000",
    "status": "0",
    "member": "",
    "sysname": "",
    "internal-code": "",
    "original-jobid": ""
};

const fakeJobName = "FAKEJBNM";
const fakeJobID = "JOB01234";
const fakeJobClass = "C";
const fakeJobClassChange = "A";

describe("modify job handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("successful response", () => {
        it("should be able to modify class of job", async () => {
            GetJobs.getJob = jest.fn().mockResolvedValue({fakeJobName, class: fakeJobClass});
            ModifyJobs.modifyJob = jest.fn(async (_session, {jobname: _jobname, jobid: _jobid}, {jobclass: _jobclass}) => {
                return SUCCESS_FEEDBACK;
            });
            const handler = new ModifyHandler.default();
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.jobid = fakeJobID;
            params.arguments.jobname = fakeJobName;
            params.arguments.jobclass = fakeJobClassChange;
            params.arguments.hold = false;
            params.arguments.release = false;
            await handler.process(params);
            expect(ModifyJobs.modifyJob).toHaveBeenCalledTimes(1);
            expect(SUCCESS_FEEDBACK.message).toContain("Successful.");
        });
        it("should be able to hold a job", async () => {
            GetJobs.getJob = jest.fn().mockResolvedValue({fakeJobName, class: fakeJobClass});
            ModifyJobs.modifyJob = jest.fn(async (_session, {
                jobname: _jobname,
                jobid: _jobid
            }, {
                jobclass: _jobclass,
                hold: _hold,
                release: _release
            }) => {
                return SUCCESS_FEEDBACK;
            });
            ModifyJobs.modifyJobCommon = jest.fn().mockResolvedValue(SUCCESS_FEEDBACK);
            const handler = new ModifyHandler.default();
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.jobid = fakeJobID;
            params.arguments.jobname = fakeJobName;
            params.arguments.hold = true;
            params.arguments.release = false;
            await handler.process(params);
            expect(ModifyJobs.modifyJob).toHaveBeenCalledTimes(1);
            expect(SUCCESS_FEEDBACK.message).toContain("Successful.");
        });

        it("should be able to release a job", async () => {
            GetJobs.getJob = jest.fn().mockResolvedValue({fakeJobName, class: fakeJobClass});
            ModifyJobs.modifyJob = jest.fn(async (_session, {jobname: _jobname, jobid: _jobid}, {jobclass: _jobclass}) => {
                return SUCCESS_FEEDBACK;
            });
            const handler = new ModifyHandler.default();
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.jobid = fakeJobID;
            params.arguments.jobname = fakeJobName;
            params.arguments.hold = false;
            params.arguments.release = true;
            await handler.process(params);
            expect(ModifyJobs.modifyJob).toHaveBeenCalledTimes(1);
            expect(SUCCESS_FEEDBACK.message).toContain("Successful.");
        });
    });

    describe("error handling", () => {
        it("should be able respond with error message if any error", async () => {
            const failMessage = "You fail";
            let error;
            GetJobs.getJob = jest.fn(async (_session, _jobid) => {
                return SAMPLE_COMPLETE_JOB;
            });
            ModifyJobs.modifyJob = jest.fn(async (_session, {jobname: _jobname, jobid: _jobid}, {jobclass: _jobclass}) => {
                throw new ImperativeError({msg: failMessage});
            });
            const handler = new ModifyHandler.default();
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.jobid = fakeJobID;
            params.arguments.jobname = fakeJobName;
            params.arguments.jobclass = fakeJobClassChange;
            try {
                await handler.process(params);
            } catch (thrownError) {
                error = thrownError;
            }
            expect(ModifyJobs.modifyJob).toHaveBeenCalledTimes(1);
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toBe(failMessage);
        });

        it("should be able respond with error message if no jobid", async () => {
            const failMessage = "Missing Positional Argument: jobid";
            let error;
            GetJobs.getJob = jest.fn(async (_session, _jobid) => {
                return SAMPLE_COMPLETE_JOB;
            });
            ModifyJobs.modifyJob = jest.fn(async (_session, {jobname: _jobname, jobid: _jobid}, {jobclass: _jobclass}) => {
                throw new Error(failMessage);
            });
            const handler = new ModifyHandler.default();
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.jobname = fakeJobName;
            params.arguments.jobclass = fakeJobClassChange;
            try {
                await handler.process(params);
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toContain(failMessage);
        });

        it("should send error if an issue with modifying class||hold||release", async () => {
            const failMessage = "Modification Error";
            let error;
            GetJobs.getJob = jest.fn(async (_session, _jobid) => {
                return SAMPLE_COMPLETE_JOB;
            });
            ModifyJobs.modifyJob = jest.fn(async (_session, {jobname: _jobname, jobid: _jobid}, {jobclass: _jobclass}) => {
                throw new Error(failMessage);
            });
            const handler = new ModifyHandler.default();
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.jobid = fakeJobID;
            params.arguments.jobname = fakeJobName;
            params.arguments.class = undefined;
            params.arguments.hold = false;
            params.arguments.release = false;
            try {
                await handler.process(params);
            } catch (thrownError) {
                error = thrownError;
            }
            expect(error.message).toContain(failMessage);
        });
    });
});