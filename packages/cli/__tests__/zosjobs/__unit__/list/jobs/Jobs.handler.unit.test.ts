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

import { IGetJobsParms } from "../../../../../..";

jest.mock("../../../../../../../packages/zosjobs/src/GetJobs");
import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile, Session } from "@zowe/imperative";
import { GetJobs } from "../../../../../../../packages/zosjobs/src/GetJobs";
import { GetJobsData } from "../../../../../../../packages/zosjobs/__tests__/__resources__/api/GetJobsData";
import * as JobsHandler from "../../../../src/list/jobs/Jobs.handler";
import * as JobsDefinition from "../../../../src/list/jobs/Jobs.definition";

process.env.FORCE_COLOR = "0";

const ZOSMF_PROF_OPTS = {
    host: "somewhere.com",
    port: "43443",
    user: "someone",
    password: "somesecret"
};

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        ...ZOSMF_PROF_OPTS
    }]
);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);

const DEFAULT_PARAMETERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-jobs", "view", "job"],
        ...ZOSMF_PROF_OPTS
    },
    positionals: ["zos-jobs", "view", "job"],
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }),
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            }),
            setExitCode: jest.fn()
        },
        console: {
            log: jest.fn((logs) => {
                expect(logs.toString()).toMatchSnapshot();
            }),
            error: jest.fn((errors) => {
                expect(errors.toString()).toMatchSnapshot();
            }),
            errorHeader: jest.fn(() => undefined)
        },
        progress: {
            startBar: jest.fn((parms) => undefined),
            endBar: jest.fn(() => undefined)
        },
        format: {
            output: jest.fn((parms) => {
                expect(parms).toMatchSnapshot();
            })
        }
    },
    definition: JobsDefinition.JobsDefinition,
    fullDefinition: JobsDefinition.JobsDefinition,
    profiles: PROFILES
};

describe("list jobs handler tests", () => {
    it("should be able to get a list of jobs using defaults", async () => {
        let passedSession: Session;
        let passedParms: IGetJobsParms;
        GetJobs.getJobsCommon = jest.fn((session, parms) => {
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
        let passedSession: Session;
        let passedParms: IGetJobsParms;
        GetJobs.getJobsCommon = jest.fn((session, parms) => {
            passedSession = session;
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
        let passedSession: Session;
        let passedParms: IGetJobsParms;
        GetJobs.getJobsCommon = jest.fn((session, parms) => {
            passedSession = session;
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
        GetJobs.getJobsCommon = jest.fn(async (session, parms) => {
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
