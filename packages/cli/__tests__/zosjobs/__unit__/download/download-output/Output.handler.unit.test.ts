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

import { DownloadJobs, IDownloadAllSpoolContentParms, GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { GetJobsData } from "../../../__resources__/GetJobsData";

jest.mock("@zowe/zos-jobs-for-zowe-sdk");
import { IHandlerParameters, ImperativeError, Session } from "@zowe/imperative";
import * as OutputHandler from "../../../../../src/zosjobs/download/download-output/Output.handler";
import * as OutputDefinition from "../../../../../src/zosjobs/download/download-output/Output.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "download", "output"],
    definition: OutputDefinition.OutputDefinition
});

describe("download output handler tests", () => {
    it("should download a job output using defaults", async () => {
        let passedSession: Session = null;
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        const defaults: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: false
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            defaults
        );
    });

    it("should download a job output to a specific directory", async () => {
        const outputDir: string = "output-dir";
        let passedSession: Session;
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.directory = outputDir;
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: outputDir,
            omitJobidDirectory: false
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            opts
        );
    });

    it("should download a job output with a specific extension", async () => {
        let passedSession: Session;
        const extension: string = ".log";
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
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
            extension
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            optsext
        );
    });

    it("should download a job output omitting the output directory", async () => {
        let passedSession: Session;
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.ojd = true;
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: true
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            opts
        );
    });

    it("should download a job output in binary mode", async () => {
        let passedSession: Session = null;
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.binary = true;
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: false,
            binary: true
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            opts
        );
    });

    it("should download a job output in record mode", async () => {
        let passedSession: Session = null;
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.record = true;
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: false,
            record: true
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            opts
        );
    });

    it("should download a job output with encoding", async () => {
        let passedSession: Session = null;
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.encoding = "IBM-037";
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: false,
            encoding: "IBM-037"
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            opts
        );
    });

    it("should not transform an error from the zosmf rest client", async () => {
        const failMessage = "You fail in z/OSMF";
        let error;
        GetJobs.getJob = jest.fn((_session, _jobid) => {
            throw new ImperativeError({ msg: failMessage });
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
        GetJobs.getJob = jest.fn(async (_session, _jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            (_session, _options) => {
                throw new ImperativeError({ msg: failMessage });
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(
            DownloadJobs.downloadAllSpoolContentCommon
        ).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should download a job output using wfa", async () => {
        let passedSession: Session = null;
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.wfa = true;
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: false,
            waitForActive: params.arguments.waitForActive
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            opts
        );
    });

    it("should download a job output using wfo", async () => {
        let passedSession: Session = null;
        GetJobs.getJob = jest.fn(async (session, _jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        DownloadJobs.downloadAllSpoolContentCommon = jest.fn(
            async (_session, _options) => {
                return;
            }
        );
        const handler = new OutputHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        params.arguments.wfo = true;
        const opts: IDownloadAllSpoolContentParms = {
            jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
            outDir: DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR,
            omitJobidDirectory: false,
            waitForOutput: params.arguments.waitForOutput
        };
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(DownloadJobs.downloadAllSpoolContentCommon).toHaveBeenCalledWith(
            passedSession,
            opts
        );
    });
});
