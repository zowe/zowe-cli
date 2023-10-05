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

describe("cmd-cli invoke exit 143", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_cli_invoke_exit_143"
        });
    });

    it("should allow a handler to set an exit code and throw an error", async () => {
        const ONE_FOUR_THREE = 143;
        const response = runCliScript(__dirname + "/__scripts__/exit/exit_143.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.status).toBe(ONE_FOUR_THREE);
        expect(response.stderr.toString()).toMatchSnapshot();
    });
});
