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

import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../src/TestUtil";


let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config list", () => {
    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_list_credential_manager_command"
        });
    });

    it("should list the settings options", () => {
        const response = runCliScript(__dirname + "/__scripts__/list.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.stdout.toString().trim()).toBe("CredentialManager");
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
    });
    it("should list with values", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_values.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.stdout.toString().trim()).toBe("CredentialManager = false");
        expect(response.status).toBe(0);
    });
});
