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

import { IConfigSecureProperties } from "../../../../../../../packages/config/src/doc/IConfigSecure";
import { runCliScript } from "../../../../../../src/TestUtil";
import { ITestEnvironment } from "../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__src__/environment/SetupTestEnvironment";
import * as fs from "fs";
import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
describe("imperative-test-cli auth login", () => {
    async function loadSecureProp(profileName: string): Promise<string> {
        const credSvc = "imperative-test-cli";
        const credAcct = "secure_config_props";

        const securedValue = await keytar.getPassword(credSvc, credAcct);
        if (securedValue == null) {
            return `${credSvc}/${credAcct} does not exist in cred store`;
        }

        const securedValueJson: IConfigSecureProperties = JSON.parse(
            Buffer.from(securedValue, "base64").toString()
        );
        if (securedValueJson == null) {
            return `Value of ${credSvc}/${credAcct} parsed to JSON gives null`;
        }

        const secValArray = Object.values(securedValueJson);
        if (secValArray.length < 1) {
            return `${credSvc}/${credAcct} contained no secure values`;
        }

        const tokenValue = secValArray[0][`profiles.${profileName}.properties.tokenValue`];
        if (tokenValue == null) {
            return `${credSvc}/${credAcct} contains no token value`;
        }

        return tokenValue;
    }

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_auth_login"
        });
    });

    describe("single profile", () => {

        beforeAll(() => { fs.mkdirSync(TEST_ENVIRONMENT.workingDir + "/testDir"); });

        afterEach(async () => {
            runCliScript(__dirname + "/__scripts__/delete.sh", TEST_ENVIRONMENT.workingDir + "/testDir",
                ["imperative-test-cli.config.json imperative-test-cli.config.user.json imperative-test-cli.schema.json"]);
            // runCliScript(__dirname + "/__scripts__/delete.sh", join(os.homedir(), ".imperative-test-cli"),
            runCliScript(__dirname + "/__scripts__/delete.sh", TEST_ENVIRONMENT.workingDir,
                ["imperative-test-cli.config.json imperative-test-cli.config.user.json imperative-test-cli.schema.json"]);
            await keytar.deletePassword("imperative-test-cli", "secure_config_props");
        });

        it("should load values from base profile and store token in it 1", async () => {
            const response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_config_local.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["fakeUser", "fakePass"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            // the output of the command should include token value
            expect(response.stdout.toString()).toContain("user:     fakeUser");
            expect(response.stdout.toString()).toContain("password: fakePass");
            expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
            expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
            expect(await loadSecureProp("base_fruit")).toBe("fakeUser:fakePass@fakeToken");
        });

        it("should load values from base profile and store token in it 2", async () => {
            const response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_config_global.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["fakeUser", "fakePass"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            // the output of the command should include token value
            expect(response.stdout.toString()).toContain("user:     fakeUser");
            expect(response.stdout.toString()).toContain("password: fakePass");
            expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
            expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
            expect(await loadSecureProp("base_fruit")).toBe("fakeUser:fakePass@fakeToken");
        });

        it("should load values from base profile and store token in it 3", async () => {
            const response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_config_local_user.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["fakeUser", "fakePass"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            // the output of the command should include token value
            expect(response.stdout.toString()).toContain("user:     fakeUser");
            expect(response.stdout.toString()).toContain("password: fakePass");
            expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
            expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
            expect(await loadSecureProp("base_fruit")).toBe("fakeUser:fakePass@fakeToken");
        });

        it("should load values from base profile and store token in it 4", async () => {
            const response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_config_global_user.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["fakeUser", "fakePass"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            // the output of the command should include token value
            expect(response.stdout.toString()).toContain("user:     fakeUser");
            expect(response.stdout.toString()).toContain("password: fakePass");
            expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
            expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
            expect(await loadSecureProp("base_fruit")).toBe("fakeUser:fakePass@fakeToken");
        });

        it("should load values from base profile and show token only", () => {
            let response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_show_token_config.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["fakeUser", "fakePass"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            // the output of the command should include token value
            expect(response.stdout.toString()).toContain("fakeUser:fakePass@fakeToken");

            response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_show_config.sh", TEST_ENVIRONMENT.workingDir + "/testDir");

            // the output of the command should not include token value
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).not.toContain("tokenType:");
            expect(response.stdout.toString()).not.toContain("tokenValue:");
        });

        it("should load values from base profile and show token in rfj", () => {
            let response = runCliScript(__dirname + "/__scripts__/base_config_create.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["fakeUser", "fakePass"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);

            // the output of the command should include token value
            response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_show_token_rfj_config.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir");
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(JSON.parse(response.stdout.toString()).data).toMatchObject({tokenType: "jwtToken", tokenValue: "fakeUser:fakePass@fakeToken"});

            // the output of the command should not include token value
            response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_show_config.sh", TEST_ENVIRONMENT.workingDir + "/testDir");
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).not.toContain("tokenType:");
            expect(response.stdout.toString()).not.toContain("tokenValue:");
        });

        it("should create a profile, if requested 1", async () => {
            let response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_create_config.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["y", "fakeUser", "fakePass"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Login successful.");
            expect(response.stdout.toString()).toContain("The authentication token is stored in the 'base' base profile");

            response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_show_config.sh", TEST_ENVIRONMENT.workingDir + "/testDir");

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("host:       fakeHost");
            expect(response.stdout.toString()).toContain("port:       3000");
            expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
            expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
            expect(await loadSecureProp("base")).toBe("fakeUser:fakePass@fakeToken");
            expect(response.stdout.toString()).not.toContain("user:");
            expect(response.stdout.toString()).not.toContain("password:");
        });

        it("should create a profile, if requested 2", async () => {
            let response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_create_config.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["yes", "fakeUser", "fakePass"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Login successful.");
            expect(response.stdout.toString()).toContain("The authentication token is stored in the 'base' base profile");

            response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_show_config.sh", TEST_ENVIRONMENT.workingDir + "/testDir");

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("host:       fakeHost");
            expect(response.stdout.toString()).toContain("port:       3000");
            expect(response.stdout.toString()).toContain("tokenType:  jwtToken");
            expect(response.stdout.toString()).toContain("tokenValue: (secure value)");
            expect(await loadSecureProp("base")).toBe("fakeUser:fakePass@fakeToken");
            expect(response.stdout.toString()).not.toContain("user:");
            expect(response.stdout.toString()).not.toContain("password:");
        });

        it("should not create a profile, if requested", () => {
            let response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_create_config.sh",
                TEST_ENVIRONMENT.workingDir + "/testDir", ["n", "fakeUser", "fakePass"]);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Login successful.");
            expect(response.stdout.toString()).toContain("will not be stored in your profile");
            expect(response.stdout.toString()).toContain("fakeUser:fakePass@fakeToken");

            response = runCliScript(__dirname + "/__scripts__/base_profile_and_auth_login_show_config.sh", TEST_ENVIRONMENT.workingDir + "/testDir");

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).not.toContain("user:");
            expect(response.stdout.toString()).not.toContain("password:");
            expect(response.stdout.toString()).not.toContain("host:");
            expect(response.stdout.toString()).not.toContain("port:");
            expect(response.stdout.toString()).not.toContain("tokenType:");
            expect(response.stdout.toString()).not.toContain("tokenValue:");
        });
    });
});
