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
import { readdirSync, rmSync } from "fs";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let pattern: string;
let dsnames: string[];
const testString = "test";

describe("Download Dataset Matching", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "download_data_set_matching"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        const dsnPrefix = getUniqueDatasetName(defaultSystem.zosmf.user + ".ZOSTEST");
        dsnames = [dsnPrefix, dsnPrefix+".T01", dsnPrefix+".T02", dsnPrefix+".T03"];
        pattern = dsnPrefix + "*";
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_download_dsm_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        beforeEach(async () => {
            for (const dsn of dsnames) {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsn);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testString), `${dsn}(${testString})`);
            }
            // Cleanup
            const files = readdirSync(TEST_ENVIRONMENT_NO_PROF.workingDir);
            for (const file in files) {
                if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                    const filePath = path.join(TEST_ENVIRONMENT_NO_PROF.workingDir, file);
                    rmSync(filePath, {recursive: true});
                }
            }
        });

        afterEach(async () => {
            for (const dsn of dsnames) {
                await Delete.dataSet(REAL_SESSION, dsn);
            }
        });

        it("should download matching datasets", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm_fully_qualified.sh");

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(shellScript,
                TEST_ENVIRONMENT_NO_PROF,
                [pattern,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });
    });

    describe("Success scenarios - PDS", () => {
        beforeEach(async () => {
            for (const dsn of dsnames) {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsn);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testString), `${dsn}(${testString})`);
            }
            // Cleanup
            const files = readdirSync(TEST_ENVIRONMENT.workingDir);
            for (const file in files) {
                if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                    const filePath = path.join(TEST_ENVIRONMENT.workingDir, file);
                    rmSync(filePath, {recursive: true});
                }
            }
        });

        afterEach(async () => {
            for (const dsn of dsnames) {
                await Delete.dataSet(REAL_SESSION, dsn);
            }
        });

        it("should download data sets matching a given pattern", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern in binary format", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--binary"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern in record format", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--record"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern with response timeout", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern with --max-concurrent-requests 2", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--max-concurrent-requests", 2]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern with response-format-json flag", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern to specified directory", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const testDir = "test/folder";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "-d", testDir]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ${testDir}`);
        });

        it("should download data sets matching a given pattern with extension = \".jcl\"", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const testDir = "test/folder";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--rfj", "-d", testDir, "-e", ".jcl"]);

            const result = JSON.parse(response.stdout.toString());
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(result.stdout).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(result.stdout).toContain(`${dsnames.length} data set(s) downloaded successfully to ${testDir}`);

            for (const apiResp of result.data.apiResponse) {
                expect(apiResp.status).toContain("member(s) downloaded successfully.");
                expect(apiResp.status).toContain("Destination:");
                expect(apiResp.status).toContain(testDir);
                expect(apiResp.status).toContain("Members:  TEST;");
            }
        });

        it("should not download data sets matching a given pattern if they already exist", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            let response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);

            response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) skipped because they already exist`);
        });
    });

    describe("Success scenarios - PS", () => {
        beforeEach(async () => {
            for (const dsn of dsnames) {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsn);
                await Upload.bufferToDataSet(REAL_SESSION, Buffer.from(testString), `${dsn}`);
            }
            // Cleanup
            const files = readdirSync(TEST_ENVIRONMENT.workingDir);
            for (const file in files) {
                if (!(file == "zowe.config.json" || file == "zowe.config.user.json" || file.startsWith("."))) {
                    const filePath = path.join(TEST_ENVIRONMENT.workingDir, file);
                    rmSync(filePath, {recursive: true});
                }
            }
        });

        afterEach(async () => {
            for (const dsn of dsnames) {
                await Delete.dataSet(REAL_SESSION, dsn);
            }
        });

        it("should download data sets matching a given pattern", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern in binary format", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--binary"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern in record format", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--record"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern with response timeout", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern with --max-concurrent-requests 2", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--max-concurrent-requests", 2]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern with response-format-json flag", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);
        });

        it("should download data sets matching a given pattern to specified directory", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const testDir = "test/folder";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "-d", testDir]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ${testDir}`);
        });

        it("should download data sets matching a given pattern with extension = \".jcl\"", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            const testDir = "test/folder";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern, "--rfj", "-d", testDir, "-e", ".jcl"]);

            const result = JSON.parse(response.stdout.toString());
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(result.stdout).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(result.stdout).toContain(`${dsnames.length} data set(s) downloaded successfully to ${testDir}`);

            for (const apiResp of result.data.apiResponse) {
                expect(apiResp.status).toContain("Data set downloaded successfully.");
                expect(apiResp.status).toContain("Destination:");
                expect(apiResp.status).toContain(testDir);
            }
        });

        it("should not download data sets matching a given pattern if they already exist", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_dsm.sh");
            let response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) downloaded successfully to ./`);

            response = runCliScript(shellScript, TEST_ENVIRONMENT, [pattern]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) were found matching pattern`);
            expect(response.stdout.toString()).toContain(`${dsnames.length} data set(s) skipped because they already exist`);
        });
    });
});
