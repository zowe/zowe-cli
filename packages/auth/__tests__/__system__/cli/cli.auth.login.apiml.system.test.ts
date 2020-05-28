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
import { ImperativeExpect } from "@zowe/imperative";

describe("auth login/logout apiml with profile", () => {
    let TEST_ENVIRONMENT: ITestEnvironment;

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml",
            tempProfileTypes: ["base"]
        });
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
    const token: string = "";

    beforeAll(async () => {
        TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml_no_profile"
        });

        base = TEST_ENVIRONMENT_NO_PROF.systemTestProperties.base;
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
            base.tokenValue,
            base.rejectUnauthorized
        ]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Logout successful.");
    });
});

describe("auth login/logout apiml help", () => {
    let TEST_ENVIRONMENT: ITestEnvironment;

    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml",
            tempProfileTypes: ["base"]
        });
    });

    it("should display the login help", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_login_apiml_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should display the logout help", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_logout_apiml_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
});
