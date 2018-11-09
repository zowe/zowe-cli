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

import { DownloadJobs, IDownloadAllSpoolContentParms } from "../../../../index";

jest.mock("../../../../src/api/GetJobs");
import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile, Session } from "@brightside/imperative";
import { GetJobs } from "../../../../src/api/GetJobs";
import { GetJobsData } from "../../../__resources__/api/GetJobsData";
import * as OutputHandler from "../../../../src/cli/download/download-output/Output.handler";
import * as OutputDefinition from "../../../../src/cli/download/download-output/Output.definition";

process.env.FORCE_COLOR = "0";

const ZOSMF_PROF_OPTS = {
    host: "somewhere.com",
    port: "43443",
    user: "someone",
    pass: "somesecret"
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
        _: ["zos-jobs", "download", "output"],
        ...ZOSMF_PROF_OPTS
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
    definition: OutputDefinition.OutputDefinition,
    fullDefinition: OutputDefinition.OutputDefinition,
    profiles: PROFILES
};

describe("download output handler tests", () => {
    it("should download a job output using defaults", async () => {
        let passedSession: Session = null;
        GetJobs.getJob = jest.fn((session, jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn((session, options) => {
            return;
        });
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        const defaults: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: false,
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(passedSession, defaults);
    });

    it("should download a job output to a specific directory", async () => {
        const outputDir: string = "output-dir";
        let passedSession: Session;
        GetJobs.getJob = jest.fn((session, jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn((session, options) => {
            return;
        });
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.directory = outputDir;
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: outputDir,
            omitJobidDirectory: false,
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(passedSession, opts);
    });

    it("should download a job output with a specific extension", async () => {
        let passedSession: Session;
        const extension: string = ".log";
        GetJobs.getJob = jest.fn((session, jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn((session, options) => {
            return;
        });
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.extension = extension;
        const optsext: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: false,
            extension,
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(passedSession, optsext);
    });

    it("should download a job output omitting the output directory", async () => {
        let passedSession: Session;
        GetJobs.getJob = jest.fn((session, jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn((session, options) => {
            return;
        });
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.ojd = true;
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: true,
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(passedSession, opts);
    });

    it("should not transform an error from the zosmf rest client", async () => {
        const failMessage = "You fail in z/OSMF";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
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

    it("should not transform an error from the DownloadJob class", async () => {
        const failMessage = "You fail in DownloadJob";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn((session, options) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
