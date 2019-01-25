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
import { IProfile, CommandProfiles, IHandlerParameters, ImperativeError } from "@brightside/imperative";
import { GetJobs } from "../../../../src/api/GetJobs";
import { GetJobsData } from "../../../__resources__/api/GetJobsData";
import { SpoolFilesByJobidDefinition } from "../../../../src/cli/list/spool-files-by-jobid/SpoolFilesByJobid.definition";
import * as SpoolFilesHandler from "../../../../src/cli/list/spool-files-by-jobid/SpoolFilesByJobid.handler";

// Disable coloring for the snapshots
process.env.FORCE_COLOR = "0";

// Dummy profile map (for profiles.get("zosmf"))
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

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-jobs", "list", "spool-files"],
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
                expect(logs).toMatchSnapshot();
            }),
            error: jest.fn((errors) => {
                expect(errors).toMatchSnapshot();
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
    definition: SpoolFilesByJobidDefinition,
    fullDefinition: SpoolFilesByJobidDefinition,
    profiles: PROFILES
};

describe("zos-jobs list spool-files-by-jobid handler", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to get spool files", async () => {
        GetJobs.getJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        GetJobs.getSpoolFilesForJob = jest.fn((session, ijob) => {
            return GetJobsData.SAMPLE_SPOOL_FILES;
        });
        const handler = new SpoolFilesHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        params.arguments.jobid = "j12345";
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolFilesForJob).toHaveBeenCalledTimes(1);
    });

    it("should not transform an error thrown from get jobs getJob API", async () => {
        const failMessage = "You fail";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            throw new ImperativeError({ msg: failMessage});
        });
        const handler = new SpoolFilesHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
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

    it("should not transform an error thrown from get jobs getSpoolFilesForJob API", async () => {
        const failMessage = "You fail";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        GetJobs.getSpoolFilesForJob = jest.fn((session, jobid) => {
            throw new ImperativeError({ msg: failMessage});
        });
        const handler = new SpoolFilesHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        params.arguments.jobid = "j12345";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolFilesForJob).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
