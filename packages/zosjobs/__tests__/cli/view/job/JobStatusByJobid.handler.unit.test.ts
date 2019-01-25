/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

jest.mock("../../../../src/api/GetJobs");
import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile } from "@brightside/imperative";
import { GetJobs } from "../../../../src/api/GetJobs";
import { GetJobsData } from "../../../__resources__/api/GetJobsData";
import * as JobStatusByJobidHandler from "../../../../src/cli/view/job-status-by-jobid/JobStatusByJobid.handler";
import * as JobStatusByJobidDefinition from "../../../../src/cli/view/job-status-by-jobid/JobStatusByJobid.definition";

process.env.FORCE_COLOR = "0";

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        host: "somewhere.com",
        port: "43443",
        user: "someone",
        pass: "somesecret"
    }]
);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);

const DEFAULT_PARAMETERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-jobs", "view", "job"],
    },
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }),
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            })
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
    definition: JobStatusByJobidDefinition.JobStatusByJobidDefinition,
    fullDefinition: JobStatusByJobidDefinition.JobStatusByJobidDefinition,
    profiles: PROFILES
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
