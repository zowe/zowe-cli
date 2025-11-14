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

import { IO, Session } from "@zowe/imperative";
import * as path from "path";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getRandomBytes, getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { Create, CreateDataSetTypeEnum, Delete, Upload } from "@zowe/zos-files-for-zowe-sdk";
import { runCliScript } from "@zowe/cli-test-utils";
import { readdirSync, rmSync } from "fs";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;

describe("Download Data Set", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "download_data_set"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user + ".ZOSTEST");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_download_data_set_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        beforeEach(async () => {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
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
            await Delete.dataSet(REAL_SESSION, dsname);
        });

        it("should download data set", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set_fully_qualified.sh");

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(shellScript,
                TEST_ENVIRONMENT_NO_PROF,
                [dsname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
        });
    });

    describe("Success scenarios", () => {

        beforeEach(async () => {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
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
            await Delete.dataSet(REAL_SESSION, dsname);
        });

        it("should download data set", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
        });

        it("should download data set in binary format", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, "--binary"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
        });

        it("should download data set in record format", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, "--record"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
        });

        it("should download data set with response timeout", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
        });

        it("should download data set in binary mode", async () => {
            const randomDataLength = 70;
            const randomData = await getRandomBytes(randomDataLength);
            const randomDataFile = path.join(TEST_ENVIRONMENT.workingDir, "random_data.bin");
            IO.writeFile(randomDataFile, randomData);
            expect(IO.readFileSync(randomDataFile, undefined, true)).toEqual(randomData);
            await Upload.pathToDataSet(REAL_SESSION, randomDataFile, dsname + "(member)", {binary: true});
            const downloadDestination = path.join(TEST_ENVIRONMENT.workingDir, "download.bin");
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set_binary.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname + "(member)", downloadDestination]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
            const downloadedContent = IO.readFileSync(downloadDestination, undefined, true);
            expect(downloadedContent.subarray(0, randomData.length)).toEqual(randomData);
        });

        it("should download data set with response-format-json flag", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
        });

        it("should download data set to a specified file name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const fileName = "testFile.txt";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, `-f ${fileName}`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
            expect(response.stdout.toString()).toContain(fileName);
        });

        it("should download data set with extension = \"\" flag", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set_no_extension.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
            expect(response.stdout.toString()).toContain(dsname.split(".")[2].toLowerCase());
        });

        it("should skip downloading a data set if it already exists", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            let response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");

            response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("skipped as it already exists");
        });
    });

    describe("Expected failures", () => {
        it("should fail due to missing data set name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Argument");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail due to specified data set name does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            dsname = getUniqueDatasetName(defaultSystem.zosmf.user + ".ZOSTEST");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname + ".dummy"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Data set not found.");
        });
    });
});
