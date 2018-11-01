/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { IO, Session } from "@brightside/imperative";
import * as path from "path";
import { getRandomBytes, getUniqueDatasetName, runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Create, CreateDataSetTypeEnum, Delete, Get } from "../../../../../../zosfiles";

let REAL_SESSION: Session;
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;

describe("Upload Data Set", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "upload_data_set"
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let sysProps;
        let defaultSys: ITestSystemSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_upload_stdin_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();
        });

        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
            } catch (err) {
                throw err;
            }
        });

        afterEach(async () => {
            try {
                await Delete.dataSet(REAL_SESSION, dsname);
            } catch (err) {
                throw err;
            }
        });

        it("should upload data set from standard input", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_stds_fully_qualified.sh");

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(shellScript, TEST_ENVIRONMENT_NO_PROF,
                [dsname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass
                    ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("success: true");
            expect(stdoutText).toContain("from:    stdin");
            expect(stdoutText).toContain("Data set uploaded successfully.");
        });
    });

    describe("Success scenarios", () => {

        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname);
            } catch (err) {
                throw err;
            }
        });

        afterEach(async () => {
            try {
                await Delete.dataSet(REAL_SESSION, dsname);
            } catch (err) {
                throw err;
            }
        });

        it("should display upload standard input help", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_upload_stds_help.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const helpText = response.stdout.toString();
            expect(helpText).toContain("COMMAND NAME");
            expect(helpText).toContain("DESCRIPTION");
            expect(helpText).toContain("USAGE");
            expect(helpText).toContain("OPTIONS");
            expect(helpText).toContain("EXAMPLES");
            expect(helpText).toContain("\"success\": true");
            expect(helpText).toContain("\"message\":");
            expect(helpText).toContain("\"stdout\":");
            expect(helpText).toContain("\"stderr\":");
            expect(helpText).toContain("\"data\":");
        });

        it("should upload data set from standard input", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_stds.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("success: true");
            expect(stdoutText).toContain("from:    stdin");
            expect(stdoutText).toContain("Data set uploaded successfully.");
        });

        it("should upload data set with response-format-json flag", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_stds.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("\"stdout\": \"success: true");
            expect(stdoutText).toContain("from:");
            expect(stdoutText).toContain(
                "\"commandResponse\": \"Data set uploaded successfully.\"");
        });

        it("should upload data set from standard input in binary mode", async () => {
            const randomDataLength = 70;
            const randomData = await getRandomBytes(randomDataLength);
            const randomDataFile = path.join(TEST_ENVIRONMENT.workingDir, "random_data.bin");
            IO.writeFile(randomDataFile, randomData);
            expect(IO.readFileSync(randomDataFile, undefined, true)).toEqual(randomData);
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_stds_binary.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname, randomDataFile]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("success: true");
            expect(stdoutText).toContain("from:    stdin");
            expect(stdoutText).toContain("Data set uploaded successfully.");

            const uploadedContent = await Get.dataSet(REAL_SESSION, dsname, {binary: true});
            expect(uploadedContent.subarray(0, randomData.length)).toEqual(randomData);
        });

        it("should leave the dataset empty when no standard input is supplied", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_stds_noinput.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [dsname ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("success: true");
            expect(stdoutText).toContain("from:    stdin");
            expect(stdoutText).toContain("Data set uploaded successfully.");
            const content = await Get.dataSet(REAL_SESSION, dsname);
            expect(content.toString().trim()).toEqual("");

        });
    });

    describe("Expected failures", () => {
        it("should fail due to missing data set name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_stds.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail when mf dataset does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_stds.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["MF.DOES.NOT.EXIST"]);
            expect(response.stderr.toString()).toContain("Data set not found");
        });
    });
});

