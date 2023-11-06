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
describe("cmd-cli profiles create insecure", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_profiles_create_insecure"
        });
    });

    it("should create a profile with a field marked as secure in plain text if the cli does not mark keytar as a dependency", () => {
        const response = runCliScript(__dirname + "/__scripts__/profiles/create_insecure_profile.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toContain("command 'profiles create' is deprecated");
        expect(response.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(response.stdout.toString()).toContain("not so secret info");
        expect(response.stdout.toString()).not.toContain("managed by");
        expect(response.status).toBe(0);
    });
});
