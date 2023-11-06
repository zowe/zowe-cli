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

import { Session } from "@zowe/core-for-zowe-sdk";
import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Delete } from "@zowe/zos-files-for-zowe-sdk";

const ZOWE_OPT_BASE_PATH = "ZOWE_OPT_BASE_PATH";

let REAL_SESSION: Session;
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let fileName: string;
let dsnameSuffix: string;
let user: string;
let basePath: string;

describe("Create USS dir", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_uss_dir"
        });

        defaultSystem = TEST_ENVIRONMENT.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        basePath = defaultSystem.unix.testdir; // `${defaultSystem.zosmf.basePath.trim()}`;
        user = defaultSystem.zosmf.user.trim().toUpperCase();
        fileName = `${basePath}/testDir`;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("Success scenarios", () => {

        beforeEach(() => {
            dsnameSuffix = "";  // reset
        });

        afterEach(async () => {
            // use DELETE APIs
            const response = await Delete.ussFile(REAL_SESSION, fileName);
        });

        it("should create a USS dir", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_dir.sh",
                TEST_ENVIRONMENT, [basePath]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
        it("should create a USS dir with response timeout", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_dir.sh",
                TEST_ENVIRONMENT, [basePath, "--responseTimeout 5"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {
        it("should fail creating uss dir due to missing data set name", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_dir_missing_path_name.sh", TEST_ENVIRONMENT);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Argument");
            expect(response.stderr.toString()).toContain("ussPath");
        });
    });
});
