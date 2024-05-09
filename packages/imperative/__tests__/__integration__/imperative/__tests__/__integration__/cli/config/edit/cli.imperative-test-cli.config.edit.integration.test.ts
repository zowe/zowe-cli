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

import * as fs from "fs";
import * as path from "path";
import { ITestEnvironment } from "../../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../src/TestUtil";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config convert-profiles", () => {
    let configJsonPath: string;

    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_convert_profiles_command"
        });
        configJsonPath = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.json");
    });

    beforeEach(() => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--prompt false"]);
    });

    afterEach(() => {
        if (fs.existsSync(configJsonPath)) {
            fs.unlinkSync(configJsonPath);
        }
    });

    describe("success scenarios", () => {
        it("should display the help", () => {
            const response = runCliScript(__dirname + "/../__scripts__/get_help.sh", TEST_ENVIRONMENT.workingDir, ["edit"]);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Edit an existing config file in your system's default text editor.");
            expect(response.stderr.toString()).toEqual("");
        });

        it("should open config file in editor specified by environment variable", async () => {
            const response = runCliScript(__dirname + "/__scripts__/edit_config.sh", path.join(TEST_ENVIRONMENT.workingDir, "test"), [], {
                // Use "cat" in place of editor to print out the config file
                IMPERATIVE_TEST_CLI_EDITOR: "cat",
                // Pretend to have SSH connection so isGuiAvailable returns false
                SSH_CONNECTION: "fake"
            });
            const expectedConfig = fs.readFileSync(configJsonPath, "utf-8");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toEqual(expectedConfig);
            expect(response.stderr.toString()).toEqual("");
        });
    });

    describe("failure scenarios", () => {
        it("should not open config file that does not exist", async () => {
            const response = runCliScript(__dirname + "/__scripts__/edit_config.sh", TEST_ENVIRONMENT.workingDir);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("File does not exist");
            expect(response.stdout.toString()).toContain("To create it, run \"imperative-test-cli config init\"");
            expect(response.stderr.toString()).toEqual("");
        });
    });
});
