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
import { ConnectionPropsForSessCfg, IHandlerParameters, ImperativeError, Session, ISession } from "@zowe/core-for-zowe-sdk";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { GetJobsData } from "../../../__resources__/GetJobsData";
import { SpoolFilesByJobidDefinition } from "../../../../../src/zosjobs/list/spool-files-by-jobid/SpoolFilesByJobid.definition";
import * as SpoolFileByIdHandler from "../../../../../src/zosjobs/view/spool-file-by-id/SpoolFileById.handler";
import * as fs from "fs";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS, UNIT_TEST_PROFILES_ZOSMF } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

// Disable coloring for the snapshots
process.env.FORCE_COLOR = "0";
const TEST_RESOURCES_DIR = __dirname + "/../../../__resources__";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "view", "spool-file-by-id"],
    definition: SpoolFilesByJobidDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("zos-jobs view spool-file-by-id handler", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to get the content of a spool file", async () => {
        GetJobs.getJob = jest.fn(async (session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        GetJobs.getSpoolContentById = jest.fn(async (session, jobname, jobid, spoolId) => {
            return fs.readFileSync(TEST_RESOURCES_DIR + "/spool/example_spool_content.txt").toString();
        });
        const handler = new SpoolFileByIdHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "j12345";
        params.arguments.spoolfileid = "2";
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolContentById).toHaveBeenCalledTimes(1);
        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(DEFAULT_PARAMETERS.arguments),
            DEFAULT_PARAMETERS.arguments
        );
        const fakeSession: Session = new Session(sessCfg);

        expect(GetJobs.getSpoolContentById).toHaveBeenCalledWith(fakeSession, GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            GetJobsData.SAMPLE_COMPLETE_JOB.jobid, "2");
    });

    it("should not transform an error thrown from get jobs getJob API", async () => {
        const failMessage = "You fail";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            throw new ImperativeError({ msg: failMessage});
        });
        const handler = new SpoolFileByIdHandler.default();
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

    it("should not transform an error thrown from get jobs getSpoolFilesForJob API", async () => {
        const failMessage = "You fail";
        let error;
        GetJobs.getJob = jest.fn(async (session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        GetJobs.getSpoolContentById = jest.fn((session, jobname, jobid, spoolId) => {
            throw new ImperativeError({ msg: failMessage});
        });
        const handler = new SpoolFileByIdHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "j12345";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolContentById).toHaveBeenCalledTimes(1);

        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(DEFAULT_PARAMETERS.arguments),
            DEFAULT_PARAMETERS.arguments
        );
        const fakeSession: Session = new Session(sessCfg);

        expect(GetJobs.getSpoolContentById).toHaveBeenCalledWith(fakeSession, GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
            GetJobsData.SAMPLE_COMPLETE_JOB.jobid, "2");
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
