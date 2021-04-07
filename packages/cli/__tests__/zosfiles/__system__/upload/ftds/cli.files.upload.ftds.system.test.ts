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
import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getRandomBytes, getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { Create, CreateDataSetTypeEnum, ICreateDataSetOptions, Delete, Get } from "@zowe/zos-files-for-zowe-sdk";

let REAL_SESSION: Session;
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;

describe("Upload file to data set", () => {
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
                testName: "zos_files_upload_ftds_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        beforeEach(async () => {
            try {
                await Create.dataSet(
                    REAL_SESSION,
                    CreateDataSetTypeEnum.DATA_SET_PARTITIONED,
                    dsname
                );
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

        it("should upload to data set from local file", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_upload_ftds_fully_qualified.sh"
            );
            const localFileName = path.join(
                __dirname,
                "__data__",
                "command_upload_ftds.txt"
            );

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] =
                    defaultSys.zosmf.basePath;
            }

            const response = runCliScript(
                shellScript,
                TEST_ENVIRONMENT_NO_PROF,
                [
                    localFileName,
                    dsname + "(member)",
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass
                ]
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(
                "Data set uploaded successfully."
            );
            const content = await Get.dataSet(
                REAL_SESSION,
                dsname + "(member)"
            );
            expect(content.toString().trim()).toEqual(
                IO.readFileSync(localFileName).toString().trim()
            );
        });
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(
                    REAL_SESSION,
                    CreateDataSetTypeEnum.DATA_SET_PARTITIONED,
                    dsname
                );
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

        it("should upload to data set from local file", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_upload_ftds.sh"
            );
            const localFileName = path.join(
                __dirname,
                "__data__",
                "command_upload_ftds.txt"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [
                localFileName,
                dsname + "(member)"
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(
                "Data set uploaded successfully."
            );
            const content = await Get.dataSet(
                REAL_SESSION,
                dsname + "(member)"
            );
            expect(content.toString().trim()).toEqual(
                IO.readFileSync(localFileName).toString().trim()
            );
        });

        it("should upload a member to a PDS-E/Library data set from local file", async () => {
            /** @see issue #148 */
            const dsnLibrary: string = getUniqueDatasetName(
                defaultSystem.zosmf.user
            );
            const dsnOptions: ICreateDataSetOptions = {
                dsntype: "LIBRARY",
                primary: 1,
                lrecl: 80
            };
            try {
                await Create.dataSet(
                    REAL_SESSION,
                    CreateDataSetTypeEnum.DATA_SET_PARTITIONED,
                    dsnLibrary,
                    dsnOptions
                );
            } catch (err) {
                throw err;
            }
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_upload_ftds.sh"
            );
            const localFileName = path.join(
                __dirname,
                "__data__",
                "command_upload_ftds.txt"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [
                localFileName,
                dsnLibrary + "(member)"
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(
                "Data set uploaded successfully."
            );
            const content = await Get.dataSet(
                REAL_SESSION,
                dsnLibrary + "(member)"
            );
            expect(content.toString().trim()).toEqual(
                IO.readFileSync(localFileName).toString().trim()
            );
            // Cleanup
            await Delete.dataSet(REAL_SESSION, dsnLibrary);
        });

        it("should upload data set from a local file in binary mode", async () => {
            const randomDataLength = 70;
            const randomData = await getRandomBytes(randomDataLength);
            const randomDataFile = path.join(
                TEST_ENVIRONMENT.workingDir,
                "random_data.bin"
            );
            IO.writeFile(randomDataFile, randomData);
            expect(IO.readFileSync(randomDataFile, undefined, true)).toEqual(
                randomData
            );
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_upload_ftds_binary.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [
                randomDataFile,
                dsname + "(member)"
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain("success: true");
            expect(stdoutText).toContain("from:");
            expect(stdoutText).toContain(randomDataFile);
            expect(stdoutText).toContain("Data set uploaded successfully.");

            const uploadedContent = await Get.dataSet(
                REAL_SESSION,
                dsname + "(member)",
                { binary: true }
            );
            expect(uploadedContent.subarray(0, randomData.length)).toEqual(
                randomData
            );
        });

        it("should upload data set with response-format-json flag", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_upload_ftds.sh"
            );
            const localFileName = path.join(
                __dirname,
                "__data__",
                "command_upload_ftds.txt"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [
                localFileName,
                dsname + "(member)",
                "--rfj"
            ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const stdoutText = response.stdout.toString();
            expect(stdoutText).toContain('"stdout": "success: true');
            expect(stdoutText).toContain("from:");
            expect(stdoutText).toContain("file_to_upload:");
            expect(stdoutText).toContain(
                '"commandResponse": "Data set uploaded successfully."'
            );
            const content = await Get.dataSet(
                REAL_SESSION,
                dsname + "(member)"
            );
            expect(content.toString().trim()).toEqual(
                IO.readFileSync(localFileName).toString().trim()
            );
        });
    });

    describe("Expected failures", () => {
        it("should fail when mf dataset does not exist", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_upload_ftds.sh"
            );
            const localFileName = path.join(
                __dirname,
                "__data__",
                "command_upload_ftds.txt"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [
                localFileName,
                "MF.DOES.NOT.EXIST"
            ]);
            expect(response.stderr.toString()).toContain("Data set not found");
        });
    });
});
