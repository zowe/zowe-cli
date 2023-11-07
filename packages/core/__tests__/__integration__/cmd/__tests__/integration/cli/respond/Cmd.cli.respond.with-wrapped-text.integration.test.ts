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

import { ITestEnvironment } from "../../../../../../__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__resources__/__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../__resources__/src/TestUtil";


let TEST_ENVIRONMENT: ITestEnvironment;

describe("cmd-cli respond with-wrapped-text", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_root_respond_with_wrapped_text"
        });
    });

    it("should produce both wrapped and non-wrapped text", async () => {
        const response = runCliScript(__dirname + "/__scripts__/with-wrapped-text/with_wrapped.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
