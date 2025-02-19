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

import { IGetJobsParms, GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { GetJobsData } from "../../../__resources__/GetJobsData";

jest.mock("@zowe/zos-jobs-for-zowe-sdk");
import { IHandlerParameters, ImperativeError, Session } from "@zowe/imperative";
import * as JobsHandler from "../../../../../src/zosjobs/list/jobs/Jobs.handler";
import * as JobsDefinition from "../../../../../src/zosjobs/list/jobs/Jobs.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "view", "job"],
    definition: JobsDefinition.JobsDefinition
});

describe("list jobs handler tests", () => {
    it("should be able to get a list of jobs using defaults", async () => {
        let passedSession: Session;
        let passedParms: IGetJobsParms;
        GetJobs.getJobsCommon = jest.fn(async (session, parms) => {
            passedSession = session;
            passedParms = parms;
            return GetJobsData.SAMPLE_JOBS;
        });
        const handler = new JobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        await handler.process(params);
        expect(GetJobs.getJobsCommon).toHaveBeenCalledTimes(1);
        expect(GetJobs.getJobsCommon).toHaveBeenCalledWith(passedSession, passedParms);
    });

    it("should be able to get a list of jobs for a specific owner", async () => {
        let passedParms: IGetJobsParms;
        GetJobs.getJobsCommon = jest.fn(async (_session, parms) => {
            passedParms = parms;
            return GetJobsData.SAMPLE_JOBS;
        });
        const handler = new JobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.owner = "TESTOWN";
        await handler.process(params);
        expect(GetJobs.getJobsCommon).toHaveBeenCalledTimes(1);
        expect(passedParms.owner).toBe(params.arguments.owner);
    });

    it("should be able to get a list of jobs for a specific prefix", async () => {
        let passedParms: IGetJobsParms;
        GetJobs.getJobsCommon = jest.fn(async (_session, parms) => {
            passedParms = parms;
            return GetJobsData.SAMPLE_JOBS;
        });
        const handler = new JobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.prefix = "TESTPRFX";
        await handler.process(params);
        expect(GetJobs.getJobsCommon).toHaveBeenCalledTimes(1);
        expect(passedParms.prefix).toBe(params.arguments.prefix);

    });

    it("should not transform an error from the zosmf rest client", async () => {
        const failMessage = "You fail";
        let error;
        GetJobs.getJobsCommon = jest.fn(async (_session, _parms) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new JobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJobsCommon).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
