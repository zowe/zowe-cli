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
import { IHandlerParameters, ImperativeError, Session } from "@zowe/core-for-zowe-sdk";
import { GetJobs, DeleteJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { GetJobsData } from "../../../__resources__/GetJobsData";
import * as OldJobsHandler from "../../../../../src/zosjobs/delete/old-jobs/OldJobs.handler";
import * as OldJobsDefinition from "../../../../../src/zosjobs/delete/old-jobs/OldJobs.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "delete", "old-jobs"],
    definition: OldJobsDefinition.OldJobsDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("delete old-jobs handler tests", () => {
    it("should delete all jobs using defaults sequentially", async () => {
        let passedSession: Session;
        GetJobs.getJobsByPrefix = jest.fn(async (session, prefix) => {
            passedSession = session;
            return GetJobsData.SAMPLE_JOBS;
        });
        DeleteJobs.deleteJobForJob = jest.fn(async (session, job): Promise<any> => {
            return;
        });
        const handler = new OldJobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.maxConcurrentRequests = 1;
        await handler.process(params);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledTimes(1);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledWith(passedSession, "*");
        expect(DeleteJobs.deleteJobForJob).toHaveBeenCalledTimes(GetJobsData.SAMPLE_JOBS.length);
        expect(DeleteJobs.deleteJobForJob).toHaveBeenLastCalledWith(
            passedSession, GetJobsData.SAMPLE_JOBS[GetJobsData.SAMPLE_JOBS.length - 1], undefined);
    });

    it("should delete all jobs using defaults in parallel", async () => {
        let passedSession: Session;
        GetJobs.getJobsByPrefix = jest.fn(async (session, prefix) => {
            passedSession = session;
            return GetJobsData.SAMPLE_JOBS;
        });
        DeleteJobs.deleteJobForJob = jest.fn(async (session, job): Promise<any> => {
            return;
        });
        const handler = new OldJobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.maxConcurrentRequests = 0;
        await handler.process(params);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledTimes(1);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledWith(passedSession, "*");
        expect(DeleteJobs.deleteJobForJob).toHaveBeenCalledTimes(GetJobsData.SAMPLE_JOBS.length);
        expect(DeleteJobs.deleteJobForJob).toHaveBeenLastCalledWith(
            passedSession, GetJobsData.SAMPLE_JOBS[GetJobsData.SAMPLE_JOBS.length - 1], undefined);
    });

    it("should delete jobs with a specific prefix", async () => {
        let passedSession: Session;
        GetJobs.getJobsByPrefix = jest.fn(async (session, prefix) => {
            passedSession = session;
            return GetJobsData.SAMPLE_JOBS;
        });
        DeleteJobs.deleteJobForJob = jest.fn(async (session, job): Promise<any> => {
            return;
        });
        const handler = new OldJobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.prefix = "TESTPRFX";
        await handler.process(params);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledTimes(1);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledWith(passedSession, "TESTPRFX");
        expect(DeleteJobs.deleteJobForJob).toHaveBeenCalledTimes(GetJobsData.SAMPLE_JOBS.length);
        expect(DeleteJobs.deleteJobForJob).toHaveBeenLastCalledWith(
            passedSession, GetJobsData.SAMPLE_JOBS[GetJobsData.SAMPLE_JOBS.length - 1], undefined);
    });

    it("should delete jobs with modifyVersion 2.0", async () => {
        let passedSession: Session;
        GetJobs.getJobsByPrefix = jest.fn(async (session, prefix) => {
            passedSession = session;
            return GetJobsData.SAMPLE_JOBS;
        });
        DeleteJobs.deleteJobForJob = jest.fn(async (session, job): Promise<any> => {
            return;
        });
        const handler = new OldJobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.modifyVersion = "2.0";
        await handler.process(params);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledTimes(1);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledWith(passedSession, "*");
        expect(DeleteJobs.deleteJobForJob).toHaveBeenCalledTimes(GetJobsData.SAMPLE_JOBS.length);
        expect(DeleteJobs.deleteJobForJob).toHaveBeenLastCalledWith(
            passedSession, GetJobsData.SAMPLE_JOBS[GetJobsData.SAMPLE_JOBS.length - 1], "2.0");
    });

    it("should not delete jobs when none are found", async () => {
        let passedSession: Session;
        GetJobs.getJobsByPrefix = jest.fn(async (session, prefix) => {
            passedSession = session;
            return [];
        });
        DeleteJobs.deleteJobForJob = jest.fn(async (session, job): Promise<any> => {
            return;
        });
        const handler = new OldJobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        await handler.process(params);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledTimes(1);
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledWith(passedSession, "*");
        expect(DeleteJobs.deleteJobForJob).toHaveBeenCalledTimes(0);
    });

    it("should not transform an error from the zosmf rest client", async () => {
        const failMessage = "You fail in z/OSMF";
        let error;
        GetJobs.getJobsByPrefix = jest.fn((session, jobid) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new OldJobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should not transform an error from the DeleteJobs API class", async () => {
        const failMessage = "You fail in DeleteJobs";
        let error;
        GetJobs.getJobsByPrefix = jest.fn(async (session, jobid) => {
            return GetJobsData.SAMPLE_JOBS;
        });
        DeleteJobs.deleteJobForJob = jest.fn((session, job) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new OldJobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.maxConcurrentRequests = 1;
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledTimes(1);
        expect(DeleteJobs.deleteJobForJob).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should throw an error when modifyVersion is 2.0 and response status is non-zero", async () => {
        GetJobs.getJobsByPrefix = jest.fn(async (session, prefix) => {
            return GetJobsData.SAMPLE_JOBS;
        });
        DeleteJobs.deleteJobForJob = jest.fn(async (session, job): Promise<any> => {
            return { status: "1" };
        });
        const handler = new OldJobsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        let caughtError;
        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }
        expect(GetJobs.getJobsByPrefix).toHaveBeenCalledTimes(1);
        expect(DeleteJobs.deleteJobForJob).toHaveBeenCalledTimes(1);
        expect(caughtError).toBeDefined();
        expect(caughtError instanceof ImperativeError).toBe(true);
        expect(caughtError.message).toMatchSnapshot();
    });
});
