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

import { runCliScript } from "../../../../../../../packages/core/__tests__/__resources__/src/TestUtil";
import { ITestEnvironment } from "../../../../../../../packages/core/__tests__/__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../packages/core/__tests__/__resources__/__src__/environment/SetupTestEnvironment";
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli nested first-group", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_root_nested_first_group"
        });
    });

    it("should display both groups and commands in the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/first-group/first_group_help.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(0);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
