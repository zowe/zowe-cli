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

import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("Mount File System", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_mount_file_system",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/mount_fs_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail mounting a FS due to missing file system name and mount point", () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_mount_fs.sh",
            TEST_ENVIRONMENT, ["", ""]);
        expect(response.stderr.toString()).toContain("Missing Positional Argument");
        expect(response.stderr.toString()).toContain("fileSystemName");
        expect(response.stderr.toString()).toContain("mountPoint");
    });

    it("should fail mounting a FS due to missing file system name", () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_mount_fs.sh",
            TEST_ENVIRONMENT, ["","/u/ibmuser/mount"]);
        expect(response.stderr.toString()).toContain("Missing Positional Argument");
        expect(response.stderr.toString()).toContain("fileSystemName");
    });

    it("should fail mounting a FS due to missing mount point", () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_mount_fs.sh",
            TEST_ENVIRONMENT, ["TEST.ZFS", ""]);
        expect(response.stderr.toString()).toContain("Missing Positional Argument");
        expect(response.stderr.toString()).toContain("mountPoint");
    });

});
