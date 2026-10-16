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

import * as fs from "fs";
import * as path from "path";
import { Config, ConfigUtils } from "@zowe/imperative";
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

describe("direct-* authentication method", () => {
    describe("direct-* with an APIML base path", () => {
        let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
        let user: string;
        let apimlBasePath: string;

        beforeAll(async () => {
            TEST_ENVIRONMENT = await TestEnvironment.setUp({
                testName: "direct_with_apiml_base_path"
            });

            const systemProps = TEST_ENVIRONMENT.systemTestProperties;
            user = systemProps.zosmf.user;
            apimlBasePath = systemProps.zosmf.basePath || "ibmzosmf/api/v1";

            // Create zosmf profile with direct-basic allowedLoginMethod but basePath routing through APIML
            await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT, "zosmf", {
                host: systemProps.base?.host || systemProps.zosmf.host,
                port: systemProps.base?.port || systemProps.zosmf.port,
                basePath: apimlBasePath,
                allowedLoginMethod: "direct-basic",
                user: systemProps.zosmf.user,
                password: systemProps.zosmf.password,
                rejectUnauthorized: systemProps.zosmf.rejectUnauthorized
            });
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        });

        it("direct-basic on a profile whose basePath routes through APIML - use a pound sign in a data set name that isn't encoded - results in HTTP 400 from APIML", () => {
            const dsNameWithPound = `${user}.#TEST.DATA`;
            const response = runCliScript(__dirname + "/__scripts__/auth_direct_apiml_base_path.sh", TEST_ENVIRONMENT, [dsNameWithPound]);

            // The command should fail (HTTP 400 from APIML due to unencoded pound sign)
            expect(response.status).not.toBe(0);
            const combinedOutput = response.stdout.toString() + response.stderr.toString();
            expect(combinedOutput).toMatch(/400|Bad Request|RestError|error/i);
        });
    });

    describe("direct-* goes direct to the service", () => {
        let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
        let user: string;
        let password: string;

        beforeAll(async () => {
            TEST_ENVIRONMENT = await TestEnvironment.setUp({
                testName: "direct_goes_direct_to_service"
            });

            const systemProps = TEST_ENVIRONMENT.systemTestProperties;
            user = systemProps.zosmf.user;
            password = systemProps.zosmf.password;

            // Create zosmf profile with direct-basic allowedLoginMethod without stored credentials
            await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT, "zosmf", {
                host: systemProps.zosmf.host,
                port: systemProps.zosmf.port,
                rejectUnauthorized: systemProps.zosmf.rejectUnauthorized,
                allowedLoginMethod: "direct-basic"
            });
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        });

        it("The command authenticates to the service with the prompted credentials. No APIML login request is made and no token is requested", async () => {
            const response = runCliScript(__dirname + "/__scripts__/auth_prompt_credentials.sh", TEST_ENVIRONMENT, [user, password]);

            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("successfully connected to z/OSMF");

            // Verify no APIML token was stored in the active profile
            const config = await Config.load("zowe", { homeDir: TEST_ENVIRONMENT.workingDir });
            const zosmfProfile: any = config.api.profiles.get("zosmf", false);
            expect(zosmfProfile).toBeDefined();
            expect(zosmfProfile?.properties?.tokenValue).toBeUndefined();
            expect(zosmfProfile?.properties?.tokenType).toBeUndefined();
        });
    });
});

describe("apiml-* authentication method", () => {
    /**
     * Create a base profile (the APIML gateway) and a zosmf profile that sends its requests through APIML
     * with allowedLoginMethod set to apiml-basic. The zosmf profile has no stored credentials unless
     * extra properties are supplied. createV2Profile does not turn on autoStore, and nothing is stored
     * without it, so we turn it on here. It also does not write a `type` for each profile, and the token
     * exchange only happens for a profile whose type is in the config file, so we write each type here.
     */
    async function createApimlProfiles(env: ITestEnvironment<ITestPropertiesSchema>, extraZosmfProps: Record<string, any> = {}) {
        const systemProps = env.systemTestProperties;
        await TempTestProfiles.createV2Profile(env, "base", {
            host: systemProps.base.host,
            port: systemProps.base.port,
            rejectUnauthorized: systemProps.base.rejectUnauthorized
        });
        await TempTestProfiles.createV2Profile(env, "zosmf", {
            basePath: systemProps.zosmf.basePath || "ibmzosmf/api/v1",
            allowedLoginMethod: "apiml-basic",
            ...extraZosmfProps
        });

        const configPath = path.join(env.workingDir, "zowe.config.json");
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        for (const [profileType, profileName] of Object.entries<string>(config.defaults)) {
            config.profiles[profileName] = { type: profileType, ...config.profiles[profileName] };
        }
        fs.writeFileSync(configPath, JSON.stringify({ ...config, autoStore: true }, null, 4));
    }

    /** Read the default zosmf profile straight from the config file, so nothing depends on a credential manager. */
    function readZosmfProfile(env: ITestEnvironment<ITestPropertiesSchema>): any {
        const config = JSON.parse(fs.readFileSync(path.join(env.workingDir, "zowe.config.json"), "utf8"));
        const profile = config.profiles[config.defaults.zosmf];
        expect(profile).toBeDefined();
        return profile;
    }

    /** A property is stored when it is in the profile's properties, or listed in its secure array. */
    const isStored = (profile: any, propName: string): boolean =>
        profile.properties?.[propName] !== undefined || profile.secure?.includes(propName) === true;

    describe("apiml-* with no token", () => {
        let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

        beforeAll(async () => {
            TEST_ENVIRONMENT = await TestEnvironment.setUp({
                testName: "apiml_no_token"
            });
            await createApimlProfiles(TEST_ENVIRONMENT);
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        });

        it("The command prompts for credentials, runs the APIML login itself, and stores only a token", () => {
            const { user, password } = TEST_ENVIRONMENT.systemTestProperties.base;
            const response = runCliScript(__dirname + "/__scripts__/auth_prompt_credentials.sh", TEST_ENVIRONMENT, [user, password]);

            expect(response.status).toBe(0);
            const stdout = response.stdout.toString();
            expect(stdout).toContain("successfully connected to z/OSMF");
            expect(stdout).toContain("Stored properties in");

            // The credentials were exchanged for a token, so only the token is stored
            const profile = readZosmfProfile(TEST_ENVIRONMENT);
            expect(profile.properties?.tokenType).toBe("apimlAuthenticationToken");
            expect(isStored(profile, "tokenValue")).toBe(true);
            expect(isStored(profile, "user")).toBe(false);
            expect(isStored(profile, "password")).toBe(false);
        });
    });

    describe("apiml-* failed login", () => {
        let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

        beforeAll(async () => {
            TEST_ENVIRONMENT = await TestEnvironment.setUp({
                testName: "apiml_failed_login"
            });
            await createApimlProfiles(TEST_ENVIRONMENT);
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        });

        it("Invalid credentials result in a clear error and nothing is saved", () => {
            // Use a user ID that does not exist, rather than a real ID with a wrong password,
            // so that a test run can never count against a real user's failed-logon limit.
            const response = runCliScript(__dirname + "/__scripts__/auth_prompt_credentials.sh", TEST_ENVIRONMENT,
                ["NOSUCHUSR", "NotTheRealPassword1"]);

            expect(response.status).not.toBe(0);
            const output = response.stdout.toString() + response.stderr.toString();
            expect(output).toContain("This operation requires authentication");
            expect(output).not.toContain("Stored properties in");

            const profile = readZosmfProfile(TEST_ENVIRONMENT);
            expect(isStored(profile, "user")).toBe(false);
            expect(isStored(profile, "password")).toBe(false);
            expect(isStored(profile, "tokenValue")).toBe(false);
            expect(isStored(profile, "tokenType")).toBe(false);
        });
    });

    describe("apiml-* with an expired token", () => {
        let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
        let expiredToken: string;

        beforeAll(async () => {
            TEST_ENVIRONMENT = await TestEnvironment.setUp({
                testName: "apiml_expired_token"
            });

            const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
            expiredToken = [
                encode({ alg: "HS256", typ: "JWT" }),
                encode({ sub: "expireduser", exp: Math.floor(Date.now() / 1000) - 3600 }),
                "invalidsignature"
            ].join(".");

            await createApimlProfiles(TEST_ENVIRONMENT, {
                tokenType: "apimlAuthenticationToken",
                tokenValue: expiredToken
            });
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
        });

        it("Fails with an authentication error, does not prompt to log in again, and leaves the stored token alone", () => {
            expect(ConfigUtils.hasTokenExpired(expiredToken)).toBe(true);

            const response = runCliScript(__dirname + "/__scripts__/auth_apiml_no_stdin.sh", TEST_ENVIRONMENT);

            expect(response.status).not.toBe(0);
            const output = response.stdout.toString() + response.stderr.toString();
            expect(output).toContain("This operation requires authentication");
            expect(output).toContain("is not valid, token is invalid, or token is expired");

            // No prompt for credentials was shown, so no login was attempted
            expect(output).not.toContain("Required connection properties are missing");
            expect(output).not.toMatch(/Enter the (user name|password) for/);

            // The expired token was neither replaced nor removed
            expect(readZosmfProfile(TEST_ENVIRONMENT).properties?.tokenValue).toBe(expiredToken);
        });
    });
});
