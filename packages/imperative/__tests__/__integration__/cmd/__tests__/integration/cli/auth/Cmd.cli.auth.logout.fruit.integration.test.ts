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

import { runCliScript } from "../../../../../../src/TestUtil";
import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import { join } from "path";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
describe("imperative-test-cli auth logout", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_auth_logout"
        });
    });

    it("should have auth lo command that loads values from base profile and removes the token", () => {
        let response = runCliScript(__dirname + "/__scripts__/auth_li_config_password.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the login command should include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
        expect(response.status).toBe(0);

        response = runCliScript(__dirname + "/__scripts__/auth_lo.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the command should NOT include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Logout successful. The authentication token has been revoked");
        expect(response.stdout.toString()).toContain("Token was removed from your 'baseProfName_fruit' base profile");
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
        expect(response.status).toBe(0);
    });

    it("should have auth logout command that loads values from base profile and removes the token", () => {
        let response = runCliScript(__dirname + "/__scripts__/auth_login_config_password.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the login command should include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
        expect(response.status).toBe(0);

        response = runCliScript(__dirname + "/__scripts__/auth_logout.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the command should NOT include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Logout successful. The authentication token has been revoked");
        expect(response.stdout.toString()).toContain("Token was removed from your 'baseProfName_fruit' base profile");
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
        expect(response.status).toBe(0);
    });

    it("should have auth logout command that invalidates another token", () => {
        let response = runCliScript(__dirname + "/__scripts__/auth_login_config_password.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the login command should include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
        expect(response.status).toBe(0);


        response = runCliScript(__dirname + "/__scripts__/auth_logout_specify_token.sh",
            TEST_ENVIRONMENT.workingDir, ["fakeToken:fakeToken@fakeToken"]);

        // the output of the command should still include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Logout successful. The authentication token has been revoked");
        expect(response.stdout.toString()).toContain("Token was not removed from your 'baseProfName_fruit' base profile");
        expect(response.stdout.toString()).toContain("Reason: Token value does not match the securely stored value");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
        expect(response.status).toBe(0);
    });
});
