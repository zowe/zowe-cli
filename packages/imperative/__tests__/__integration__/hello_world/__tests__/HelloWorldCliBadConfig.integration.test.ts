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

import { ITestEnvironment } from "../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../__src__/environment/SetupTestEnvironment";
import * as TestUtils from "../../../src/TestUtil";
import * as fs from "fs";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("Hello World", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_test_badConfig",
        });
        fs.copyFileSync(__dirname+"/hello-world-cli.config.json", TEST_ENVIRONMENT.workingDir+"/hello-world-cli.config.json");
    });

    it ("should print version even if bad config", async () => {
        const response = await TestUtils.runCliScript(__dirname + "/scripts/version.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Version");
        expect(response.stderr.toString()).toContain("Please check this configuration file for errors.");
    });

    it ("should print help even if bad config", async () => {
        const response = await TestUtils.runCliScript(__dirname + "/scripts/help.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("help");
        expect(response.stderr.toString()).toContain("Please check this configuration file for errors.");
    });
});
