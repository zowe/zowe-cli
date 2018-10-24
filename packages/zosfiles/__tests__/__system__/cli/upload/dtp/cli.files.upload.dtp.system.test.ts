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

import { Session } from "@brightside/imperative";
import * as path from "path";
import { getUniqueDatasetName, runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Create, CreateDataSetTypeEnum, Delete, ZosFilesMessages } from "../../../../../../zosfiles";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;

describe("Upload directory to PDS", () => {

    beforeAll(async () => {

        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "upload_data_set"
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Without profile", () => {
        let sysProps;
        let defaultSys: ITestSystemSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_upload_directory_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();
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

        it("should display upload directory help", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_upload_dtp_help.sh");
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
        it("should fail due to missing local directory name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("inputdir");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail due to missing mf data set name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtp_dir");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail when local directory does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtp.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, ["localDirThatDoesNotExist", dsname]);
            expect(stripNewLines(response.stderr.toString())).toContain("no such file or directory, lstat");
            expect(stripNewLines(response.stderr.toString())).toContain("localDirThatDoesNotExist");
        });

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

