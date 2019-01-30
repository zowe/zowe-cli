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

import { Imperative, IO, Session } from "@brightside/imperative";
import * as path from "path";
import { runCliScript, getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
// import { Create, CreateDataSetTypeEnum, Delete, ZosFilesMessages } from "../../../../../../zosfiles";
import { Get, ZosFilesConstants } from "../../../../../index";
import { ZosmfRestClient } from "../../../../../../rest";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let ussname: string;
let binaryFiles: string;
let binaryFile: string;
let asciiFile: string;
let asciiFiles: string;
let dsname: string;

describe("Upload directory to USS", () => {

    beforeAll(async () => {

        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_files_upload_directory_to_uss_with_profile"
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.UPLOAD`);
        dsname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${dsname}`;
        Imperative.console.info("Using ussDir:" + ussname);
        binaryFile = "bin_file.pax";
        binaryFiles = "bin_file.pax,subdir_bin_file1.pax,subdir_bin_file2.pax.Z";
        asciiFile = "ascii_file.txt";
        asciiFiles = "ascii_file.txt,subdir_ascii_file1.txt,subdir_ascii_file2.txt";
    });

    // afterAll(async () => {
    //     await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    //     await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
    // });

    describe("without profiles", () => {
        let sysProps;
        let defaultSys: ITestSystemSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "upload_dir_to_uss"
            });

            sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            defaultSys = sysProps.getDefaultSystem();

            Imperative.console.info("Using ussDir:" + ussname);
        });

        afterEach(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint, [{"X-IBM-Option": "recursive"}]);
            } catch (err) {
                error = err;
            }
        });

        it("should upload local directory to USS directory", async () => {
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtu_dir/command_upload_dtu_subdir_ascii");
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtu_fully_qualified.sh");

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }
            const response = runCliScript(shellScript,
                TEST_ENVIRONMENT_NO_PROF,
                [
                    localDirName,
                    ussname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass,
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Directory uploaded successfully.");
        });
    });

    describe("Success scenarios", () => {

        afterEach(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint, [{"X-IBM-Option": "recursive"}]);
            } catch (err) {
                error = err;
            }
        });

        it("should upload from local directory to USS directory", async () => {
            const localDirName = path.join(__dirname, "__data__", "command_upload_dtu_dir/command_upload_dtu_subdir_ascii");
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtu_fully_qualified.sh");
            console.log(TEST_ENVIRONMENT);
            console.log(defaultSystem.zosmf.host);
            console.log(defaultSystem.zosmf.port);
            console.log(defaultSystem.zosmf.user);
            console.log(defaultSystem.zosmf.pass);
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName, ussname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Directory uploaded successfully.");
        });

        // it("should upload from recursively local directory to USS directory", async () => {
        //     const localDirName = path.join(__dirname, "__data__", "command_upload_dtu_dir");
        //     const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtu_fully_qualified.sh");
        //     const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName, ussname, "--recursive"]);
        //     expect(response.stderr.toString()).toBe("");
        //     expect(response.status).toBe(0);
        //     expect(response.stdout.toString()).toContain("Directory uploaded successfully.");
        // });

        // it("should upload local directory with response-format-json flag", async () => {
        //     const shellScript = path.join(__dirname, "__scripts__", "command", "command_upload_dtu.sh");
        //     const localDirName = path.join(__dirname, "__data__", "command_upload_dtu_dir");
        //     const response = runCliScript(shellScript, TEST_ENVIRONMENT, [localDirName, ussname, "--rfj"]);
        //     expect(response.stderr.toString()).toBe("");
        //     expect(response.status).toBe(0);
        //     const stdoutText = response.stdout.toString();
        //     expect(stdoutText).toContain("\"stdout\": \"success: true");
        //     expect(stdoutText).toContain(
        //         "\"commandResponse\": \"Directory uploaded successfully.\"");
        // });
    });
});
