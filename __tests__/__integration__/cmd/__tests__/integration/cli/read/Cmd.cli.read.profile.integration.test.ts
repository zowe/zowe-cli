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
describe("cmd-cli profiles read profiles", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_read_profiles"
        });
    });

    it("should create a profile with a field marked as secure in plain text (no keytar) and be able to read the contents", () => {
        const response = runCliScript(__dirname + "/__scripts__/profile/create_and_read.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toContain("command 'profiles create' is deprecated");
        expect(response.stdout.toString()).toContain("not so secret info");
        expect(response.stdout.toString()).not.toContain("managed by");
        expect(response.status).toBe(0);
    });
});
