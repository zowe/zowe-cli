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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("Delete z/OS File System", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_delete_zos_file_system",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });
    it("should display delete zfs help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/delete_zfs_help.sh",
            TEST_ENVIRONMENT);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should fail deleting a ZFS due to missing file system name", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_zfs.sh",
            TEST_ENVIRONMENT, [""]);
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("fileSystemName");
        expect(response.stderr.toString()).toContain("Missing Positional");
    });

    it("should fail deleting a ZFS without specifying --for-sure", async () => {
        const response = runCliScript(__dirname + "/__scripts__/command/command_delete_zfs.sh",
            TEST_ENVIRONMENT, ["fs.name"]);

        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toContain("--for-sure");
        expect(response.stderr.toString()).toContain("Missing Required Option");
    });

});
