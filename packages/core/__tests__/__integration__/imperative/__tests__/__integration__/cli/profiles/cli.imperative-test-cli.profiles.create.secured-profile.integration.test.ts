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

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli profiles create secured-profile", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_create_secured_profile_command"
        });
    });

    it("should allow us to create a secured profile, list the contents and the secured fields should be hidden", () => {
        const secret: string = "supersecretwords";
        const profileName: string = "my_secret";
        const response = runCliScript(__dirname + "/__scripts__/secured-profile/create_and_list.sh", TEST_ENVIRONMENT.workingDir,
            [secret, profileName]);
        expect(response.stderr.toString()).toContain("command 'profiles create' is deprecated");
        expect(response.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).not.toContain(secret);
        expect(response.stdout.toString()).toContain(profileName);
        expect(response.stdout.toString()).toContain("managed by");
    });
});
