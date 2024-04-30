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

    function generateDS(name: string, pds: boolean, poe: boolean = false, migr: boolean = false) {
        return {
            dsname: name,
            dsorg: pds ? (poe ? "PO-E" : "PO") : "PS",
            migr: migr ? "yes" : undefined
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

    describe("dataSets", () => {
        const searchOnMainframeSpy = jest.spyOn(Search as any, "searchOnMainframe");
        const searchLocalSpy = jest.spyOn(Search as any, "searchLocal");
        const listDataSetsMatchingPatternSpy = jest.spyOn(List, "dataSetsMatchingPattern");
        const listAllMembersSpy = jest.spyOn(List, "allMembers");
        function delay(ms: number) { jest.advanceTimersByTime(ms); }

        beforeAll(() => {
            jest.useFakeTimers();
        });

        beforeEach(() => {
            searchOnMainframeSpy.mockClear();
            searchLocalSpy.mockClear();
            listDataSetsMatchingPatternSpy.mockClear();
            listAllMembersSpy.mockClear();

            searchOnMainframeSpy.mockImplementation(async (session, searchOptions, searchItems: ISearchItem[]) => {
                if ((Search as any).timerExpired != true) {
                    return {
                        responses: searchItems,
                        failures: []
                    };
                } else {
                    const failures: string[] = [];
                    for (const searchItem of searchItems) {
                        if (searchItem.member) { failures.push(searchItem.dsn + "(" + searchItem.member + ")"); }
                        else { failures.push(searchItem.dsn); }
                    }
                    return {responses: [], failures};
                }
            });
            searchLocalSpy.mockImplementation(async (session, searchOptions, searchItems: ISearchItem[]) => {
                if ((Search as any).timerExpired != true) {
                    const searchItemArray: ISearchItem[] = [];
                    for (const searchItem of searchItems) {
                        const localSearchItem: ISearchItem = searchItem;
                        localSearchItem.matchList = [{column: expectedCol, line: expectedLine, contents: testDataString}];
                        searchItemArray.push(localSearchItem);
                    }
                    return {responses: searchItemArray, failures: []};
                } else {
                    const failures: string[] = [];
                    for (const searchItem of searchItems) {
                        if (searchItem.member) { failures.push(searchItem.dsn + "(" + searchItem.member + ")"); }
                        else { failures.push(searchItem.dsn); }
                    }
                    return {responses: [], failures};
                }
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
            jest.useRealTimers();
            searchOnMainframeSpy.mockRestore();
            searchLocalSpy.mockRestore();
        });

        it("Should search for the data sets containing a word", async () => {
            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 5 data sets and PDS members");
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

        it("Should search for the data sets containing a word and sort out of order responses", async () => {
            searchLocalSpy.mockImplementation(async (session, searchOptions, searchItems: ISearchItem[]) => {
                const searchItemArray: ISearchItem[] = [];
                for (const searchItem of searchItems) {
                    const localSearchItem: ISearchItem = searchItem;
                    localSearchItem.matchList = [{column: expectedCol, line: expectedLine, contents: testDataString}];
                    searchItemArray.unshift(localSearchItem);
                }
                return {responses: searchItemArray, failures: []};
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 5 data sets and PDS members");
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

        it("Should handle a migrated data set", async () => {
            listDataSetsMatchingPatternSpy.mockImplementation(async (session, patterns, options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: [generateDS("TEST1.DS", false), generateDS("TEST2.DS", false), generateDS("TEST3.PDS", true, false, true)],
                    errorMessage: undefined
                } as IZosFilesResponse;
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(0);
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 2 data sets and PDS members");
            expect(response.commandResponse).toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });

        it("Should handle a PO-E data set", async () => {
            listDataSetsMatchingPatternSpy.mockImplementation(async (session, patterns, options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: [generateDS("TEST1.DS", false), generateDS("TEST2.DS", false), generateDS("TEST3.PDS", true, true)],
                    errorMessage: undefined
                } as IZosFilesResponse;
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 5 data sets and PDS members");
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

        it("Should update the progress task if provided 1", async () => {
            searchOptions.progressTask = {
                stageName: TaskStage.NOT_STARTED,
                percentComplete: 0,
                statusMessage: undefined
            };
            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 5 data sets and PDS members");
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

            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.COMPLETE);
            expect(searchOptions.progressTask.percentComplete).toEqual(100);
            expect(searchOptions.progressTask.statusMessage).toEqual("Search complete");
        });

        it("Should update the progress task if provided 2", async () => {
            searchOptions.progressTask = {
                stageName: TaskStage.NOT_STARTED,
                percentComplete: 0,
                statusMessage: undefined
            };
            searchLocalSpy.mockImplementation(async (session, searchOptions, searchItems: ISearchItem[]) => {
                const searchItemArray: ISearchItem[] = [];
                for (const searchItem of searchItems) {
                    const localSearchItem: ISearchItem = searchItem;
                    localSearchItem.matchList = [{column: expectedCol, line: expectedLine, contents: testDataString}];
                    searchItemArray.push(localSearchItem);
                }
                (Search as any).timerExpired = true;
                return {responses: searchItemArray, failures: []};
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 5 data sets and PDS members");
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

            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.COMPLETE);
            expect(searchOptions.progressTask.percentComplete).toEqual(100);
            expect(searchOptions.progressTask.statusMessage).toEqual("Search complete");
        });

        it("Should handle if a PDS list fails", async () => {
            listAllMembersSpy.mockImplementation(async (session, dsn, options) => {
                throw new ImperativeError({msg: "Something went terribly wrong"});
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).toEqual("The following data set(s) failed to be searched: \nTEST3.PDS\n");
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 2 data sets and PDS members");
            expect(response.commandResponse).toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });

        it("Should handle if a PDS list is empty", async () => {
            listAllMembersSpy.mockImplementation(async (session, dsn, options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: generateMembers([]),
                    errorMessage: undefined
                } as IZosFilesResponse;
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]},
                {dsn: "TEST2.DS", member: undefined, matchList: [{column: expectedCol, line: expectedLine, contents: testDataString}]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 2 data sets and PDS members");
            expect(response.commandResponse).toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });

        it("Should handle if listing data sets returns nothing", async () => {
            listDataSetsMatchingPatternSpy.mockImplementation(async (session, patterns, options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: [],
                    errorMessage: undefined
                } as IZosFilesResponse;
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(0);
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([]);
            expect(response.commandResponse).toEqual("Found \"TESTDATA\" in 0 data sets and PDS members.");
        });

        it("Should terminate if listing data sets fails", async () => {
            const impErr = new ImperativeError({msg: "Something went terribly wrong"});
            listDataSetsMatchingPatternSpy.mockImplementation(async (session, patterns, options) => {
                throw impErr;
            });

            let err: any;
            try {
                await Search.dataSets(dummySession, searchOptions);
            } catch (error) {
                err = error;
            }

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(0);
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(0);
            expect(searchLocalSpy).toHaveBeenCalledTimes(0);

            expect(err.message).toEqual("Failed to get list of data sets to search");
            expect(err.causeErrors).toEqual(impErr);
        });

        it("Should handle timing out 1", async () => {
            searchLocalSpy.mockImplementation(async (session, searchOptions, searchItems: ISearchItem[]) => {
                delay(1100);
                if ((Search as any).timerExpired != true) {
                    const searchItemArray: ISearchItem[] = [];
                    for (const searchItem of searchItems) {
                        const localSearchItem: ISearchItem = searchItem;
                        localSearchItem.matchList = [{column: expectedCol, line: expectedLine, contents: testDataString}];
                        searchItemArray.push(localSearchItem);
                    }
                    return {responses: searchItemArray, failures: []};
                } else {
                    const failures: string[] = [];
                    for (const searchItem of searchItems) {
                        if (searchItem.member) { failures.push(searchItem.dsn + "(" + searchItem.member + ")"); }
                        else { failures.push(searchItem.dsn); }
                    }
                    return {responses: [], failures};
                }
            });
            searchOptions.timeout = 1;
            searchOptions.progressTask = {
                stageName: TaskStage.NOT_STARTED,
                percentComplete: 0,
                statusMessage: undefined
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).toEqual("The following data set(s) failed to be searched: " +
                "\nTEST1.DS\nTEST2.DS\nTEST3.PDS(MEMBER1)\nTEST3.PDS(MEMBER2)\nTEST3.PDS(MEMBER3)\n");
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual([]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 0 data sets and PDS members");

            expect(searchOptions.progressTask.percentComplete).toEqual(100);
            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.FAILED);
            expect(searchOptions.progressTask.statusMessage).toEqual("Operation timed out");
        });

        it("Should handle timing out 2", async () => {
            searchOnMainframeSpy.mockImplementation(async (session, searchOptions, searchItems: ISearchItem[]) => {
                delay(1100);
                if ((Search as any).timerExpired != true) {
                    return {
                        responses: searchItems,
                        failures: []
                    };
                } else {
                    const failures: string[] = [];
                    for (const searchItem of searchItems) {
                        if (searchItem.member) { failures.push(searchItem.dsn + "(" + searchItem.member + ")"); }
                        else { failures.push(searchItem.dsn); }
                    }
                    return {responses: [], failures};
                }
            });
            searchOptions.timeout = 1;
            searchOptions.progressTask = {
                stageName: TaskStage.NOT_STARTED,
                percentComplete: 0,
                statusMessage: undefined
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).toEqual("The following data set(s) failed to be searched: " +
                "\nTEST1.DS\nTEST2.DS\nTEST3.PDS(MEMBER1)\nTEST3.PDS(MEMBER2)\nTEST3.PDS(MEMBER3)\n");
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual([]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 0 data sets and PDS members");

            expect(searchOptions.progressTask.percentComplete).toEqual(100);
            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.FAILED);
            expect(searchOptions.progressTask.statusMessage).toEqual("Operation timed out");
        });

        it("Should handle timing out 3", async () => {
            listAllMembersSpy.mockImplementation(async (session, dsn, options) => {
                delay(1100);
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: generateMembers(["MEMBER1", "MEMBER2", "MEMBER3"]),
                    errorMessage: undefined
                } as IZosFilesResponse;
            });
            searchOptions.timeout = 1;
            searchOptions.progressTask = {
                stageName: TaskStage.NOT_STARTED,
                percentComplete: 0,
                statusMessage: undefined
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).toEqual("The following data set(s) failed to be searched: " +
                "\nTEST1.DS\nTEST2.DS\nTEST3.PDS(MEMBER1)\nTEST3.PDS(MEMBER2)\nTEST3.PDS(MEMBER3)\n");
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual([]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 0 data sets and PDS members");

            expect(searchOptions.progressTask.percentComplete).toEqual(100);
            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.FAILED);
            expect(searchOptions.progressTask.statusMessage).toEqual("Operation timed out");
        });

        it("Should handle timing out 4", async () => {
            listDataSetsMatchingPatternSpy.mockImplementation(async (session, patterns, options) => {
                delay(1100);
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: [generateDS("TEST1.DS", false), generateDS("TEST2.DS", false), generateDS("TEST3.PDS", true)],
                    errorMessage: undefined
                } as IZosFilesResponse;
            });
            searchOptions.timeout = 1;
            searchOptions.progressTask = {
                stageName: TaskStage.NOT_STARTED,
                percentComplete: 0,
                statusMessage: undefined
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).toEqual("The following data set(s) failed to be searched: " +
                "\nTEST1.DS\nTEST2.DS\nTEST3.PDS(MEMBER1)\nTEST3.PDS(MEMBER2)\nTEST3.PDS(MEMBER3)\n");
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual([]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 0 data sets and PDS members");

            expect(searchOptions.progressTask.percentComplete).toEqual(100);
            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.FAILED);
            expect(searchOptions.progressTask.statusMessage).toEqual("Operation timed out");
        });
    });

    describe("searchOnMainframe", () => {
        it("Should return a list of members that contain the search term (all)", async () => {
            const searchString = searchOptions.searchString.toLowerCase();
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchString + "&maxreturnsize=1";

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

            const searchString = searchOptions.searchString.toLowerCase();
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchString + "&maxreturnsize=1";

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

            const searchString = searchOptions.searchString.toLowerCase();
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchString + "&maxreturnsize=1";

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

            const searchString = searchOptions.searchString.toLowerCase();
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchString + "&maxreturnsize=1";

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
            const searchString = searchOptions.searchString.toLowerCase();
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchString + "&maxreturnsize=1";

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
            const searchString = searchOptions.searchString;
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchString + "&maxreturnsize=1&insensitive=false";

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
            const searchString = searchOptions.searchString.toLowerCase();
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchString + "&maxreturnsize=1";

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
            const searchString = searchOptions.searchString.toLowerCase();
            const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
            const queryParams = "?search=" + searchString + "&maxreturnsize=1";

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
