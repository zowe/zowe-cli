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

import { Imperative, Session } from "@brightside/imperative";
import * as path from "path";
import { getUniqueDatasetName, runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ZosFilesConstants } from "../../../../../index";
import { ZosmfRestClient } from "../../../../../../rest";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let ussname: string;

describe("Download USS File", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "download_uss_file"
        });

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        // using unique DS function to generate unique USS file name
        ussname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
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
                testName: "zos_files_download_uss_data_set_without_profile"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should download data set", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_uss_file_fully_qualified.sh");
            const response = runCliScript(shellScript,
                TEST_ENVIRONMENT_NO_PROF,
                [ussname.substr(1, ussname.length),
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("USS file downloaded successfully.");
        });
    });

    describe("Success scenarios", () => {
        beforeAll(async () => {
            const data: string = "abcdefghijklmnopqrstuvwxyz";
            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
            try {
                (await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data));
            } catch (err) {
                throw err;
            }
        });

        afterAll(async () => {
            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                (await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint));
            } catch (err) {
                Imperative.console.error(err);
            }
        });

        it("should display download uss file help", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_uss_file_help.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should download an uss file", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_uss_file.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname.substr(1, ussname.length)]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("USS file downloaded successfully.");
        });

        it("should download uss file with response-format-json flag", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_uss_file.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname.substr(1, ussname.length), "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("USS file downloaded successfully.");
        });

        it("should download uss file to a specified file name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_uss_file.sh");
            const fileName = "testFile.txt";
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname.substr(1, ussname.length), `-f ${fileName}`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("USS file downloaded successfully.");
            expect(response.stdout.toString()).toContain(fileName);
        });
    });

    describe("Expected failures", () => {
        it("should fail due to missing uss file name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_uss_file.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("ussFileName");
            expect(response.stderr.toString()).toContain("Missing Positional");
        });

        it("should fail due to specified uss file name does not exist", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_uss_file.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussname + ".dummy"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("File not found.");
        });
    });
});
