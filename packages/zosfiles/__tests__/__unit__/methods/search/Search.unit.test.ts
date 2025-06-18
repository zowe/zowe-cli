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
import { Get, IDataSet, ISearchItem, ISearchOptions, IZosFilesResponse, IZosmfListResponse, List, Search } from "../../../../src";

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

    let testDataString = "THIS DATA SET CONTAINS SOME TESTDATA";
    let expectedCol = 29;
    let expectedLine = 1;
    let expectedMatchLength = 8;

    let searchOptions: ISearchOptions = {
        pattern: "TEST*",
        searchString: "TESTDATA",
        regex: false,
        caseSensitive: false,
        getOptions: {},
        listOptions: {},
        mainframeSearch: true,
        progressTask: undefined,
        maxConcurrentRequests: 1,
        timeout: undefined,
        continueSearch: undefined,
        abortSearch: undefined
    };
    let searchItems: ISearchItem[] = [
        {dsn: "TEST1.DS", member: undefined, matchList: undefined},
        {dsn: "TEST2.DS", member: undefined, matchList: undefined},
        {dsn: "TEST3.PDS", member: "MEMBER1", matchList: undefined},
        {dsn: "TEST3.PDS", member: "MEMBER2", matchList: undefined},
        {dsn: "TEST3.PDS", member: "MEMBER3", matchList: undefined}
    ];
    const searchDataSets: IDataSet[] = [
        {dsn: "TEST1.DS", member: undefined},
        {dsn: "TEST2.DS", member: undefined},
        {dsn: "TEST3.PDS", member: "MEMBER1"},
        {dsn: "TEST3.PDS", member: "MEMBER2"},
        {dsn: "TEST3.PDS", member: "MEMBER3"}
    ];
    let oldForceColor: string;

    function generateDS(name: string, pds: boolean, poe: boolean = false, migr: boolean = false) {
        return {
            dsname: name,
            dsorg: pds ? poe ? "PO-E" : "PO" : "PS",
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
        expectedLine = 1;
        expectedCol = 29;
        expectedMatchLength = 8;
        testDataString = "THIS DATA SET CONTAINS SOME TESTDATA";

        getDataSetSpy.mockClear();

        getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
            return Buffer.from(testDataString);
        });

        searchOptions = {
            pattern: "TEST*",
            searchString: "TESTDATA",
            regex: false,
            caseSensitive: false,
            getOptions: {},
            listOptions: {},
            mainframeSearch: true,
            progressTask: undefined,
            maxConcurrentRequests: 1,
            timeout: undefined,
            continueSearch: undefined,
            abortSearch: undefined
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

    beforeAll(() => {
        // We can't test color related stuff in GitHub Actions
        oldForceColor = process.env.FORCE_COLOR;
        process.env.FORCE_COLOR = "0";
    });

    afterAll(() => {
        process.env.FORCE_COLOR = oldForceColor;
        jest.restoreAllMocks();
    });

    describe("dataSets", () => {
        const searchOnMainframeSpy = jest.spyOn(Search as any, "searchOnMainframe");
        const searchLocalSpy = jest.spyOn(Search as any, "searchLocal");
        const listDataSetsMatchingPatternSpy = jest.spyOn(List, "dataSetsMatchingPattern");
        const listAllMembersSpy = jest.spyOn(List, "allMembers");

        function delay(ms: number) { jest.advanceTimersByTime(ms); }
        function regenerateMockImplementations() {
            searchOptions.searchExactName = undefined;
            searchOptions.pattern = "TEST*";
            searchOnMainframeSpy.mockImplementation(async (session, searchOptions: ISearchOptions, searchItems: ISearchItem[]) => {
                if ((Search as any).timerExpired != true && !(searchOptions.abortSearch && searchOptions.abortSearch())) {
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
            searchLocalSpy.mockImplementation(async (session, searchOptions: ISearchOptions, searchItems: ISearchItem[]) => {
                if ((Search as any).timerExpired != true && !(searchOptions.abortSearch && searchOptions.abortSearch())) {
                    const searchItemArray: ISearchItem[] = [];
                    for (const searchItem of searchItems) {
                        const localSearchItem: ISearchItem = searchItem;
                        localSearchItem.matchList = [{
                            column: expectedCol,
                            line: expectedLine,
                            contents: testDataString,
                            length: testDataString.length
                        }];
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
            listDataSetsMatchingPatternSpy.mockImplementation(async (_session, patterns, options) => {
                const responses: Partial<IZosmfListResponse>[] = [];
                if (options.maxLength) {
                    responses.push(generateDS("TEST3.PDS", true));
                }
                else {
                    responses.push(generateDS("TEST1.DS", false));
                    responses.push(generateDS("TEST2.DS", false));
                    responses.push(generateDS("TEST3.PDS", true));
                }
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: responses,
                    errorMessage: undefined
                } as IZosFilesResponse;
            });
            listAllMembersSpy.mockImplementation(async (_session, _dsn, _options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: generateMembers(["MEMBER1", "MEMBER2", "MEMBER3"]),
                    errorMessage: undefined
                } as IZosFilesResponse;
            });
            getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
                return Buffer.from(testDataString);
            });
        }

        beforeAll(() => {
            jest.useFakeTimers();
        });

        beforeEach(() => {
            searchOnMainframeSpy.mockClear();
            searchLocalSpy.mockClear();
            listDataSetsMatchingPatternSpy.mockClear();
            listAllMembersSpy.mockClear();
            regenerateMockImplementations();
        });

        afterAll(() => {
            jest.useRealTimers();
            searchOnMainframeSpy.mockRestore();
            searchLocalSpy.mockRestore();
        });

        it("Should search for the data sets containing a word", async () => {
            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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

        it("Should search for a specific data set containing a word 1", async () => {
            searchOptions.searchExactName = true;
            searchOptions.pattern = "TEST3.PDS";
            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST3.PDS"], {
                attributes: true,
                maxConcurrentRequests: 1,
                maxLength: 1
            });
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 3 data sets and PDS members");
            expect(response.commandResponse).not.toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).not.toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER1\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER2\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER3\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });

        it("Should search for a specific data set containing a word 2", async () => {
            searchOptions.searchExactName = true;
            searchOptions.pattern = "TEST*.PDS";
            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*.PDS"], {
                attributes: true,
                maxConcurrentRequests: 1,
                maxLength: 1
            });
            expect(listAllMembersSpy).toHaveBeenCalledTimes(0);
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 0 data sets and PDS members");
            expect(response.commandResponse).not.toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).not.toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).not.toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER1\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).not.toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER2\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).not.toContain("Data Set \"TEST3.PDS\" | Member \"MEMBER3\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });

        it("Should search for the data sets containing a word at the beginning of the string", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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
                    localSearchItem.matchList = [{
                        column: expectedCol,
                        line: expectedLine,
                        contents: testDataString,
                        length: testDataString.length
                    }];
                    searchItemArray.unshift(localSearchItem);
                }
                return {responses: searchItemArray, failures: []};
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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

        it("Should handle a callback that returns true (sync)", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            let suppliedDataSets: IDataSet[];
            searchOptions.continueSearch = function fakePrompt(dataSets: IDataSet[]) {
                suppliedDataSets = dataSets;
                return true;
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(suppliedDataSets).toEqual(searchDataSets);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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

        it("Should handle a callback that returns false (sync)", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            let suppliedDataSets: IDataSet[];
            searchOptions.continueSearch = function fakePrompt(dataSets: IDataSet[]) {
                suppliedDataSets = dataSets;
                return false;
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(0);
            expect(searchLocalSpy).toHaveBeenCalledTimes(0);

            expect(suppliedDataSets).toEqual(searchDataSets);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual(undefined);
            expect(response.commandResponse).toContain("The search was cancelled.");
        });

        it("Should handle a callback that returns undefined (sync)", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            let suppliedDataSets: IDataSet[];
            searchOptions.continueSearch = function fakePrompt(dataSets: IDataSet[]) {
                suppliedDataSets = dataSets;
                return undefined;
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(0);
            expect(searchLocalSpy).toHaveBeenCalledTimes(0);

            expect(suppliedDataSets).toEqual(searchDataSets);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual(undefined);
            expect(response.commandResponse).toContain("The search was cancelled.");
        });

        it("Should handle a callback that returns null (sync)", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            let suppliedDataSets: IDataSet[];
            searchOptions.continueSearch = function fakePrompt(dataSets: IDataSet[]) {
                suppliedDataSets = dataSets;
                return null;
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(0);
            expect(searchLocalSpy).toHaveBeenCalledTimes(0);

            expect(suppliedDataSets).toEqual(searchDataSets);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual(undefined);
            expect(response.commandResponse).toContain("The search was cancelled.");
        });

        it("Should handle a callback that returns true (async)", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            let suppliedDataSets: IDataSet[];
            searchOptions.continueSearch = async function fakePrompt(dataSets: IDataSet[]) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(true);
                    }, 1);
                    suppliedDataSets = dataSets;
                    delay(1);
                });
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(suppliedDataSets).toEqual(searchDataSets);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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

        it("Should handle a callback that returns false (async)", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            let suppliedDataSets: IDataSet[];
            searchOptions.continueSearch = async function fakePrompt(dataSets: IDataSet[]) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(false);
                    }, 1);
                    suppliedDataSets = dataSets;
                    delay(1);
                });
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(0);
            expect(searchLocalSpy).toHaveBeenCalledTimes(0);

            expect(suppliedDataSets).toEqual(searchDataSets);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual(undefined);
            expect(response.commandResponse).toContain("The search was cancelled.");
        });

        it("Should handle a callback that returns undefined (async)", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            let suppliedDataSets: IDataSet[];
            searchOptions.continueSearch = async function fakePrompt(dataSets: IDataSet[]) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(undefined);
                    }, 1);
                    suppliedDataSets = dataSets;
                    delay(1);
                });
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(0);
            expect(searchLocalSpy).toHaveBeenCalledTimes(0);

            expect(suppliedDataSets).toEqual(searchDataSets);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual(undefined);
            expect(response.commandResponse).toContain("The search was cancelled.");
        });

        it("Should handle a callback that returns null (async)", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            let suppliedDataSets: IDataSet[];
            searchOptions.continueSearch = async function fakePrompt(dataSets: IDataSet[]) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(null);
                    }, 1);
                    suppliedDataSets = dataSets;
                    delay(1);
                });
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(0);
            expect(searchLocalSpy).toHaveBeenCalledTimes(0);

            expect(suppliedDataSets).toEqual(searchDataSets);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual(undefined);
            expect(response.commandResponse).toContain("The search was cancelled.");
        });

        it("Should handle an abort that returns true 1", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            searchOptions.abortSearch = function fakeAbort() {
                return true;
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).toEqual("The following data set(s) failed to be searched: " +
                "\nTEST1.DS\nTEST2.DS\nTEST3.PDS(MEMBER1)\nTEST3.PDS(MEMBER2)\nTEST3.PDS(MEMBER3)\n");
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual([]);
            expect(response.commandResponse).toContain("The search was cancelled.");
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 0 data sets and PDS members.");
        });

        it("Should handle an abort that returns true 2", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            searchOptions.abortSearch = function fakeAbort() {
                return true;
            };
            searchOptions.progressTask = {
                stageName: TaskStage.NOT_STARTED,
                percentComplete: 0,
                statusMessage: undefined
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).toEqual("The following data set(s) failed to be searched: " +
                "\nTEST1.DS\nTEST2.DS\nTEST3.PDS(MEMBER1)\nTEST3.PDS(MEMBER2)\nTEST3.PDS(MEMBER3)\n");
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual([]);
            expect(response.commandResponse).toContain("The search was cancelled.");
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 0 data sets and PDS members.");

            expect(searchOptions.progressTask.percentComplete).toEqual(100);
            expect(searchOptions.progressTask.stageName).toEqual(TaskStage.FAILED);
            expect(searchOptions.progressTask.statusMessage).toEqual("Operation cancelled");
        });

        it("Should handle an abort that returns false", async () => {
            testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
            expectedCol = 1;
            expectedLine = 1;
            regenerateMockImplementations();
            searchOptions.abortSearch = function fakeAbort() {
                return false;
            };

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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
            listDataSetsMatchingPatternSpy.mockImplementation(async (_session, _patterns, _options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: [generateDS("TEST1.DS", false), generateDS("TEST2.DS", false), generateDS("TEST3.PDS", true, false, true)],
                    errorMessage: undefined
                } as IZosFilesResponse;
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(0);
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 2 data sets and PDS members");
            expect(response.commandResponse).toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });

        it("Should handle a PO-E data set", async () => {
            listDataSetsMatchingPatternSpy.mockImplementation(async (_session, _patterns, _options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: [generateDS("TEST1.DS", false), generateDS("TEST2.DS", false), generateDS("TEST3.PDS", true, true)],
                    errorMessage: undefined
                } as IZosFilesResponse;
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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
                    localSearchItem.matchList = [{
                        column: expectedCol,
                        line: expectedLine,
                        contents: testDataString,
                        length: testDataString.length
                    }];
                    searchItemArray.push(localSearchItem);
                }
                (Search as any).timerExpired = true;
                return {responses: searchItemArray, failures: []};
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
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
            listAllMembersSpy.mockImplementation(async (_session, _dsn, _options) => {
                throw new ImperativeError({msg: "Something went terribly wrong"});
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).toEqual("The following data set(s) failed to be searched: \nTEST3.PDS\n");
            expect(response.success).toEqual(false);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 2 data sets and PDS members");
            expect(response.commandResponse).toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });

        it("Should handle if a PDS list is empty", async () => {
            listAllMembersSpy.mockImplementation(async (_session, _dsn, _options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: generateMembers([]),
                    errorMessage: undefined
                } as IZosFilesResponse;
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
            expect(listAllMembersSpy).toHaveBeenCalledTimes(1);
            expect(listAllMembersSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS", {});
            expect(searchOnMainframeSpy).toHaveBeenCalledTimes(1);
            expect(searchLocalSpy).toHaveBeenCalledTimes(1);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.apiResponse).toEqual([
                {dsn: "TEST1.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]},
                {dsn: "TEST2.DS", member: undefined, matchList: [
                    {column: expectedCol, line: expectedLine, contents: testDataString, length: testDataString.length}
                ]}
            ]);
            expect(response.commandResponse).toContain("Found \"TESTDATA\" in 2 data sets and PDS members");
            expect(response.commandResponse).toContain("Data Set \"TEST1.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
            expect(response.commandResponse).toContain("Data Set \"TEST2.DS\":\nLine: " +
                expectedLine + ", Column: " + expectedCol + ", Contents: " + testDataString);
        });

        it("Should handle if listing data sets returns nothing", async () => {
            listDataSetsMatchingPatternSpy.mockImplementation(async (_session, _patterns, _options) => {
                return {
                    success: true,
                    commandResponse: "",
                    apiResponse: [],
                    errorMessage: undefined
                } as IZosFilesResponse;
            });

            const response = await Search.dataSets(dummySession, searchOptions);

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
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
            listDataSetsMatchingPatternSpy.mockImplementation(async (_session, _patterns, _options) => {
                throw impErr;
            });

            let err: any;
            try {
                await Search.dataSets(dummySession, searchOptions);
            } catch (error) {
                err = error;
            }

            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledTimes(1);
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
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
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
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
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
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
            listAllMembersSpy.mockImplementation(async (_session, _dsn, _options) => {
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
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
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
            listDataSetsMatchingPatternSpy.mockImplementation(async (_session, _patterns, _options) => {
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
            expect(listDataSetsMatchingPatternSpy).toHaveBeenCalledWith(dummySession, ["TEST*"], {attributes: true, maxConcurrentRequests: 1});
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
        describe("literal string", () => {
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
                getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
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
                getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
                    return Buffer.from("");
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
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

            it("Should return failures if aborted", async () => {
                searchOptions.abortSearch = function fakeAbort() { return true; };

                const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(0);
                expect(response).toEqual({
                    responses: [],
                    failures: ["TEST1.DS", "TEST2.DS", "TEST3.PDS(MEMBER1)", "TEST3.PDS(MEMBER2)", "TEST3.PDS(MEMBER3)"]
                });
            });

            it("Should handle a data set get failure", async () => {
                getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
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
                expect(searchOptions.progressTask.statusMessage).toEqual("Initial mainframe search: 4 of 5 entries checked");
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

        describe("regular expression", () => {
            beforeEach(() => {
                searchOptions.regex = true;
            });

            it("Should return a list of members that contain the literal search term with regex enabled (all)", async () => {
                testDataString = "HELLO WORLD THIS IS A TEST STRING";
                searchOptions.searchString = "TEST";
                const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
                const queryParams = "?research=" + searchOptions.searchString + "&maxreturnsize=1";

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

            it("Should return a list of members that contain the multiple words expression search term (all)", async () => {
                testDataString = "SIMPLE TEXT WITH MULTIPLE WORDS";
                searchOptions.searchString = "\\bMULTIPLE\\b";
                expectedCol = 18;
                const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
                const queryParams = "?research=" + encodeURIComponent(searchOptions.searchString) + "&maxreturnsize=1";

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

            it("Should return a list of members that contain matches on the number search term (all)", async () => {
                testDataString = "FIND NUMBERS LIKE 1234 AND 567890";
                searchOptions.searchString = "\\d+";
                const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
                const queryParams = "?research=" + encodeURIComponent(searchOptions.searchString) + "&maxreturnsize=1";

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

            it("Should return list of members that contain matches on all words beginning with a capital C (regardless of case) (all)", async () => {
                testDataString = "CAPITAL LETTERS ARE cool";
                searchOptions.searchString = "\\bC\\w+";
                const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
                const queryParams = "?research=" + encodeURIComponent(searchOptions.searchString) + "&maxreturnsize=1";

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

            it("Should return a list of members that contain the literal search term (case sensitive) (all)", async () => {
                testDataString = "HELLO WORLD THIS IS A Test STRING";
                searchOptions.searchString = "Test";
                searchOptions.caseSensitive = true;
                expectedCol = 23;
                const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
                const queryParams = "?research=" + searchOptions.searchString + "&maxreturnsize=1&insensitive=false";

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

            it("Should return a list of members that contain matches on the number search term (case sensitive) (all)", async () => {
                testDataString = "FIND NUMBERS LIKE 1234 and 567890";
                searchOptions.searchString = "\\d+";
                searchOptions.caseSensitive = true;
                const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
                const queryParams = "?research=" + encodeURIComponent(searchOptions.searchString) + "&maxreturnsize=1&insensitive=false";

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

            it("Should return a list of members that contain matches on all words beginning with capital C (case sensitive) (all)", async () => {
                testDataString = "CAPITAL LETTERS ARE cool";
                searchOptions.searchString = "\\bC\\w+";
                searchOptions.caseSensitive = true;
                expectedCol = 1;
                const response = await (Search as any).searchOnMainframe(dummySession, searchOptions, searchItems);
                const queryParams = "?research=" + encodeURIComponent(searchOptions.searchString) + "&maxreturnsize=1&insensitive=false";

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
    });

    describe("searchLocal", () => {
        describe("literal string", () => {
            it("Should return a list of members that contain the search term (all)", async () => {
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
            });

            it("Should return a list of members that contain the search term (all) at the beginning", async () => {
                expectedCol = 1;
                expectedLine = 1;
                testDataString = "TESTDATA IS AT THE BEGINNING OF THE STRING";
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
            });

            it("Should return a list of members that contain the search term (none)", async () => {
                // Return non-matching buffers for all entries
                getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
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
                getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
                    return Buffer.from("");
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
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
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
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

            it("Should return failures if aborted", async () => {
                searchOptions.abortSearch = function fakeAbort() { return true; };

                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(0);
                expect(response).toEqual({
                    responses: [],
                    failures: ["TEST1.DS", "TEST2.DS", "TEST3.PDS(MEMBER1)", "TEST3.PDS(MEMBER2)", "TEST3.PDS(MEMBER3)"]
                });
            });

            it("Should handle a data set get failure", async () => {
                getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
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
                        {dsn: "TEST1.DS", member: undefined, matchList: [
                            {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                        ]},
                        {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                            {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                        ]},
                        {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                            {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                        ]},
                        {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                            {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                        ]}
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
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
                expect(searchOptions.progressTask.stageName).toEqual(TaskStage.IN_PROGRESS);

                // Because the 5th entry is the last, there will have been 4 completed tasks
                expect(searchOptions.progressTask.statusMessage).toEqual("Performing search: 4 of 5 entries checked");
                expect(searchOptions.progressTask.percentComplete).toEqual(80);
            });

            it("Should update the progress task, if present 2", async () => {
                searchOptions.progressTask = {
                    percentComplete: 40,
                    statusMessage: "Initial mainframe search: 4 of 5 entries checked",
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
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
                expect(searchOptions.progressTask.stageName).toEqual(TaskStage.IN_PROGRESS);

                // Because the 5th entry is the last, there will have been 4 completed tasks
                expect(searchOptions.progressTask.statusMessage).toEqual("Performing search: 4 of 5 entries checked");
                expect(searchOptions.progressTask.percentComplete).toEqual(90);
            });

            it("Should handle case sensitivity 1", async () => {
                searchOptions.caseSensitive = true;
                // Return empty buffers for the final 2 entries
                getDataSetSpy.mockImplementation(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString.toLowerCase());
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
                    return Buffer.from(testDataString);
                }).mockImplementationOnce(async (_session, _dsn, _options) => {
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
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
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
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
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
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
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
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
            });

            it("Should handle being passed an empty list of search entries", async () => {
                const response = await (Search as any).searchLocal(dummySession, searchOptions, []);

                expect(getDataSetSpy).toHaveBeenCalledTimes(0);
                expect(response).toEqual({responses: [], failures: []});
            });
        });

        describe("regular expression", () => {
            // This is required when the regex matches on several columns on the same line
            let expectedCols: number[];
            let expectedMatchLengths: number[];

            beforeEach(() => {
                searchOptions.regex = true;
            });

            it("Should return a list of members that contain the literal search term with regex enabled (all)", async () => {
                testDataString = "HELLO WORLD THIS IS A TEST STRING";
                searchOptions.searchString = "TEST";
                expectedCol = 23;
                expectedMatchLength = 4;
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
            });

            it("Should return a list of members that contain the multiple words expression search term (all)", async () => {
                testDataString = "SIMPLE TEXT WITH MULTIPLE WORDS";
                searchOptions.searchString = "\\bMULTIPLE\\b";
                expectedCol = 18;
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
            });

            it("Should return a list of members that contain matches on the number search term (all)", async () => {
                testDataString = "FIND NUMBERS LIKE 1234 AND 567890";
                searchOptions.searchString = "\\d+";
                expectedCols = [19, 28];
                expectedMatchLengths = [4, 6];
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]}
                ], failures: []});
            });

            it("Should return list of members that contain matches on all words beginning with a capital C (regardless of case) (all)", async () => {
                testDataString = "CAPITAL LETTERS ARE cool";
                searchOptions.searchString = "\\bC\\w+";
                expectedCols = [1, 21];
                expectedMatchLengths = [7, 4];
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]}
                ], failures: []});
            });

            it("Should return a list of members that contain the literal search term (case sensitive) (all)", async () => {
                testDataString = "HELLO WORLD THIS IS A Test STRING";
                searchOptions.searchString = "Test";
                searchOptions.caseSensitive = true;
                expectedCol = 23;
                expectedMatchLength = 4;
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
            });

            it("Should return a list of members that contain matches on the number search term (case sensitive) (all)", async () => {
                testDataString = "FIND NUMBERS LIKE 1234 and 567890";
                searchOptions.searchString = "\\d+";
                searchOptions.caseSensitive = true;
                expectedCols = [19, 28];
                expectedMatchLengths = [4, 6];
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCols[0], line: expectedLine, contents: testDataString, length: expectedMatchLengths[0]},
                        {column: expectedCols[1], line: expectedLine, contents: testDataString, length: expectedMatchLengths[1]}
                    ]}
                ], failures: []});
            });

            it("Should return a list of members that contain matches on all words beginning with capital C (case sensitive) (all)", async () => {
                testDataString = "CAPITAL LETTERS ARE cool";
                searchOptions.searchString = "\\bC\\w+";
                searchOptions.caseSensitive = true;
                expectedCol = 1;
                expectedMatchLength = 7;
                const response = await (Search as any).searchLocal(dummySession, searchOptions, searchItems);

                expect(getDataSetSpy).toHaveBeenCalledTimes(5);
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST1.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST2.DS", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER1)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER2)", {});
                expect(getDataSetSpy).toHaveBeenCalledWith(dummySession, "TEST3.PDS(MEMBER3)", {});
                expect(response).toEqual({responses: [
                    {dsn: "TEST1.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST2.DS", member: undefined, matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER1", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER2", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]},
                    {dsn: "TEST3.PDS", member: "MEMBER3", matchList: [
                        {column: expectedCol, line: expectedLine, contents: testDataString, length: expectedMatchLength}
                    ]}
                ], failures: []});
            });

            it("Should handle being passed an empty list of search entries", async () => {
                const response = await (Search as any).searchLocal(dummySession, searchOptions, []);

                expect(getDataSetSpy).toHaveBeenCalledTimes(0);
                expect(response).toEqual({responses: [], failures: []});
            });
        });
    });
});
