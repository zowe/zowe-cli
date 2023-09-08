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

describe("cmd-cli respond with-syntax-errors", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_root_respond_with_syntax_errors"
        });
    });

    it("should produce a bunch of syntax errors", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-syntax-errors/with_errors.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.stdout.toString()).toBe("");
        expect(response.status).toBe(1);
        expect(response.stderr.toString()).toMatchSnapshot();
    });
});
