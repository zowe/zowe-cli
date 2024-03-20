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

import { IHandlerParameters, Session } from "@zowe/imperative";
import { Download, IDownloadOptions, IDsmListOptions, List } from "@zowe/zos-files-for-zowe-sdk";
import * as DataSetMatchingDefinition from "../../../../../src/zosfiles/download/dsm/DataSetMatching.definition";
import * as DataSetMatchingHandler from "../../../../../src/zosfiles/download/dsm/DataSetMatching.handler";
import { UNIT_TEST_ZOSMF_PROF_OPTS, UNIT_TEST_PROFILES_ZOSMF } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "download", "output"],
    definition: DataSetMatchingDefinition.DataSetMatchingDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

const fakeListOptions: IDsmListOptions = {
    task: {
        percentComplete: 0,
        stageName: 0,
        statusMessage: "Searching for data sets"
    }
};

const fakeDownloadOptions: IDownloadOptions = {
    binary: undefined,
    directory: undefined,
    encoding: undefined,
    extension: undefined,
    extensionMap: undefined,
    failFast: undefined,
    maxConcurrentRequests: undefined,
    preserveOriginalLetterCase: undefined,
    record: undefined,
    responseTimeout: undefined,
    volume: undefined,
    task: {
        percentComplete: 0,
        stageName: 0,
        statusMessage: "Downloading data sets"
    }
};

describe("Download DataSetMatching handler", () => {
    it("should download matching datasets if requested", async () => {
        const pattern = "testing";
        const fakeListResponse = [{ dsname: "HLQ." + pattern }];
        let passedSession: Session = null;
        List.dataSetsMatchingPattern = jest.fn(async (session) => {
            passedSession = session;
            return {
                success: true,
                commandResponse: "listed",
                apiResponse: fakeListResponse
            };
        });
        Download.allDataSets = jest.fn(async (session) => {
            return {
                success: true,
                commandResponse: "downloaded"
            };
        });

        const handler = new DataSetMatchingHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.pattern = pattern;
        await handler.process(params);

        expect(List.dataSetsMatchingPattern).toHaveBeenCalledTimes(1);
        expect(List.dataSetsMatchingPattern).toHaveBeenCalledWith(passedSession, [pattern], { ...fakeListOptions });
        expect(Download.allDataSets).toHaveBeenCalledTimes(1);
        expect(Download.allDataSets).toHaveBeenCalledWith(passedSession, fakeListResponse, { ...fakeDownloadOptions });
    });

    it("should handle generation of an extension map", async () => {
        const pattern = "testing";
        const fakeListResponse = [{ dsname: "HLQ." + pattern }];
        const extensionMap = "CNTL=JCL,PARMLIB=JCL,LOADLIB=JCL";
        let passedSession: Session = null;
        List.dataSetsMatchingPattern = jest.fn(async (session) => {
            passedSession = session;
            return {
                success: true,
                commandResponse: "listed",
                apiResponse: fakeListResponse
            };
        });
        Download.allDataSets = jest.fn(async (session) => {
            return {
                success: true,
                commandResponse: "downloaded"
            };
        });

        const handler = new DataSetMatchingHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.pattern = pattern;
        params.arguments.extensionMap = extensionMap;
        await handler.process(params);

        expect(List.dataSetsMatchingPattern).toHaveBeenCalledTimes(1);
        expect(List.dataSetsMatchingPattern).toHaveBeenCalledWith(passedSession, [pattern], { ...fakeListOptions });
        expect(Download.allDataSets).toHaveBeenCalledTimes(1);
        expect(Download.allDataSets).toHaveBeenCalledWith(passedSession, fakeListResponse, {
            ...fakeDownloadOptions,
            extensionMap: { cntl: "jcl", parmlib: "jcl", loadlib: "jcl" }
        });
    });

    it("should gracefully handle an extension map parsing error", async () => {
        const pattern = "testing";
        const extensionMap = "CNTL=JCL,PARMLIB-JCL,LOADLIB=JCL";
        let caughtError;
        List.dataSetsMatchingPattern = jest.fn();
        Download.allDataSets = jest.fn();

        const handler = new DataSetMatchingHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.pattern = pattern;
        params.arguments.extensionMap = extensionMap;
        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain("An error occurred processing the extension map");
        expect(List.dataSetsMatchingPattern).toHaveBeenCalledTimes(0);
        expect(Download.allDataSets).toHaveBeenCalledTimes(0);
    });

    it("should handle generation of an exclusion list", async () => {
        const pattern = "testing";
        const fakeListResponse = [{ dsname: "HLQ." + pattern }];
        const excludePatterns = "TEST.EXCLUDE.**.CNTL";
        let passedSession: Session = null;
        List.dataSetsMatchingPattern = jest.fn(async (session) => {
            passedSession = session;
            return {
                success: true,
                commandResponse: "listed",
                apiResponse: fakeListResponse
            };
        });
        Download.allDataSets = jest.fn(async (session) => {
            return {
                success: true,
                commandResponse: "downloaded"
            };
        });

        const handler = new DataSetMatchingHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.pattern = pattern;
        params.arguments.excludePatterns = excludePatterns;
        await handler.process(params);

        expect(List.dataSetsMatchingPattern).toHaveBeenCalledTimes(1);
        expect(List.dataSetsMatchingPattern).toHaveBeenCalledWith(passedSession, [pattern], {
            ...fakeListOptions,
            excludePatterns: [excludePatterns]
        });
        expect(Download.allDataSets).toHaveBeenCalledTimes(1);
        expect(Download.allDataSets).toHaveBeenCalledWith(passedSession, fakeListResponse, { ...fakeDownloadOptions });
    });

    it("should gracefully handle an error from the z/OSMF List API", async () => {
        const errorMsg = "i haz bad data set";
        const pattern = "testing";
        let caughtError;
        let passedSession: Session = null;
        List.dataSetsMatchingPattern = jest.fn((session) => {
            passedSession = session;
            throw new Error(errorMsg);
        });
        Download.allDataSets = jest.fn();

        const handler = new DataSetMatchingHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.pattern = pattern;
        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toBe(errorMsg);
        expect(List.dataSetsMatchingPattern).toHaveBeenCalledTimes(1);
        expect(List.dataSetsMatchingPattern).toHaveBeenCalledWith(passedSession, [pattern], { ...fakeListOptions });
        expect(Download.allDataSets).toHaveBeenCalledTimes(0);
    });
});
