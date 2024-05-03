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

import { Session } from "@zowe/imperative";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";
import { Create, Upload, Delete, Search, CreateDataSetTypeEnum, ISearchOptions, IZosFilesResponse } from "../../../../src";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;

let pattern: string;

const searchString = "Zowe CLI";
const goodTestString = "This system test is brought to you by Zowe CLI!";
const badTestString = "Sadly, this string will not match the search.";

describe("Search", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_files_search"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Data Sets", () => {
        let dsnPrefix: string;

        let goodDsNames: string[];
        let badDsNames: string[];

        let pdsNames: string[];
        let pdsGoodMemNames: string[];
        let pdsBadMemNames: string[];

        let searchOptions: ISearchOptions;
        let expectedApiResponse: any;

        beforeAll(async () => {
            dsnPrefix = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILES.SEARCH`);
            pattern = dsnPrefix + ".*";

            goodDsNames = [`${dsnPrefix}.SEQ1`, `${dsnPrefix}.SEQ4`, `${dsnPrefix}.SEQ5`];
            badDsNames = [`${dsnPrefix}.SEQ2`, `${dsnPrefix}.SEQ3`];

            pdsNames = [`${dsnPrefix}.PDS1`, `${dsnPrefix}.PDS2`];
            pdsGoodMemNames = ["MEM2", "MEM3"];
            pdsBadMemNames = ["MEM1", "MEM4"];

            for (const dsn of [...goodDsNames, ...badDsNames]) {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsn);
                if (goodDsNames.includes(dsn)) {
                    await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(goodTestString), `${dsn}`);
                } else {
                    await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(badTestString), `${dsn}`);
                }
            }

            for (const dsn of pdsNames) {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsn);
                for (const memname of pdsGoodMemNames) {
                    await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(goodTestString), `${dsn}(${memname})`);
                }
                for (const memname of pdsBadMemNames) {
                    await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(badTestString), `${dsn}(${memname})`);
                }
            }
        });

        afterAll(async () => {
            for (const dsn of [...goodDsNames, ...badDsNames, ...pdsNames]) {
                await Delete.dataSet(REAL_SESSION, dsn);
            }
        });

        beforeEach(() => {
            searchOptions = {
                pattern,
                searchString,
                getOptions: {},
                listOptions: {},
                mainframeSearch: undefined,
                progressTask: undefined,
                maxConcurrentRequests: undefined,
                timeout: undefined
            };

            expectedApiResponse = [
                {dsn: `${dsnPrefix}.PDS1`, member: "MEM2", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS1`, member: "MEM3", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS2`, member: "MEM2", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS2`, member: "MEM3", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ1`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ4`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ5`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
            ];
        });

        it("should search and find the correct data sets", async () => {
            const response = await Search.dataSets(REAL_SESSION, searchOptions);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.commandResponse).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
            expect(response.apiResponse).toEqual(expectedApiResponse);
        });

        it("should perform an initial mainframe search if requested", async () => {
            searchOptions.mainframeSearch = true;
            const response = await Search.dataSets(REAL_SESSION, searchOptions);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.commandResponse).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.commandResponse).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should handle case sensitive searches 1", async () => {
            searchOptions.caseSensitive = true;
            const response = await Search.dataSets(REAL_SESSION, searchOptions);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.commandResponse).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.commandResponse).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should handle case sensitive searches 2", async () => {
            searchOptions.searchString = "Zowe CLI".toLowerCase();
            searchOptions.caseSensitive = true;
            const response = await Search.dataSets(REAL_SESSION, searchOptions);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.commandResponse).toContain(`Found "${searchString.toLowerCase()}" in 0 data sets and PDS members`);
            expect(response.commandResponse).not.toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.commandResponse).not.toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.commandResponse).not.toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.commandResponse).not.toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.commandResponse).not.toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.commandResponse).not.toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.commandResponse).not.toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.commandResponse).not.toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should allow for multiple concurrent requests", async () => {
            searchOptions.maxConcurrentRequests = 2;
            const response = await Search.dataSets(REAL_SESSION, searchOptions);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.commandResponse).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.commandResponse).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should time out after some time 1", async () => {
            searchOptions.timeout = 120;
            const response = await Search.dataSets(REAL_SESSION, searchOptions);

            expect(response.errorMessage).not.toBeDefined();
            expect(response.success).toEqual(true);
            expect(response.commandResponse).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.commandResponse).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should time out after some time 2", async () => {
            searchOptions.timeout = 1;
            const response = await Search.dataSets(REAL_SESSION, searchOptions);

            /**
             * Since this test is timeout based, we cannot make many assumptions about what will or will not be found.
             * The safest assumption is that something may or may not be found, but we will not find everything
             * in under one second.
             */
            expect(response.success).toEqual(false);
            expect(response.commandResponse).toContain(`Found "${searchString}" in`);
            expect(response.commandResponse).toContain(`data sets and PDS members`);
            expect(response.errorMessage).toContain("The following data set(s) failed to be searched:");
        });

        it("should fail without a pattern to search for", async () => {
            searchOptions.pattern = undefined;
            let error: any;
            let response: IZosFilesResponse;

            try {
                response = await Search.dataSets(REAL_SESSION, searchOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain("Required object must be defined");
            expect(response).not.toBeDefined();
        });

        it("should fail without a query string to search for", async () => {
            searchOptions.searchString = undefined;
            let error: any;
            let response: IZosFilesResponse;

            try {
                response = await Search.dataSets(REAL_SESSION, searchOptions);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain("Required object must be defined");
            expect(response).not.toBeDefined();
        });
    });
});