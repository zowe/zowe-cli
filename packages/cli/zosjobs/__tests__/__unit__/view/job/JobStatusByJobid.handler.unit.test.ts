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

jest.mock("../../../../src/api/GetJobs");
import { IHandlerParameters, ImperativeError, IProfile } from "@zowe/imperative";
import { GetJobs } from "../../../../../../../packages/zosjobs/src/GetJobs";
import { GetJobsData } from "../../../../../../../packages/zosjobs/__tests__/__resources__/api/GetJobsData";
import * as JobStatusByJobidHandler from "../../../../src/view/job-status-by-jobid/JobStatusByJobid.handler";
import * as JobStatusByJobidDefinition from "../../../../src/view/job-status-by-jobid/JobStatusByJobid.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF,
    getMockedResponse
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

process.env.FORCE_COLOR = "0";

// Mocked parameters for the unit tests
const DEFAULT_PARAMETERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-jobs", "view", "job"],
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    positionals: ["zos-jobs", "view", "job"],
    response: getMockedResponse(),
    definition: JobStatusByJobidDefinition.JobStatusByJobidDefinition,
    fullDefinition: JobStatusByJobidDefinition.JobStatusByJobidDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
};

describe("view job-status-by-jobid handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to get a job", async () => {
        GetJobs.getJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        const handler = new JobStatusByJobidHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "j12345";
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
    });

    it("should be able respond with error message", async () => {
        const failMessage = "You fail";
        let error;
        GetJobs.getJob = jest.fn(async (session, jobid) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new JobStatusByJobidHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "j12345";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
