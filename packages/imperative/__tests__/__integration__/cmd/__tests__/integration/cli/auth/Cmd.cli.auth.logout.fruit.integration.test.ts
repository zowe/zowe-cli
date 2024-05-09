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
describe("cmd-cli auth logout", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_auth_logout"
        });
    });

    afterEach(() => {
        // delete profiles between tests so that they can be recreated
        require("rimraf").sync(join(TEST_ENVIRONMENT.workingDir, "profiles"));
    });

    it("should have auth logout command that loads values from base profile and removes the token with alias", () => {
        let response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_li.sh",
            TEST_ENVIRONMENT.workingDir, ["fakeUser", "fakePass"]);
        expect(response.stderr.toString()).toContain("command 'profiles create' is deprecated");
        expect(response.status).toBe(0);

        // the output of the command should include token value
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: fakeUser:fakePass@fakeToken");

        response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_lo.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(response.status).toBe(0);

        // the output of the command should include token value
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
    });

    it("should have auth logout command that loads values from base profile and removes the token", () => {
        let response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login.sh",
            TEST_ENVIRONMENT.workingDir, ["fakeUser", "fakePass"]);
        expect(response.stderr.toString()).toContain("command 'profiles create' is deprecated");
        expect(response.status).toBe(0);

        // the output of the command should include token value
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: fakeUser:fakePass@fakeToken");

        response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_logout.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(response.status).toBe(0);

        // the output of the command should include token value
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
    });

    it("should have auth logout command that invalidates another token", () => {
        let response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login.sh",
            TEST_ENVIRONMENT.workingDir, ["fakeUser", "fakePass"]);
        expect(response.stderr.toString()).toContain("command 'profiles create' is deprecated");
        expect(response.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(response.status).toBe(0);

        // the output of the command should include token value
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: fakeUser:fakePass@fakeToken");

        response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_logout_specify_token.sh",
            TEST_ENVIRONMENT.workingDir, ["fakeToken:fakeToken@fakeToken"]);
        expect(response.stderr.toString()).toContain("command 'profiles list' is deprecated");
        expect(response.status).toBe(0);

        // the output of the command should include token value
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: fakeUser:fakePass@fakeToken");
    });
});
