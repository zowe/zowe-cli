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

import { runCliScript } from "../../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("Create z/OS File System", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_create_zos_file_system",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/create_zfs_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail creating a ZFS due to missing data set name", () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_create_zfs.sh",
            TEST_ENVIRONMENT, []);
        expect(response.stderr.toString()).toContain("Missing Positional Argument");
        expect(response.stderr.toString()).toContain("fileSystemName");
    });

    it("should fail creating a ZFS due to invalid number of primary cylinders", () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_create_zfs_cylspri.sh",
            TEST_ENVIRONMENT, ["TEST.ZFS", "true"]);
        expect(response.stderr.toString()).toContain("The value must be a number");
        expect(response.stderr.toString()).toContain("cyls-pri");
    });

});
