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
import * as path from "path";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { Create, CreateDataSetTypeEnum, Delete, Upload } from "@zowe/zos-files-for-zowe-sdk";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let pattern: string;
let searchHLQ: string;
let dsnPrefix: string;

let goodDsNames: string[];
let badDsNames: string[];

let pdsNames: string[];
let pdsGoodMemNames: string[];
let pdsBadMemNames: string[];

let searchString = "Zowe CLI";
const goodTestString = "This system test is brought to you by Zowe CLI!";
const badTestString = "Sadly, this string will not match the search.";

describe("Search Data Sets", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "search_data_sets"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        searchHLQ = defaultSystem.zosmf.user + ".SEARCH";

        dsnPrefix = getUniqueDatasetName(searchHLQ);
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
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    beforeEach(async () => {
        searchString = "Zowe CLI";
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_search_ds_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        const shellScript = path.join(__dirname, "__scripts__", "command_search_ds_fully_qualified.sh");

        it("should search and find the correct data sets", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF, [
                pattern,
                searchString,
                defaultSys.zosmf.host,
                defaultSys.zosmf.port,
                defaultSys.zosmf.user,
                defaultSys.zosmf.password
            ]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should search and find the correct data sets rfj", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF, [
                pattern,
                searchString,
                defaultSys.zosmf.host,
                defaultSys.zosmf.port,
                defaultSys.zosmf.user,
                defaultSys.zosmf.password,
                "--rfj"
            ]);
            const expectedApiResponse = [
                {dsn: `${dsnPrefix}.PDS1`, member: "MEM2", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS1`, member: "MEM3", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS2`, member: "MEM2", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS2`, member: "MEM3", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ1`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ4`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ5`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
            ];

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(JSON.parse(response.stdout.toString()).data.apiResponse).toEqual(expectedApiResponse);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should perform an initial mainframe search if requested", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF, [
                pattern,
                searchString,
                defaultSys.zosmf.host,
                defaultSys.zosmf.port,
                defaultSys.zosmf.user,
                defaultSys.zosmf.password,
                "--mainframe-search"
            ]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should handle case sensitive searches 1", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF, [
                pattern,
                searchString,
                defaultSys.zosmf.host,
                defaultSys.zosmf.port,
                defaultSys.zosmf.user,
                defaultSys.zosmf.password,
                "--case-sensitive"
            ]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should handle case sensitive searches 2", async () => {
            searchString = "Zowe CLI".toLowerCase();
            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF, [
                pattern,
                searchString,
                defaultSys.zosmf.host,
                defaultSys.zosmf.port,
                defaultSys.zosmf.user,
                defaultSys.zosmf.password,
                "--case-sensitive"
            ]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 0 data sets and PDS members`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).not.toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should allow for multiple concurrent requests", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF, [
                pattern,
                searchString,
                defaultSys.zosmf.host,
                defaultSys.zosmf.port,
                defaultSys.zosmf.user,
                defaultSys.zosmf.password,
                "--max-concurrent-requests 2"
            ]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should time out after some time 1", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF, [
                pattern,
                searchString,
                defaultSys.zosmf.host,
                defaultSys.zosmf.port,
                defaultSys.zosmf.user,
                defaultSys.zosmf.password,
                "--timeout 120"
            ]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should time out after some time 2", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF, [
                pattern,
                searchString,
                defaultSys.zosmf.host,
                defaultSys.zosmf.port,
                defaultSys.zosmf.user,
                defaultSys.zosmf.password,
                "--timeout 1"
            ]);

            /**
             * Since this test is timeout based, we cannot make many assumptions about what will or will not be found.
             * The safest assumption is that something may or may not be found, but we will not find everything
             * in under one second. 
             */
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in`);
            expect(response.stdout.toString()).toContain(`data sets and PDS members`);
            expect(response.stderr.toString()).toContain("The following data set(s) failed to be searched:");
        });

    });

    describe("with profiles", () => {
        const shellScript = path.join(__dirname, "__scripts__", "command_search_ds.sh");

        it("should search and find the correct data sets", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, searchString]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should search and find the correct data sets rfj", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, searchString, "--rfj"]);
            const expectedApiResponse = [
                {dsn: `${dsnPrefix}.PDS1`, member: "MEM2", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS1`, member: "MEM3", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS2`, member: "MEM2", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.PDS2`, member: "MEM3", matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ1`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ4`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
                {dsn: `${dsnPrefix}.SEQ5`, matchList: [{line: 0, column: 38, contents: goodTestString}]},
            ];

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(JSON.parse(response.stdout.toString()).data.apiResponse).toEqual(expectedApiResponse);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(JSON.parse(response.stdout.toString()).data.commandResponse).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should perform an initial mainframe search if requested", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, searchString, "--mainframe-search"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should handle case sensitive searches 1", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, searchString, "--case-sensitive"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should handle case sensitive searches 2", async () => {
            searchString = "Zowe CLI".toLowerCase();
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, searchString, "--case-sensitive"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 0 data sets and PDS members`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).not.toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).not.toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should allow for multiple concurrent requests", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, searchString, "--max-concurrent-requests 2"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should time out after some time 1", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, searchString, "--timeout 120"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in 7 data sets and PDS members`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS1" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM2":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.PDS2" | Member "MEM3":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ1":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ4":`);
            expect(response.stdout.toString()).toContain(`Data Set "${dsnPrefix}.SEQ5":`);
            expect(response.stdout.toString()).toContain(`Line: 0, Column: 38, Contents: ${goodTestString}`);
        });

        it("should time out after some time 2", async () => {
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, searchString, "--timeout 1"]);

            /**
             * Since this test is timeout based, we cannot make many assumptions about what will or will not be found.
             * The safest assumption is that something may or may not be found, but we will not find everything
             * in under one second. 
             */
            expect(response.status).toBe(1);
            expect(response.stdout.toString()).toContain(`Found "${searchString}" in`);
            expect(response.stdout.toString()).toContain(`data sets and PDS members`);
            expect(response.stderr.toString()).toContain("The following data set(s) failed to be searched:");
        });
    });
});
