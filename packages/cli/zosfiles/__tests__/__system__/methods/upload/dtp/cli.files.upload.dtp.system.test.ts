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
import { getUniqueDatasetName, runCliScript } from "../../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Create, CreateDataSetTypeEnum, Delete, ZosFilesMessages } from "../../../../../../../zosfiles";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;

describe("Upload directory to PDS", () => {

    beforeAll(async () => {

        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "upload_data_set"
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
                testName: "zos_files_upload_directory_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
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

        it("should upload data set from local directory", async () => {
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtp_dir");

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            const response = runCliScript(__dirname + "/__scripts__/command/command_upload_dtp_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    localDirName,
                    dsname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("file_to_upload: 5");
            expect(stdoutText).toContain("success:        5");
            expect(stdoutText).toContain("error:          0");
            expect(stdoutText).toContain("skipped:        0");
            expect(stdoutText).toContain("Data set uploaded successfully.");
        });
    });

    describe("Success scenarios", () => {

        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
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

        it("should upload data set from local directory", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtp_dir");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName, dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("file_to_upload: 5");
            expect(stdoutText).toContain("success:        5");
            expect(stdoutText).toContain("error:          0");
            expect(stdoutText).toContain("skipped:        0");
            expect(stdoutText).toContain("Data set uploaded successfully.");
        });

        it("should upload local directory with response-format-json flag", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtp_dir");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName, dsname, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("\"stdout\": \"success: true");
            expect(stdoutText).toContain("file_to_upload: 5");
            expect(stdoutText).toContain("success:        5");
            expect(stdoutText).toContain("error:          0");
            expect(stdoutText).toContain("skipped:        0");
            expect(stdoutText).toContain(
                "\"commandResponse\": \"Data set uploaded successfully.\"");
        });
    });

    describe("Expected failures", () => {

        it("should fail when mf data set does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtp_dir");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName, "MF.DOES.NOT.EXIST"]);
            expect(response.stderr.toString()).toContain("Data set not found");
        });

        it("should fail when the mf data set is not a PDS", async () => {
            const zosSeqFile = dsname + ".SEQ";
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, zosSeqFile);
            } catch (err) {
                throw err;
            }

            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtp_dir");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName, zosSeqFile]);
            expect(response.stderr.toString()).toContain(
                ZosFilesMessages.uploadDirectoryToPhysicalSequentialDataSet.message);

            try {
                await Delete.dataSet(REAL_SESSION, zosSeqFile);
            } catch (err) {
                throw err;
            }
        });
    });
});

