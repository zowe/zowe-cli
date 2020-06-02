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

import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../__tests__/__src__/TestUtils";
import { ITestBaseSchema } from "../../../../../__tests__/__src__/properties/ITestBaseSchema";

describe("auth login/logout apiml with profile", () => {
    let TEST_ENVIRONMENT: ITestEnvironment;

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
    });

    it("should successfully issue the logout command", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful.");
    });
});

describe("auth login/logout apiml without profiles", () => {
    let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
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

    it("should successfully issue the login command without profiles", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_no_profiles.sh",
        TEST_ENVIRONMENT_NO_PROF,
        [
            base.host,
            base.port,
            base.user,
            base.pass,
            base.rejectUnauthorized,
            "true"
        ]);
        token = response.stdout.toString().trim().split("\n");
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Login successful.");
    });

    it("should successfully issue the logout command without profiles", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml_no_profiles.sh",
        TEST_ENVIRONMENT_NO_PROF,
        [
            base.host,
            base.port,
            "apimlAuthenticationToken",
            token[token.length-1],
            base.rejectUnauthorized
        ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful.");
    });
});

describe("auth login/logout apiml create profile", () => {
    let TEST_ENVIRONMENT_CREATE_PROF: ITestEnvironment;
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
            base.pass,
            base.rejectUnauthorized,
            "y"
        ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Profile created successfully");
        expect(response.stdout.toString()).toContain("Login successful.");
    });

    it("should successfully issue the logout command with a created profile", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml.sh",
        TEST_ENVIRONMENT_CREATE_PROF);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful.");
    });
});

describe("auth login/logout apiml do not create profile", () => {
    let TEST_ENVIRONMENT_CREATE_PROF: ITestEnvironment;
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
            base.pass,
            base.rejectUnauthorized,
            "n"
        ]);
        expect(response.stderr.toString()).toContain("A login command was issued, but no base profiles exist, " +
                "the show token flag was not specified, or we were not given permission to create a profile.");
        expect(response.status).not.toBe(0);
        expect(response.stdout.toString()).not.toContain("Profile created successfully");
        expect(response.stdout.toString()).not.toContain("Login successful.");
    });

    it("should successfully issue the login command and not create a profile 2", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_create.sh",
        TEST_ENVIRONMENT_CREATE_PROF,
        [
            base.host,
            base.port,
            base.user,
            base.pass,
            base.rejectUnauthorized,
            "q"
        ]);
        expect(response.stderr.toString()).toContain("A login command was issued, but no base profiles exist, " +
                "the show token flag was not specified, or we were not given permission to create a profile.");
        expect(response.status).not.toBe(0);
        expect(response.stdout.toString()).not.toContain("Profile created successfully");
        expect(response.stdout.toString()).not.toContain("Login successful.");
    });

    it("should successfully issue the login command and timeout while creating a profile", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_create_timeout.sh",
        TEST_ENVIRONMENT_CREATE_PROF,
        [
            base.host,
            base.port,
            base.user,
            base.pass,
            base.rejectUnauthorized
        ]);
        expect(response.stderr.toString()).toContain("A login command was issued, but no base profiles exist, " +
                "the show token flag was not specified, or we were not given permission to create a profile.");
        expect(response.status).not.toBe(0);
        expect(response.stdout.toString()).not.toContain("Profile created successfully");
        expect(response.stdout.toString()).not.toContain("Login successful.");
    });
});
