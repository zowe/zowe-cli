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

import { ITestEnvironment } from "../../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../src/TestUtil";


// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config profiles", () => {
    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_profiles_command"
        });
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--user-config --prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--global-config --prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir,
            ["--user-config --global-config --prompt false"]);
    });
    it("should display the help", () => {
        const response = runCliScript(__dirname + "/../__scripts__/get_help.sh",
            TEST_ENVIRONMENT.workingDir, ["profiles"]);
        expect(response.stdout.toString()).toContain(`Displays profile paths.`);
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should list profiles", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_profiles.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("secured");
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
});
