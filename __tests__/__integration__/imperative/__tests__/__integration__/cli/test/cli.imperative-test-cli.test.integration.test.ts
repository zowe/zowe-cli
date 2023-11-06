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

import { runCliScript } from "../../../../../../__resources__/src/TestUtil";
import { ITestEnvironment } from "../../../../../../__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__resources__/__src__/environment/SetupTestEnvironment";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli test command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_command"
        });
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/test_help.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
