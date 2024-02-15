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
import { SearchJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import * as JobHandler from "../../../../../src/zosjobs/search/job/Job.handler";
import * as JobDefinition from "../../../../../src/zosjobs/search/job/Job.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";

const mockSearchData: string = "This job contains RC=0000";

// Mocked parameters for the unit tests
const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "search", "job"],
    definition: JobDefinition.JobDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("search job handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to search job spool", async () => {
        SearchJobs.searchJobs = jest.fn(async (session, searchParms) => {
            return mockSearchData;
        });
        const handler = new JobHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobname = "j12345";
        params.arguments.searchString = "RC=0000";
        await handler.process(params);
        expect(SearchJobs.searchJobs).toHaveBeenCalledTimes(1);
    });

    it("should be able respond with error message", async () => {
        const failMessage = "You fail";
        let error;
        SearchJobs.searchJobs = jest.fn(async (session, searchParms) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new JobHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobname = "j12345";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(SearchJobs.searchJobs).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
