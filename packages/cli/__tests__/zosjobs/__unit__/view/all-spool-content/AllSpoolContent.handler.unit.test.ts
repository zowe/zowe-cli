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
import { ConnectionPropsForSessCfg, IHandlerParameters, ImperativeError, Session, ISession } from "@zowe/imperative";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { GetJobsData } from "../../../__resources__/GetJobsData";
import { AllSpoolContentDefinition } from "../../../../../src/zosjobs/view/all-spool-content/AllSpoolContent.definition";
import * as fs from "fs";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS, UNIT_TEST_PROFILES_ZOSMF } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";
import * as AllSpoolContentHandler from "../../../../../src/zosjobs/view/all-spool-content/AllSpoolContent.handler"

// Disable coloring for the snapshots
process.env.FORCE_COLOR = "0";
const TEST_RESOURCES_DIR = __dirname + "/../../../__resources__";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "view", "spool-file-by-id"],
    definition: AllSpoolContentDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("zos-jobs view all-spool-content handler", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to get the content of a spool file", async () => {
        const spoolContent = fs.readFileSync(TEST_RESOURCES_DIR + "/spool/example_spool_content.txt");
        GetJobs.getJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        GetJobs.getSpoolFilesForJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_SPOOL_FILES;
        });
        GetJobs.getSpoolContent = jest.fn((session, spoolFile) => {
            return spoolContent;
        });
        const handler = new AllSpoolContentHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "JOB65536";
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolFilesForJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolContent).toHaveBeenCalledTimes(GetJobsData.SAMPLE_SPOOL_FILES.length);
        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(DEFAULT_PARAMETERS.arguments),
            DEFAULT_PARAMETERS.arguments
        );
        const fakeSession: Session = new Session(sessCfg);
        const lastSpoolFile = GetJobsData.SAMPLE_SPOOL_FILES[GetJobsData.SAMPLE_SPOOL_FILES.length - 1];
        expect(GetJobs.getSpoolContent).toHaveBeenLastCalledWith(fakeSession, lastSpoolFile);
    });

    it("should be able to get the content of a spool file with procstep", async () => {
        const spoolContent = fs.readFileSync(TEST_RESOURCES_DIR + "/spool/example_spool_content.txt");
        GetJobs.getJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        GetJobs.getSpoolFilesForJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_SPOOL_FILES_WITH_PROCSTEP;
        });
        GetJobs.getSpoolContent = jest.fn((session, spoolFile) => {
            return spoolContent;
        });
        const handler = new AllSpoolContentHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "JOB65536";
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolFilesForJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolContent).toHaveBeenCalledTimes(GetJobsData.SAMPLE_SPOOL_FILES_WITH_PROCSTEP.length);
        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(DEFAULT_PARAMETERS.arguments),
            DEFAULT_PARAMETERS.arguments
        );
        const fakeSession: Session = new Session(sessCfg);
        const lastSpoolFile = GetJobsData.SAMPLE_SPOOL_FILES_WITH_PROCSTEP[GetJobsData.SAMPLE_SPOOL_FILES_WITH_PROCSTEP.length - 1];
        expect(GetJobs.getSpoolContent).toHaveBeenLastCalledWith(fakeSession, lastSpoolFile);
    });

    it("should not transform an error thrown from get jobs getJob API", async () => {
        const failMessage = "Something went wrong";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            throw new ImperativeError({ msg: failMessage });
        });
        const handler = new AllSpoolContentHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "JOB65536";
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
        const failMessage = "Something went wrong";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        GetJobs.getSpoolFilesForJob = jest.fn((session, jobid) => {
            throw new ImperativeError({ msg: failMessage });
        });
        const handler = new AllSpoolContentHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "JOB65536";
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

    it("should not transform an error thrown from get jobs getSpoolContent API", async () => {
        const failMessage = "Something went wrong";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        GetJobs.getSpoolFilesForJob = jest.fn((session, jobid) => {
            return GetJobsData.SAMPLE_SPOOL_FILES;
        });
        GetJobs.getSpoolContent = jest.fn((session, spoolFile) => {
            throw new ImperativeError({ msg: failMessage });
        });
        const handler = new AllSpoolContentHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.jobid = "JOB65536";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolFilesForJob).toHaveBeenCalledTimes(1);
        expect(GetJobs.getSpoolContent).toHaveBeenCalledTimes(1);
        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(DEFAULT_PARAMETERS.arguments),
            DEFAULT_PARAMETERS.arguments
        );
        const fakeSession: Session = new Session(sessCfg);
        const firstSpoolFile = GetJobsData.SAMPLE_SPOOL_FILES[0];
        expect(GetJobs.getSpoolContent).toHaveBeenCalledWith(fakeSession, firstSpoolFile);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
