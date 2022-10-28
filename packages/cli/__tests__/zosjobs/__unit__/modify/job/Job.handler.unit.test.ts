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
import { IJobFeedback, ModifyJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import * as ModifyDefintion from "../../../../../src/zosjobs/modify/job/Job.definition";
import * as ModifyHandler from "../../../../../src/zosjobs/modify/job/Job.handler";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "modify", "job"],
    definition: ModifyDefintion.JobDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

const SUCCESS_FEEDBACK: IJobFeedback = {
    "job-correlator": "J0007913USILCA11DC4DAED0.......:",
    "class": "A",
    "jobid": 'JOB01234',
    "message": 'Request was successful.',
    "owner": "AT0000",
    "status": "0",
    "member": "",
    "sysname": "",
    "internal-code": "",
    "original-jobid": ""
};

describe("modify job handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("successful response", () => {
        it("should be able to modify class of job", async () => {
            // faking out function with the correct signature
            ModifyJobs.modifyJob = jest.fn(async (session, jobname, jobid, jobclass) => {
                return SUCCESS_FEEDBACK;
            });
            const handler = new ModifyHandler.default();
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.jobid = "JOB01234";
            params.arguments.jobname = "AT0000";
            params.arguments.jobclass = "A";
            await handler.process(params);
            expect(ModifyJobs.modifyJob).toHaveBeenCalledTimes(1);
            expect(ModifyJobs.modifyJobForJob).toHaveBeenCalledTimes(1);
            expect(ModifyJobs.modifyJobCommon).toHaveBeenCalledTimes(1);
            expect(ModifyJobs.modifyJob).toHaveReturnedWith(SUCCESS_FEEDBACK);
        });
    });

    describe("error handling", () => {
        it("should be able respond with error message if any error", async () => {
            const failMessage = "You fail";
            let error;
            ModifyJobs.modifyJob = jest.fn(async (session, jobname, jobid, jobclass) => {
                throw new ImperativeError({msg: failMessage});
            });
            const handler = new ModifyHandler.default();
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.jobid = "JOB01234";
            params.arguments.jobname = "AT0000";
            params.arguments.jobclass = "A";
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
    });
});
