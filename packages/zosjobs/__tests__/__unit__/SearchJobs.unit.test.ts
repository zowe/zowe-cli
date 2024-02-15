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

import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { AbstractSession, IRestClientResponse, ProcessUtils, Session } from "@zowe/imperative";
import { GetJobs, SearchJobs } from "../../src";
import { GetJobsData } from "../__resources__/api/GetJobsData";

const pretendSession = new Session({user: "test", password: "test", hostname: "Test"});

function mockGetJobsJSONData(data: object) {
    const mock = jest.fn((session: AbstractSession, resource: string, headers?: any[]): Promise<object> => {
        return new Promise<object>((resolve, reject) => {
            ProcessUtils.nextTick(() => {
                resolve(data);
            });
        });
    });
    return mock;
}

function mockSearchJobsJSONData(data: object) {
    const mock = jest.fn((session: AbstractSession, resource: string, headers?: any[]): Promise<object> => {
        return new Promise<object>((resolve, reject) => {
            ProcessUtils.nextTick(() => {
                resolve(data);
            });
        });
    });
    return mock;
}

describe("SearchJobs tests", () => {

    describe("SearchJobs API successful call", () => {
        it("should search a job and find the expected output", async () => {
            const searchText:string = "BluhBluh";
            const request: IRestClientResponse = {dataString : searchText, requestSuccess : true, response : []};
            const headers = {'x-ibm-record-range': '1,1'};
            request.response.headers = headers;
            (ZosmfRestClient.getExpectFullResponse as any) = mockSearchJobsJSONData(request);
            (GetJobs.getJobsByPrefix as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_ACTIVE_JOB]);
            (GetJobs.getSpoolFilesForJob as any) = mockGetJobsJSONData([GetJobsData.SAMPLE_COMPLETE_JOB]);

            const output = await SearchJobs.searchJobs(pretendSession,
                {jobName: "testjob", searchString: searchText, searchLimit: 2, fileLimit: 2});
            expect(output).toMatchSnapshot();
            expect(output).toContain(searchText);
        });
    });

    describe("SearchJobs API failed call", () => {
        it("should throw an exception for invalid parameters", async () => {
            let err: any;
            const errorText = "You must specify either the `--search-string` or `--search-regex` option";

            try {
                await SearchJobs.searchJobs(pretendSession, {jobName: "testjob"});
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(errorText);
        });
    });
});
