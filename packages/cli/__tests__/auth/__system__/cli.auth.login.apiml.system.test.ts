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

import { ConfigUtils } from "@zowe/imperative";
import { ITestEnvironment, runCliScript, TempTestProfiles } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ITestBaseSchema } from "../../../../../__tests__/__src__/properties/ITestBaseSchema";
import { ITestCertPemSchema } from "../../../../../__tests__/__src__/properties/ITestCertPemSchema";

describe("auth login/logout apiml with profile", () => {
    let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml"
        });
        // Create base profile without user and password
        await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT, "base", {
            host: TEST_ENVIRONMENT.systemTestProperties.base.host,
            port: TEST_ENVIRONMENT.systemTestProperties.base.port,
            rejectUnauthorized: TEST_ENVIRONMENT.systemTestProperties.base.rejectUnauthorized
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should successfully issue the login command", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml.sh", TEST_ENVIRONMENT,
            [TEST_ENVIRONMENT.systemTestProperties.base.user, TEST_ENVIRONMENT.systemTestProperties.base.password]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain("The authentication token is stored");
        expect(response.stdout.toString()).toContain("To revoke this token and remove it from your profile, review the 'zowe auth logout' command.");
    });

    it("should successfully logout with no command line options", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful.");
        expect(response.stdout.toString()).toContain("The authentication token has been revoked");
        expect(response.stdout.toString()).toContain("Token was removed from your"); // ${name} base profile
    });
});

describe("auth login/logout apiml show token", () => {
    let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
    let base: ITestBaseSchema;

    beforeEach(async () => {
        TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml_no_profile"
        });

        base = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.base;
    });

    afterEach(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
    });

    it("should successfully login with password and show token", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_show_token.sh",
            TEST_ENVIRONMENT_NO_PROF,
            [
                base.host,
                base.port,
                base.user,
                base.password,
                base.rejectUnauthorized,
                "true"
            ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Received a token of type = apimlAuthenticationToken");
        expect(response.stdout.toString()).toContain("Login successful. To revoke this token, review the 'zowe auth logout' command.");
    });

    it("should successfully login with password with rfj and show token", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_show_token_rfj.sh",
            TEST_ENVIRONMENT_NO_PROF,
            [
                base.host,
                base.port,
                base.user,
                base.password,
                base.rejectUnauthorized,
                "true"
            ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        const responseData = JSON.parse(response.stdout.toString()).data;
        expect(responseData.tokenType).toEqual("apimlAuthenticationToken");
        expect(responseData.tokenValue).toBeDefined();
        expect(ConfigUtils.hasTokenExpired(responseData.tokenValue)).toBe(false);
        const stdOutTokenMatch = response.stdout.toString().match(/will not be stored in your profile:\\n(.*)\\n\\nLogin successful/);
        expect(responseData.tokenValue).toEqual(stdOutTokenMatch[1]);
    });

    it("should successfully logout with token from password without profiles", () => {
        // first get a token
        let response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_show_token_rfj.sh",
            TEST_ENVIRONMENT_NO_PROF,
            [
                base.host,
                base.port,
                base.user,
                base.password,
                base.rejectUnauthorized,
                "true"
            ]
        );
        const responseData = JSON.parse(response.stdout.toString()).data;

        // now use the token to logout
        response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml_show_token.sh",
            TEST_ENVIRONMENT_NO_PROF,
            [
                base.host,
                base.port,
                "apimlAuthenticationToken",
                responseData.tokenValue,
                base.rejectUnauthorized
            ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful. The authentication token has been revoked");
        expect(response.stdout.toString()).toContain("Token was not removed from your 'base' base profile");
        expect(response.stdout.toString()).toContain("Reason: Empty profile was provided");
    });
});

describe("auth login/logout apiml create profile", () => {
    let TEST_ENVIRONMENT_CREATE_PROF: ITestEnvironment<ITestPropertiesSchema>;
    let base: ITestBaseSchema;

    beforeAll(async () => {
        TEST_ENVIRONMENT_CREATE_PROF = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml_create_profile"
        });

        base = TEST_ENVIRONMENT_CREATE_PROF.systemTestProperties.base;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_CREATE_PROF);
    });

    it("should successfully login with password and create a team config", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_create.sh",
            TEST_ENVIRONMENT_CREATE_PROF,
            [
                base.host,
                base.port,
                base.user,
                base.password,
                base.rejectUnauthorized,
                "y"
            ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain("The authentication token is stored in the"); // ${name} base profile
        expect(response.status).toBe(0);
    });

    it("should successfully logout with a created team config", async () => {
        // Form a posix-style path to scripts directory
        let scriptsPosixPath = __dirname + "/__scripts__";
        scriptsPosixPath = scriptsPosixPath.replaceAll("\\", "/");
        scriptsPosixPath = scriptsPosixPath.replace(/^(.):(.*)/, "/$1$2");

        // create a team config
        let response = runCliScript(__dirname + "/__scripts__/create_team_cfg.sh",
            TEST_ENVIRONMENT_CREATE_PROF,
            [
                base.host,
                base.port,
                base.rejectUnauthorized,
                scriptsPosixPath
            ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // login to create token in SCS
        response = runCliScript(__dirname + "/__scripts__/auth_login_apiml.sh", TEST_ENVIRONMENT_CREATE_PROF,
            [
                TEST_ENVIRONMENT_CREATE_PROF.systemTestProperties.base.user,
                TEST_ENVIRONMENT_CREATE_PROF.systemTestProperties.base.password
            ]
        );
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml.sh", TEST_ENVIRONMENT_CREATE_PROF);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("Logout successful. The authentication token has been revoked");
        expect(response.stdout.toString()).toContain("Token was removed from your 'base' base profile"); // V1 message
        expect(response.status).toBe(0);
    });
});

describe("auth login/logout apiml do not create profile", () => {
    let TEST_ENVIRONMENT_CREATE_PROF: ITestEnvironment<ITestPropertiesSchema>;
    let base: ITestBaseSchema;

    beforeAll(async () => {
        TEST_ENVIRONMENT_CREATE_PROF = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml_do_not_create_profile"
        });

        base = TEST_ENVIRONMENT_CREATE_PROF.systemTestProperties.base;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_CREATE_PROF);
    });

    it("should successfully login with password and not create a profile 1", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_create.sh",
            TEST_ENVIRONMENT_CREATE_PROF,
            [
                base.host,
                base.port,
                base.user,
                base.password,
                base.rejectUnauthorized,
                "n"
            ]);

        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Received a token of type = apimlAuthenticationToken");
        expect(response.stdout.toString()).toContain("The following token was retrieved and will not be stored in your profile");
        expect(response.stdout.toString()).toContain("Login successful.");
    });

    it("should successfully login with password and not create a profile 2", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_create.sh",
            TEST_ENVIRONMENT_CREATE_PROF,
            [
                base.host,
                base.port,
                base.user,
                base.password,
                base.rejectUnauthorized,
                "q"
            ]);

        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Received a token of type = apimlAuthenticationToken");
        expect(response.stdout.toString()).toContain("The following token was retrieved and will not be stored in your profile");
        expect(response.stdout.toString()).toContain("Login successful.");
    });
});

describe("auth login/logout apiml with pem cert", () => {
    let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
    let base: ITestCertPemSchema & ITestBaseSchema;

    beforeAll(async () => {
        TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml_with_pem_cert"
        });

        base = {
            ...TEST_ENVIRONMENT_NO_PROF.systemTestProperties.base,
            ...TEST_ENVIRONMENT_NO_PROF.systemTestProperties.certPem.base
        };

        if (base.certFile == null) {
            // Logging a message is the best we can do since Jest doesn't support programmatically skipping tests
            process.stdout.write("Skipping test suite because pem cert file is undefined\n");
        }
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
    });

    it("should successfully login with cert and show token", () => {
        if (base.certFile != null) {
            const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_show_token_with_pem_cert.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    base.host,
                    base.port,
                    base.certFile,
                    base.certKeyFile,
                    base.rejectUnauthorized,
                    "true"
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Received a token of type = apimlAuthenticationToken");
            expect(response.stdout.toString()).toContain("Login successful. To revoke this token, review the 'zowe auth logout' command.");
        }
    });

    it("should successfully logout with token from cert without profiles", () => {
        if (base.certFile != null) {
            // first get a token
            let response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_show_token_with_pem_cert.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    base.host,
                    base.port,
                    base.certFile,
                    base.certKeyFile,
                    base.rejectUnauthorized,
                    "true"
                ]
            );
            const token = response.stdout.toString().trim().split("\n");

            // now use the token to logout
            response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml_show_token.sh",
                TEST_ENVIRONMENT_NO_PROF,
                [
                    base.host,
                    base.port,
                    "apimlAuthenticationToken",
                    token[token.length - 3],
                    base.rejectUnauthorized
                ]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Logout successful. The authentication token has been revoked");
        }
    });
});
