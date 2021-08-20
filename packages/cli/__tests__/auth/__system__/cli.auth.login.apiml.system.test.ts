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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ITestBaseSchema } from "../../../../../__tests__/__src__/properties/ITestBaseSchema";

describe("auth login/logout apiml with profile", () => {
    let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml",
            tempProfileTypes: ["base"]
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should successfully issue the login command", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain("The authentication token is stored");
        expect(response.stdout.toString()).toContain("To revoke this token and remove it from your profile, review the 'zowe auth logout' command.");
    });

    it("should successfully issue the logout command", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful.");
        expect(response.stdout.toString()).toContain("The authentication token has been revoked and removed");
    });
});

describe("auth login/logout apiml show token", () => {
    let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment<ITestPropertiesSchema>;
    let base: ITestBaseSchema;
    let token: string[];

    beforeEach(async () => {
        TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml_no_profile"
        });

        base = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.base;
    });

    afterEach(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
    });

    it("should successfully issue the login command and show token", () => {
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
        token = response.stdout.toString().trim().split("\n");
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Received a token of type = apimlAuthenticationToken");
        expect(response.stdout.toString()).toContain("Login successful. To revoke this token, review the 'zowe auth logout' command.");
    });

    it("should successfully issue the login command with rfj and show token", () => {
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
        expect(JSON.parse(response.stdout.toString()).data).toMatchObject({
            tokenType: "apimlAuthenticationToken",
            tokenValue: token[token.length-3]});
    });

    it("should successfully issue the logout command without profiles", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml_show_token.sh",
            TEST_ENVIRONMENT_NO_PROF,
            [
                base.host,
                base.port,
                "apimlAuthenticationToken",
                token[token.length-3],
                base.rejectUnauthorized
            ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful. The authentication token has been revoked");
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

    it("should successfully issue the login command and create a profile", () => {
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
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Login successful.");
        expect(response.stdout.toString()).toContain("The authentication token is stored in the 'default' base profile");
    });

    it("should successfully issue the logout command with a created profile", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml.sh",
            TEST_ENVIRONMENT_CREATE_PROF);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful. The authentication token has been revoked and removed");
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

    it("should successfully issue the login command and not create a profile 1", () => {
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

    it("should successfully issue the login command and not create a profile 2", () => {
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

    it("should successfully issue the login command and timeout while creating a profile", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_create_timeout.sh",
            TEST_ENVIRONMENT_CREATE_PROF,
            [
                base.host,
                base.port,
                base.user,
                base.password,
                base.rejectUnauthorized
            ]);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Received a token of type = apimlAuthenticationToken");
        expect(response.stdout.toString()).toContain("The following token was retrieved and will not be stored in your profile");
        expect(response.stdout.toString()).toContain("Login successful.");
    });
});
