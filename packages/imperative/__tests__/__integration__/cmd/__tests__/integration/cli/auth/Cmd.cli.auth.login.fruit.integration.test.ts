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

const fakeCertPath = "./fakeCert.cert";
const fakeCertKeyPath = "./fakeKey.key";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
describe("imperative-test-cli auth login", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_auth_login"
        });
    });

    it("should load values from base profile and store token in it with alias", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_li_config_password.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the command should include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("user:     fakeUser");
        expect(response.stdout.toString()).toContain("password: fakePass");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
        expect(response.status).toBe(0);
    });

    it("should load values from base profile and store token in it - basic auth", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_config_password.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the command should include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("user:     fakeUser");
        expect(response.stdout.toString()).toContain("password: fakePass");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
        expect(response.status).toBe(0);
    });

    it("should load values from base profile and store token in it - certificate auth", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_config_cert.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the command should include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("certFile:    " + fakeCertPath);
        expect(response.stdout.toString()).toContain("certKeyFile: " + fakeCertKeyPath);
        expect(response.stdout.toString()).toContain("tokenType:   jwtToken");
        expect(response.status).toBe(0);
    });

    it("should load values from base profile and show token only - basic auth", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_config_password_show_token.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the command should not include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Received a token of type = jwtToken");
        expect(response.stdout.toString()).toContain("The following token was retrieved and will not be stored in your profile:");
        expect(response.stdout.toString()).toContain("fakeUser:fakePass@fakeToken");
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
        expect(response.status).toBe(0);
    });

    it("should load values from base profile and show token only - certificate auth", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_config_cert_show_token.sh",
            TEST_ENVIRONMENT.workingDir);

        // the output of the command should not include token value
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Received a token of type = jwtToken");
        expect(response.stdout.toString()).toContain("The following token was retrieved and will not be stored in your profile:");
        expect(response.stdout.toString()).toContain("fakeCertificate@fakeToken");
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
        expect(response.status).toBe(0);
    });

    it("should load values from base profile and show token in rfj - basic auth", () => {
        // the output of the command should include token value
        let response = runCliScript(__dirname + "/__scripts__/auth_login_config_password_show_token_rfj.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(JSON.parse(response.stdout.toString()).data).toMatchObject({tokenType: "jwtToken", tokenValue: "fakeUser:fakePass@fakeToken"});
        expect(response.status).toBe(0);

        // the output of the command should not include token value
        response = runCliScript(__dirname + "/__scripts__/show_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
        expect(response.status).toBe(0);
    });

    it("should load values from base profile and show token in rfj - certificate auth", () => {
        // the output of the command should include token value
        let response = runCliScript(__dirname + "/__scripts__/auth_login_config_cert_show_token_rfj.sh",
            TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(JSON.parse(response.stdout.toString()).data).toMatchObject({tokenType: "jwtToken", tokenValue: "fakeCertificate@fakeToken"});
        expect(response.status).toBe(0);

        // the output of the command should not include token value
        response = runCliScript(__dirname + "/__scripts__/show_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
        expect(response.status).toBe(0);
    });

    it("should store token from cmd line user & password - y", () => {
        let response = runCliScript(__dirname + "/__scripts__/auth_login_cmd_line_password.sh",
            TEST_ENVIRONMENT.workingDir, ["y", "fakeUser", "fakePass"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain(
            "The authentication token is stored in the 'baseProfName' base profile for future use");
        expect(response.status).toBe(0);

        response = runCliScript(__dirname + "/__scripts__/show_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("host:       fakeHost");
        expect(response.stdout.toString()).toContain("port:       3000");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
        expect(response.stdout.toString()).not.toContain("user:");
        expect(response.stdout.toString()).not.toContain("password:");
        expect(response.status).toBe(0);
    });

    it("should store token from cmd line user & password - yes", () => {
        let response = runCliScript(__dirname + "/__scripts__/auth_login_cmd_line_password.sh",
            TEST_ENVIRONMENT.workingDir, ["yes", "fakeUser", "fakePass"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain(
            "The authentication token is stored in the 'baseProfName' base profile for future use");
        expect(response.status).toBe(0);

        response = runCliScript(__dirname + "/__scripts__/show_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("host:       fakeHost");
        expect(response.stdout.toString()).toContain("port:       3000");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
        expect(response.stdout.toString()).not.toContain("user:");
        expect(response.stdout.toString()).not.toContain("password:");
        expect(response.status).toBe(0);
    });

    it("should store token from cmd line certificate", () => {
        let response = runCliScript(__dirname + "/__scripts__/auth_login_cmd_line_cert.sh",
            TEST_ENVIRONMENT.workingDir, ["y", fakeCertPath, fakeCertKeyPath]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain(
            "The authentication token is stored in the 'baseProfName' base profile for future use");
        expect(response.status).toBe(0);

        response = runCliScript(__dirname + "/__scripts__/show_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("host:       fakeHost");
        expect(response.stdout.toString()).toContain("port:       3000");
        expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
        expect(response.stdout.toString()).toContain("secure");
        expect(response.stdout.toString()).toContain("tokenValue");
        expect(response.stdout.toString()).not.toContain("user:");
        expect(response.stdout.toString()).not.toContain("password:");
        expect(response.stdout.toString()).not.toContain("certFile:");
        expect(response.stdout.toString()).not.toContain("certKeyFile:");
        expect(response.status).toBe(0);
    });

    it("should NOT store token from user & password, if requested", () => {
        let response = runCliScript(__dirname + "/__scripts__/auth_login_cmd_line_password.sh",
            TEST_ENVIRONMENT.workingDir, ["n", "fakeUser", "fakePass"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain("will not be stored in your profile");
        expect(response.stdout.toString()).toContain("fakeUser:fakePass@fakeToken");
        expect(response.status).toBe(0);

        response = runCliScript(__dirname + "/__scripts__/show_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).not.toContain("user:");
        expect(response.stdout.toString()).not.toContain("password:");
        expect(response.stdout.toString()).not.toContain("host:");
        expect(response.stdout.toString()).not.toContain("port:");
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
        expect(response.status).toBe(0);
    });

    it("should NOT store token from cert, if requested", () => {
        let response = runCliScript(__dirname + "/__scripts__/auth_login_cmd_line_cert.sh",
            TEST_ENVIRONMENT.workingDir, ["n", fakeCertPath, fakeCertKeyPath]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain("will not be stored in your profile");
        expect(response.stdout.toString()).toContain("fakeCertificate@fakeToken");
        expect(response.status).toBe(0);

        response = runCliScript(__dirname + "/__scripts__/show_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).not.toContain("user:");
        expect(response.stdout.toString()).not.toContain("password:");
        expect(response.stdout.toString()).not.toContain("host:");
        expect(response.stdout.toString()).not.toContain("port:");
        expect(response.stdout.toString()).not.toContain("tokenType:");
        expect(response.stdout.toString()).not.toContain("tokenValue:");
        expect(response.stdout.toString()).not.toContain("certFile:");
        expect(response.stdout.toString()).not.toContain("certKeyFile:");
        expect(response.status).toBe(0);
    });
});
