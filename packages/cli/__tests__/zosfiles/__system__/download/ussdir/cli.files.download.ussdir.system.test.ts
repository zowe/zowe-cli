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
import * as fs from "fs";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { Create, Delete, Upload } from "@zowe/zos-files-for-zowe-sdk";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let ussname1: string;
let ussname2: string;
let ussname3: string;
let ussname4: string;
let ussdir1: string;
let ussdir2: string;
let expectedData: string;
const data: string = "abcdefghijklmnopqrstuvwxyz";
const filesToDelete: string[] = [];
const dirsToDelete: string[] = [];

describe("Download USS Directory", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "download_uss_directory"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        // using unique DS function to generate unique USS directory
        ussdir1 = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSDIR`);
        ussdir1 = `${defaultSystem.unix.testdir}/${ussdir1}`;
        Imperative.console.info("Using ussdir:" + ussdir1);

        // using unique DS function to generate unique USS directory
        ussdir2 = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSDIR`);
        dirsToDelete.push(ussdir2);
        ussdir2 = `${ussdir1}/${ussdir2}`;
        Imperative.console.info("Using ussdir:" + ussdir2);

        // using unique DS function to generate unique USS file name
        ussname1 = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
        filesToDelete.push(ussname1);
        ussname1 = `${ussdir1}/${ussname1}`;
        Imperative.console.info("Using ussfile:" + ussname1);

        // using unique DS function to generate unique USS file name
        ussname2 = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
        filesToDelete.push(`${path.posix.basename(ussdir2)}/${ussname2}`);
        ussname2 = `${ussdir2}/${ussname2}`;
        Imperative.console.info("Using ussfile:" + ussname2);

        // using unique DS function to generate unique USS file name
        ussname3 = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
        filesToDelete.push(`${path.posix.basename(ussdir2)}/${ussname3}`);
        ussname3 = `${ussdir2}/${ussname3}`;
        Imperative.console.info("Using ussfile:" + ussname3);

        await Create.uss(REAL_SESSION, ussdir1, "directory", "RWXRWXRWX");
        await Create.uss(REAL_SESSION, ussdir2, "directory", "RWXRWXRWX");
        await Upload.bufferToUssFile(REAL_SESSION, ussname1, Buffer.from(data));
        await Upload.bufferToUssFile(REAL_SESSION, ussname2, Buffer.from(data));
        await Upload.bufferToUssFile(REAL_SESSION, ussname3, Buffer.from(data));
    });

    afterAll(async () => {
        await Delete.ussFile(REAL_SESSION, ussdir1, true);
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    beforeEach(() => {
        expectedData = data;
    });

    describe("without profiles", () => {
        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_download_uss_directory_without_profile"
            });
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        afterEach(async () => {
            for (let file of filesToDelete) {
                file = path.join(TEST_ENVIRONMENT_NO_PROF.workingDir, file);
                expect(fs.readFileSync(file).toString()).toEqual(expectedData);
                fs.unlinkSync(file);
            }
            for (const dir of dirsToDelete) {
                fs.rmdirSync(path.join(TEST_ENVIRONMENT_NO_PROF.workingDir, dir));
            }
        });

        it("should download a uss directory", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory_fully_qualified.sh"
            );

            const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSystem.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] =
                    defaultSystem.zosmf.basePath;
            }

            const response = runCliScript(
                shellScript,
                TEST_ENVIRONMENT_NO_PROF,
                [
                    ussdir1,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                ]
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain(
                "4 file(s) downloaded successfully"
            );
            expect(response.status).toBe(0);
        });
    });

    describe("Success scenarios", () => {
        afterEach(async () => {
            for (let file of filesToDelete) {
                file = path.join(TEST_ENVIRONMENT.workingDir, file);
                expect(fs.readFileSync(file).toString()).toEqual(expectedData);
                fs.unlinkSync(file);
            }
            for (const dir of dirsToDelete) {
                fs.rmdirSync(path.join(TEST_ENVIRONMENT.workingDir, dir));
            }
            expectedData = data;
        });

        it("should download a uss directory", () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("4 file(s) downloaded successfully to");
        });

        it("should download a uss directory with response timeout", () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_uss_directory.sh");
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("4 file(s) downloaded successfully to");
        });

        it("should download uss directory  with response-format-json flag", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("4 file(s) downloaded successfully to");
            expect(response.status).toBe(0);
        });
    });

    describe("Options", () => {
        let localFilesToDelete: string[];
        let localDirsToDelete: string[];
        let ussname4real: string;

        beforeAll(async () => {
            // using unique DS function to generate unique USS file name
            ussname4 = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.DOWNLOAD`);
            ussname4real = `${path.posix.basename(ussdir2)}/${ussname4}`;
            ussname4 = `${ussdir2}/${ussname4}`;
            Imperative.console.info("Using ussfile:" + ussname4);
        });

        beforeEach(async () => {
            localDirsToDelete = [];
            localFilesToDelete = [];
        });

        afterEach(async () => {
            for (let file of localFilesToDelete) {
                file = path.join(TEST_ENVIRONMENT.workingDir, file);
                expect(fs.readFileSync(file).toString()).toEqual(expectedData);
                fs.unlinkSync(file);
            }
            for (const dir of localDirsToDelete) {
                fs.rmdirSync(path.join(TEST_ENVIRONMENT.workingDir, dir));
            }
            expectedData = data;
        });

        /**
         * Omitted options:
         * Group - we cannot know the group numbers or names of created files
         * Owner - we are running as the user, so we cannot filter based on this in testing
         * Symlinks - already covered in API testing and requires a ZFS and SSH to test
         * Filesys - same reasons as symlinks
         * Fail Fast - would require an induced error
         */

        it("should download the files in binary mode", async () => {
            localFilesToDelete = [...filesToDelete];
            localDirsToDelete = [...dirsToDelete];
            expectedData = "��������������������������";
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--binary`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("4 file(s) downloaded successfully to");
            expect(response.status).toBe(0);
        });

        it("should download a uss directory to a specified directory", async () => {
            for (const dir of dirsToDelete) {
                localDirsToDelete.push(path.join("test", dir));
            }
            for (const file of filesToDelete) {
                localFilesToDelete.push(path.join("test", file));
            }
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--directory ./test`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("4 file(s) downloaded successfully to ./test");
            expect(response.status).toBe(0);
        });

        it("should download uss directory but only download the first 3 files", async () => {
            localDirsToDelete = [dirsToDelete[0]];
            localFilesToDelete = [filesToDelete[1], filesToDelete[2]];
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--max 3`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("3 file(s) downloaded successfully");
            expect(response.status).toBe(0);
        });

        it("should download uss directory with files only, but the directory should be automatically created", async () => {
            localDirsToDelete = [dirsToDelete[0]];
            localFilesToDelete = [filesToDelete[0], filesToDelete[1], filesToDelete[2]];
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--type f`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("3 file(s) downloaded successfully");
            expect(response.status).toBe(0);
        });

        it("should download uss directory with directories only", async () => {
            localDirsToDelete = [dirsToDelete[0]];
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--type d`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("1 file(s) downloaded successfully"); // Only one subdirectory
            expect(response.status).toBe(0);
        });

        it("should download uss directory with the size option", async () => {
            localDirsToDelete = [dirsToDelete[0]];
            localFilesToDelete = [ussname4real];
            await Upload.bufferToUssFile(REAL_SESSION, ussname4, Buffer.from(data.repeat(100)));
            expectedData = data.repeat(100);
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--size +1K`, "--rfj"]);
            await Delete.ussFile(REAL_SESSION, ussname4, true);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("2 file(s) downloaded successfully"); //File and containing dir
            expect(response.status).toBe(0);
        });

        it("should download uss directory with the perm option", async () => {
            localDirsToDelete = [dirsToDelete[0]];
            localFilesToDelete = [ussname4real];
            await Create.uss(REAL_SESSION, ussname4, "file", "RWXR-XR-X");
            await Upload.bufferToUssFile(REAL_SESSION, ussname4, Buffer.from(data));
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--perm 755`, "--rfj"]);
            await Delete.ussFile(REAL_SESSION, ussname4, true);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("2 file(s) downloaded successfully"); // One file, one directory
            expect(response.status).toBe(0);
        });

        it("should download uss directory with the name option", async () => {
            localDirsToDelete = [dirsToDelete[0]];
            localFilesToDelete = [ussname4real];
            await Upload.bufferToUssFile(REAL_SESSION, ussname4, Buffer.from(data));
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--name ${ussname4real}`, "--rfj"]);
            await Delete.ussFile(REAL_SESSION, ussname4, true);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("1 file(s) downloaded successfully"); // Only one file with that name
            expect(response.status).toBe(0);
        });

        it("should download uss directory with a depth of 1", async () => {
            localDirsToDelete = [dirsToDelete[0]];
            localFilesToDelete = [filesToDelete[0]];
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--depth 1`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("2 file(s) downloaded successfully"); // One file, one directory
            expect(response.status).toBe(0);
        });

        it("should download uss directory with multiple concurrent requests", async () => {
            localFilesToDelete = [...filesToDelete];
            localDirsToDelete = [...dirsToDelete];
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--mcr 4`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("4 file(s) downloaded successfully");
            expect(response.status).toBe(0);
        });

        it("should download uss directory based on file modification time 1", async () => {
            localFilesToDelete = [...filesToDelete];
            localDirsToDelete = [...dirsToDelete];
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--mtime 0`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("4 file(s) downloaded successfully");
            expect(response.status).toBe(0);
        });

        it("should download uss directory based on file modification time 2", async () => {
            localFilesToDelete = [];
            localDirsToDelete = [];
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [ussdir1, `--mtime 1`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });
    });

    describe("Expected failures", () => {
        it("should fail due to specified uss file name does not exist", async () => {
            const shellScript = path.join(
                __dirname,
                "__scripts__",
                "command",
                "command_download_uss_directory.sh"
            );
            const response = runCliScript(shellScript, TEST_ENVIRONMENT, [
                ussdir1 + ".dummy"
            ]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Path name not found");
        });
    });
});
