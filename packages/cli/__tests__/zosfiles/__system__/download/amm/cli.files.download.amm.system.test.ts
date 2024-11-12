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
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { Create, CreateDataSetTypeEnum, Delete, Upload } from "@zowe/zos-files-for-zowe-sdk";
import { runCliScript } from "@zowe/cli-test-utils";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
const pattern = "M*";
const members = ["M1", "M2", "M3"];

describe("Download Members Matching Pattern", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "download_all_data_set_member_pattern"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_download_all_members_matching_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        beforeEach(async () => {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            for(const mem of members) {
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(mem), `${dsname}(${mem})`);
            }
        });

        afterEach(async () => {
            await Delete.dataSet(REAL_SESSION, dsname);
        });

        it("should download matching members of a pds", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm_fully_qualified.sh");

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }
            const response = runCliScript(shellScript,
                TEST_ENVIRONMENT_NO_PROF,
                [dsname, pattern,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${members.length} members(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
        });
    });

    describe("Success scenarios", () => {

        beforeEach(async () => {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            for(const mem of members) {
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(mem), `${dsname}(${mem})`);
            }
        });

        afterEach(async () => {
            await Delete.dataSet(REAL_SESSION, dsname);
        });

        it("should download all data set member of pds", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, pattern]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${members.length} members(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
        });

        it("should download all data set member of pds in binary format", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname,pattern, "--binary"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
        });

        it("should download all data set member of pds in record format", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, pattern, "--record"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
        });

        it("should download all data set member of pds with response timeout", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, pattern, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
        });

        it("should download all data set members with --max-concurrent-requests 2", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm_mcr.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, pattern, 2]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
        });

        it("should download all data set members of a large data set with --max-concurrent-requests 2", async () => {
            const bigDsname = getUniqueDatasetName(defaultSystem.zosmf.user);
            const pattern = "a*";
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, bigDsname);
            const members = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11", "a12", "a13", "b1", "b2"];
            const memberContent = Buffer.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ\nABCDEFGHIJKLMNOPQRSTUVWXYZ\nABCDEFGHIJKLMNOPQRSTUVWXYZ");
            for (const mem of members) {
                await Upload.bufferToDataSet(REAL_SESSION, memberContent, `${bigDsname}(${mem})`);
            }
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm_mcr.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [bigDsname, pattern, 2]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
            await Delete.dataSet(REAL_SESSION, bigDsname);
        });

        it("should download all data set member with response-format-json flag", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, pattern, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
        });

        it("should download all data set member to specified directory", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm.sh");
            const testDir = "test/folder";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, pattern,`-d ${testDir}`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Member(s) downloaded successfully.");
            expect(response.stdout.toString()).toContain(testDir);
        });

        it("should download all data set member with extension = \"\"", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_amm_no_extension.sh");
            const testDir = "test/folder";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, pattern,`-d ${testDir} --rfj`]);
            const result = JSON.parse(response.stdout.toString());
            const expectedResult = {member: "M1"};
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(result.stdout).toContain("Member(s) downloaded successfully.");
            expect(result.stdout).toContain(testDir);
            expect(result.data.apiResponse.items[0]).toEqual(expectedResult);
        });
    });

});
