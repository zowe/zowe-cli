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

import { ITestEnvironment } from "../../../../../../../packages/core/__tests__/__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../packages/core/__tests__/__resources__/__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../packages/core/__tests__/__resources__/src/TestUtil";


let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli invalid no-handler", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_invoke"
        });
    });

    it("should fail the command with a message if the command definition of type command omits a handler", () => {
        const response = runCliScript(__dirname + "/__scripts__/no-handler.sh", TEST_ENVIRONMENT.workingDir);

        expect(response.stderr.toString()).toMatchSnapshot();
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
