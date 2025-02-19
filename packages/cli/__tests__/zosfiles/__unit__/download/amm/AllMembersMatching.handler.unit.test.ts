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
import * as AllMembersMatchingDefinition from "../../../../../src/zosfiles/download/amm/AllMembersMatching.definition";
import * as AllMembersMatchingHandler from "../../../../../src/zosfiles/download/amm/AllMembersMatching.handler";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const dsname = "test-pds";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-jobs", "download", "output"],
    definition: AllMembersMatchingDefinition.AllMembersMatchingDefinition
});

const fakeListOptions: IDsmListOptions = {
    excludePatterns:undefined,
    maxConcurrentRequests: undefined,
    responseTimeout: undefined,
    task: {
        percentComplete: 0,
        stageName: 0,
        statusMessage: "Searching for members"
    }
};

const fakeListResponse = [
    {
        member: 'M1',
        vers: 1,
        mod: 0,
        c4date: '2024/11/11',
        m4date: '2024/11/11',
        cnorc: 0,
        inorc: 0,
        mnorc: 0,
        mtime: '16:06',
        msec: '51',
        user: 'x',
        sclm: 'N'
    }
];

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
        statusMessage: "Downloading all members"
    },
    memberPatternResponse: fakeListResponse,
};

describe("Download AllMembersMatching handler", () => {
    it("should download matching members if requested", async () => {
        const pattern = "M1*";
        let passedSession: Session = null;
        List.membersMatchingPattern = jest.fn(async (session) => {
            passedSession = session;
            return {
                success: true,
                commandResponse: "listed",
                apiResponse: fakeListResponse
            };
        });
        Download.allMembers = jest.fn(async (_session) => {
            return {
                success: true,
                commandResponse: "downloaded"
            };
        });

        const handler = new AllMembersMatchingHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.pattern = pattern;
        params.arguments.dataSetName = dsname;

        await handler.process(params);

        expect(List.membersMatchingPattern).toHaveBeenCalledTimes(1);
        expect(List.membersMatchingPattern).toHaveBeenCalledWith(passedSession, dsname, [pattern], { ...fakeListOptions });
        expect(Download.allMembers).toHaveBeenCalledTimes(1);
        expect(Download.allMembers).toHaveBeenCalledWith(passedSession, dsname, { ...fakeDownloadOptions });
    });

    it("should handle generation of an exclusion list", async () => {
        const pattern = "M*";
        const excludePatterns = "M1*";
        let passedSession: Session = null;
        List.membersMatchingPattern = jest.fn(async (session) => {
            passedSession = session;
            return {
                success: true,
                commandResponse: "listed",
                apiResponse: fakeListResponse
            };
        });
        Download.allMembers = jest.fn(async (_session) => {
            return {
                success: true,
                commandResponse: "downloaded"
            };
        });

        const handler = new AllMembersMatchingHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.pattern = pattern;
        params.arguments.excludePatterns = excludePatterns;
        params.arguments.dataSetName = dsname;
        await handler.process(params);

        expect(List.membersMatchingPattern).toHaveBeenCalledTimes(1);
        expect(List.membersMatchingPattern).toHaveBeenCalledWith(passedSession, dsname, [pattern], {
            ...fakeListOptions,
            excludePatterns: [excludePatterns]
        });
        expect(Download.allMembers).toHaveBeenCalledTimes(1);
        expect(Download.allMembers).toHaveBeenCalledWith(passedSession, dsname, { ...fakeDownloadOptions });
    });

    it("should gracefully handle an error from the z/OSMF List API", async () => {
        const errorMsg = "i haz bad data set";
        const pattern = "testing";
        let caughtError;
        let passedSession: Session = null;
        List.membersMatchingPattern = jest.fn((session) => {
            passedSession = session;
            throw new Error(errorMsg);
        });
        Download.allMembers = jest.fn();

        const handler = new AllMembersMatchingHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.pattern = pattern;
        params.arguments.dataSetName = dsname;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toBe(errorMsg);
        expect(List.membersMatchingPattern).toHaveBeenCalledTimes(1);
        expect(List.membersMatchingPattern).toHaveBeenCalledWith(passedSession, dsname, [pattern], { ...fakeListOptions });
        expect(Download.allMembers).toHaveBeenCalledTimes(0);
    });
});

