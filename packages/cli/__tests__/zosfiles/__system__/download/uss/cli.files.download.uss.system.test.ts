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

import { Imperative, Session } from "@zowe/imperative";
import * as path from "path";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { ZosFilesConstants } from "@zowe/zos-files-for-zowe-sdk";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let ussname: string;

describe("Download USS File", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "download_uss_file"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        // using unique DS function to generate unique USS file name
        ussname = getUniqueDatasetName(
            `${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`
        );
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_download_uss_data_set_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;

            const data: string = "abcdefghijklmnopqrstuvwxyz";
            const endpoint: string =
                ZosFilesConstants.RESOURCE +
                ZosFilesConstants.RES_USS_FILES +
                ussname;
            await ZosmfRestClient.putExpectString(
                REAL_SESSION,
                endpoint,
                [],
                data
            );
        });

        afterAll(async () => {
            const endpoint: string =
                ZosFilesConstants.RESOURCE +
                ZosFilesConstants.RES_USS_FILES +
                ussname;

            try {
                await ZosmfRestClient.deleteExpectString(
                    REAL_SESSION,
                    endpoint
                );
            } catch (err) {
                Imperative.console.error(err);
            }

            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should download uss file", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_file_fully_qualified.sh"
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
                    ussname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.password,
                ]
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain(
                "USS file downloaded successfully."
            );
            expect(response.status).toBe(0);
        });
    });

    describe("Success scenarios", () => {
        beforeAll(async () => {
            const data: string = "abcdefghijklmnopqrstuvwxyz";
            const endpoint: string =
                ZosFilesConstants.RESOURCE +
                ZosFilesConstants.RES_USS_FILES +
                ussname;
            await ZosmfRestClient.putExpectString(
                REAL_SESSION,
                endpoint,
                [],
                data
            );
        });

        afterAll(async () => {
            const endpoint: string =
                ZosFilesConstants.RESOURCE +
                ZosFilesConstants.RES_USS_FILES +
                ussname;

            try {
                await ZosmfRestClient.deleteExpectString(
                    REAL_SESSION,
                    endpoint
                );
            } catch (err) {
                Imperative.console.error(err);
            }
        });

        it("should download an uss file", () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_file.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(
                "USS file downloaded successfully."
            );
        });

        it("should download an uss file with response timeout", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_uss_file.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("USS file downloaded successfully.");
        });

        it("should download uss file with response-format-json flag", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_file.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain(
                "USS file downloaded successfully."
            );
            expect(response.status).toBe(0);
        });

        it("should download uss file to a specified file name", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_file.sh"
            );
            const fileName = "testFile.txt";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname, `-f ${fileName}`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain(
                "USS file downloaded successfully."
            );
            expect(response.stdout.toString()).toContain(fileName);
            expect(response.status).toBe(0);
        });
    });

    describe("Expected failures", () => {
        it("should fail due to specified uss file name does not exist", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_file.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [
                ussname + ".dummy"
            ]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("No such file or directory.");
        });
    });
});
