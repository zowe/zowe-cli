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

import { ITestEnvironment, runCliScript, TempTestProfiles } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("auth login/logout apiml help", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "auth_login_logout_apiml",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
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

describe("Comma-separated authOrder", () => {
    let TEST_ENVIRONMENT_AUTH_ORDER: ITestEnvironment<ITestPropertiesSchema>;

    beforeAll(async () => {
        TEST_ENVIRONMENT_AUTH_ORDER = await TestEnvironment.setUp({
            testName: "auth_order_comma_separated",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_AUTH_ORDER);
    });

    it("should accept --auth-order 'token, bearer' as a command-line option", () => {
        const response = runCliScript(__dirname + "/__scripts__/auth_order_cmd_option.sh", TEST_ENVIRONMENT_AUTH_ORDER);
        const stderr = response.stderr.toString();

        expect(stderr).not.toContain("is not valid and will be ignored");
        expect(stderr).not.toContain("is not a valid authOrder string");
        expect(stderr).not.toContain("Unknown argument");
    });

    it("should accept a profile with authOrder property set to 'token, bearer'", async () => {
        await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT_AUTH_ORDER, "zosmf", {
            host: "example.com",
            port: 443,
            rejectUnauthorized: false,
            authOrder: "token, bearer"
        });

        const response = runCliScript(__dirname + "/__scripts__/auth_order_profile.sh", TEST_ENVIRONMENT_AUTH_ORDER);
        const stderr = response.stderr.toString();

        expect(stderr).not.toContain("is not valid and will be ignored");
        expect(stderr).not.toContain("is not a valid authOrder string");
    });
});
