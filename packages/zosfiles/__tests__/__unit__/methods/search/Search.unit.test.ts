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

import { ImperativeError, Session, TaskStage } from "@zowe/imperative";
import { Get, ISearchItem, ISearchOptions, IZosFilesResponse, List, Search } from "../../../../src";
import { ZosmfHeaders, ZosmfRestClient, asyncPool } from "@zowe/core-for-zowe-sdk";

describe("Search", () => {
    
    const getDataSetSpy = jest.spyOn(Get, "dataSet");
    const dummySession = new Session({
        user: "ibmuser",
        password: "ibmpass",
        hostname: "ibmlpar",
        port: 443,
        protocol: "https",
        type: "basic"
    });
    const testDataString = "THIS DATA SET CONTAINS SOME TESTDATA";
    const expectedCol = 28;
    const expectedLine = 0;

    let searchOptions: ISearchOptions = {
        dsn: "TEST*",
        searchString: "TESTDATA",
        caseSensitive: false,
        getOptions: {},
        listOptions: {},
        mainframeSearch: true,
        progressTask: undefined,
        maxConcurrentRequests: 1,
        timeout: undefined,
    };
    let searchItems: ISearchItem[] = [
        {dsn: "TEST1.DS", member: undefined, matchList: undefined},
        {dsn: "TEST2.DS", member: undefined, matchList: undefined},
        {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
        {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
        {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
    ];

    function generateDS(name: string, pds: boolean) {
        return {
            dsname: name,
            dsorg: pds ? "PO" : "PS",
        };
    }
    function generateMembers(members: string[]) {
        const mockItems = [];
        for (const member of members) {
            mockItems.push({member: member});
        }
        return {
            items: [
                ...mockItems
            ]
        };
    }

    beforeEach(() => {
        getDataSetSpy.mockClear();
        
        getDataSetSpy.mockImplementation(async (session, dsn, options) => {
            return Buffer.from(testDataString);
        });

        searchOptions = {
            dsn: "TEST*",
            searchString: "TESTDATA",
            caseSensitive: false,
            getOptions: {},
            listOptions: {},
            mainframeSearch: true,
            progressTask: undefined,
            maxConcurrentRequests: 1,
            timeout: undefined,
        };

        searchItems = [
            {dsn: "TEST1.DS", member: undefined, matchList: undefined},
            {dsn: "TEST2.DS", member: undefined, matchList: undefined},
            {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
            {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
            {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
        ];

        (Search as any).timerExpired = false;
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("search", () => {
        const searchOnMainframeSpy = jest.spyOn(Search as any, "searchOnMainframe");
        const searchLocalSpy = jest.spyOn(Search as any, "searchLocal");
        const listDataSetsMatchingPatternSpy = jest.spyOn(List, "dataSetsMatchingPattern");
        const listAllMembersSpy = jest.spyOn(List, "allMembers");

        beforeEach(() => {
            searchOnMainframeSpy.mockClear();
            searchLocalSpy.mockClear();
            listDataSetsMatchingPatternSpy.mockClear();
            listAllMembersSpy.mockClear();

            searchOnMainframeSpy.mockImplementation((session, searchOptions, searchItems) => {
                return {
                    responses: searchItems,
                    failures: []
                };
            });
            searchLocalSpy.mockImplementation((session, searchOptions, searchItems) => {
                return {
                    responses: [
                        {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                        {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                        {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                        {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                        {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
                    ],
                    failures: []
                };
            });
            listDataSetsMatchingPatternSpy.mockImplementation(async (session, patterns, options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: [generateDS("TEST1.DS", false), generateDS("TEST2.DS", false), generateDS("TEST3.PDS", true)],
                    errorMessage: undefined
                } as IZosFilesResponse;
            });
            listAllMembersSpy.mockImplementation(async (session, dsn, options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: generateMembers(["MEMBER1", "MEMBER2", "MEMBER3"]),
                    errorMessage: undefined
                } as IZosFilesResponse;
            });    
        });

        afterAll(() => {
            searchOnMainframeSpy.mockRestore();
            searchLocalSpy.mockRestore();
        });

        it("Should search for the data sets containing a word", async () => {
            const response = await Search.search(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            
            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER1\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER2\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER3\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });
    });

    describe("searchOnMainframe", () => {
        it("Should return a list of members that contain the search term (all)", async () => {
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchOptions.searchString + "&maxreturnsize=1";

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {queryParams});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: undefined},
                {dsn: "TEST2.DS", member: undefined, matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
            ], failures: []});
        });

        it("Should return a list of members that contain the search term (none)", async () => {
            // Return empty buffers for all entries
            getDataSetSpy.mockImplementation(async (session, dsn, options) => {
                return Buffer.from("");
            });

            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchOptions.searchString + "&maxreturnsize=1";

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {queryParams});
            expect(response).toEqual({responses: [], failures: []});
        });

        it("Should return a list of members that contain the search term (some)", async () => {
            // Return empty buffers for the final 2 entries
            getDataSetSpy.mockImplementation(async (session, dsn, options) => {
                return Buffer.from("");
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            });

            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchOptions.searchString + "&maxreturnsize=1";

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {queryParams});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: undefined},
                {dsn: "TEST2.DS", member: undefined, matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined}
            ], failures: []});
        });

        it("Should return failures if the timer expired", async () => {
            (Search as any).timerExpired = true;

            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(0);
            expect(response).toEqual({
                responses: [],
                failures: ["TEST1.DS", "TEST2.DS", "TEST3.PDS(MEMBER1)", "TEST3.PDS(MEMBER2)", "TEST3.PDS(MEMBER3)"]
            });
        });

        it("Should handle a data set get failure", async () => {
            getDataSetSpy.mockImplementation(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                throw new ImperativeError({msg: "Failed to retrieve contents of data set"});
            });

            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchOptions.searchString + "&maxreturnsize=1";

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {queryParams});
            expect(response).toEqual({
                responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: undefined},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
                ],
                failures: ["TEST2.DS"]
            });
        });

        it("Should update the progress task, if present", async () => {
            searchOptions.progressTask = {
                percentComplete: 0,
                statusMessage: "Getting Ready to Start",
                stageName: TaskStage.IN_PROGRESS
            };
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchOptions.searchString + "&maxreturnsize=1";

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {queryParams});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: undefined},
                {dsn: "TEST2.DS", member: undefined, matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
            ], failures: []});
            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.IN_PROGRESS);

            // Because the 5th entry is the last, there will have been 4 completed tasks
            expect(searchOptions.progressTask.statusMessage).toEqual("Initial Mainframe Search: 4 of 5 entries checked");
            expect(searchOptions.progressTask.percentComplete).toEqual(40);
        });

        it("Should handle case sensitivity", async () => {
            searchOptions.caseSensitive = true;
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchOptions.searchString + "&maxreturnsize=1&insensitive=false";

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {queryParams});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: undefined},
                {dsn: "TEST2.DS", member: undefined, matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
            ], failures: []});
        });

        it("Should handle multiple concurrent requests", async () => {
            searchOptions.maxConcurrentRequests = 2;
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchOptions.searchString + "&maxreturnsize=1";

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {queryParams});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: undefined},
                {dsn: "TEST2.DS", member: undefined, matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
            ], failures: []});
        });

        it("Should handle no concurrent requests passed in", async () => {
            searchOptions.maxConcurrentRequests = undefined;
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchOptions.searchString + "&maxreturnsize=1";

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {queryParams});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {queryParams});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: undefined},
                {dsn: "TEST2.DS", member: undefined, matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
            ], failures: []});
        });

        it("Should handle being passed an empty list of search entries", async () => {
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, []);

            expect(getDataSetSpy).toHaveBeenCalledTimes(0);
            expect(response).toEqual({responses: [], failures: []});
        });
    });

    describe("searchLocal", () => {
        it("Should return a list of members that contain the search term (all)", async () => {
            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ], failures: []});
        });

        it("Should return a list of members that contain the search term (none)", async () => {
            // Return non-matching buffers for all entries
            getDataSetSpy.mockImplementation(async (session, dsn, options) => {
                return Buffer.from("This data set does not contain any test data.");
            });

            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [], failures: []});
        });

        it("Should return a list of members that contain the search term (some)", async () => {
            // Return empty buffers for the final 2 entries
            getDataSetSpy.mockImplementation(async (session, dsn, options) => {
                return Buffer.from("");
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            });

            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ], failures: []});
        });

        it("Should return failures if the timer expired", async () => {
            (Search as any).timerExpired = true;

            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(0);
            expect(response).toEqual({
                responses: [],
                failures: ["TEST1.DS", "TEST2.DS", "TEST3.PDS(MEMBER1)", "TEST3.PDS(MEMBER2)", "TEST3.PDS(MEMBER3)"]
            });
        });

        it("Should handle a data set get failure", async () => {
            getDataSetSpy.mockImplementation(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                throw new ImperativeError({msg: "Failed to retrieve contents of data set"});
            });

            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({
                responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
                ],
                failures: ["TEST2.DS"]
            });
        });

        it("Should update the progress task, if present 1", async () => {
            searchOptions.progressTask = {
                percentComplete: 0,
                statusMessage: "Getting Ready to Start",
                stageName: TaskStage.IN_PROGRESS
            };
            searchOptions.mainframeSearch = false;
            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ], failures: []});
            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.IN_PROGRESS);

            // Because the 5th entry is the last, there will have been 4 completed tasks
            expect(searchOptions.progressTask.statusMessage).toEqual("Performing Deep Search: 4 of 5 entries checked");
            expect(searchOptions.progressTask.percentComplete).toEqual(80);
        });

        it("Should update the progress task, if present 2", async () => {
            searchOptions.progressTask = {
                percentComplete: 40,
                statusMessage: "Initial Mainframe Search: 4 of 5 entries checked",
                stageName: TaskStage.IN_PROGRESS
            };
            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ], failures: []});
            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.IN_PROGRESS);

            // Because the 5th entry is the last, there will have been 4 completed tasks
            expect(searchOptions.progressTask.statusMessage).toEqual("Performing Deep Search: 4 of 5 entries checked");
            expect(searchOptions.progressTask.percentComplete).toEqual(90);
        });

        it("Should handle case sensitivity 1", async () => {
            searchOptions.caseSensitive = true;
            // Return empty buffers for the final 2 entries
            getDataSetSpy.mockImplementation(async (session, dsn, options) => {
                return Buffer.from(testDataString.toLowerCase());
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            }).mockImplementationOnce(async (session, dsn, options) => {
                return Buffer.from(testDataString);
            });

            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ], failures: []});
        });

        it("Should handle case sensitivity 2", async () => {
            searchOptions.caseSensitive = true;
            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ], failures: []});
        });

        it("Should handle multiple concurrent requests", async () => {
            searchOptions.maxConcurrentRequests = 2;
            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ], failures: []});
        });

        it("Should handle no concurrent requests passed in", async () => {
            searchOptions.maxConcurrentRequests = undefined;
            const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

            expect(getDataSetSpy).toHaveBeenCalledTimes(5);
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
            expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
            expect(response).toEqual({responses: [
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ], failures: []});
        });

        it("Should handle being passed an empty list of search entries", async () => {
            const response = await (Search as any).searchLocal(dummySession, searchOptions, []);

            expect(getDataSetSpy).toHaveBeenCalledTimes(0);
            expect(response).toEqual({responses: [], failures: []});
        });
    });
});