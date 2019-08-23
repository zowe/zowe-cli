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
import { getUniqueDatasetName, runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Delete } from "../../../../../src/api/methods/delete";

const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let volume: string;

describe("Mount and unmount file system", () => {
    let fsname: string;
    let mountPoint: string;

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_mount_unmount_file_system"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
        volume = defaultSystem.datasets.vol;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);
        fsname = getUniqueDatasetName(defaultSystem.zosmf.user);

        const dirname = getUniqueDatasetName(defaultSystem.zosmf.user).split(".")[1];
        mountPoint = "//tmp/" + dirname;
        const sshCommand = "mkdir " + mountPoint;

        const response = runCliScript(__dirname + "/__scripts__/command/command_setup.sh",
            TEST_ENVIRONMENT, [sshCommand, fsname,
                defaultSystem.ssh.host,
                defaultSystem.ssh.port,
                defaultSystem.ssh.user,
                defaultSystem.ssh.password]);
    });

    afterAll(async () => {
        const sshCommand = "rmdir " + mountPoint;
        const response = runCliScript(__dirname + "/__scripts__/command/command_teardown.sh",
            TEST_ENVIRONMENT, [sshCommand, fsname,
                defaultSystem.ssh.host,
                defaultSystem.ssh.port,
                defaultSystem.ssh.user,
                defaultSystem.ssh.password]);

        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("without profiles", () => {
        let defaultSys: ITestPropertiesSchema;

        // Create the unique test environment
        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_files_mount_unmount_file_system_without_profile"
            });

            defaultSys = TEST_ENVIRONMENT_NO_PROF.systemTestProperties;
        });

        afterEach(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should mount and unmount a file system", () => {
            // if API Mediation layer is being used (basePath has a value) then
            // set an ENVIRONMENT variable to be used by zowe.
            if (defaultSys.zosmf.basePath != null) {
                TEST_ENVIRONMENT_NO_PROF.env[ZOWE_OPT_BASE_PATH] = defaultSys.zosmf.basePath;
            }

            let response = runCliScript(__dirname + "/__scripts__/command/command_mount_fs_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [fsname, mountPoint,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            response = runCliScript(__dirname + "/__scripts__/command/command_list_fs_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [fsname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(mountPoint.slice(1));

            response = runCliScript(__dirname + "/__scripts__/command/command_unmount_fs_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [fsname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            response = runCliScript(__dirname + "/__scripts__/command/command_list_fs_fully_qualified.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [fsname,
                    defaultSys.zosmf.host,
                    defaultSys.zosmf.port,
                    defaultSys.zosmf.user,
                    defaultSys.zosmf.pass]);
            expect(response.stderr.toString()).toBeTruthy();
            expect(response.status).toBe(1);
        });
    });

    describe("With profiles", () => {
        it("should mount and unmount a file system", () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_mount_fs.sh",
                TEST_ENVIRONMENT, [fsname, mountPoint]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            response = runCliScript(__dirname + "/__scripts__/command/command_list_fs.sh",
                TEST_ENVIRONMENT, [fsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain(mountPoint.slice(1));

            response = runCliScript(__dirname + "/__scripts__/command/command_unmount_fs.sh",
                TEST_ENVIRONMENT, [fsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            response = runCliScript(__dirname + "/__scripts__/command/command_list_fs.sh",
                TEST_ENVIRONMENT, [fsname]);
            expect(response.stderr.toString()).toBeTruthy();
            expect(response.status).toBe(1);
        });
    });
});
