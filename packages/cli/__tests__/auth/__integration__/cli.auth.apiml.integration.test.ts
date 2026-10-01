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
import { ProfileInfo } from "@zowe/imperative";
import { ITestEnvironment, runCliScript, TempTestProfiles } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

/**
 * `zowe config update-schemas` writes zowe.schema.json but does not add a `$schema`
 * reference to the config file, and ProfileInfo skips any config layer that has none.
 */
function addSchemaRef(configPath: string): void {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    fs.writeFileSync(configPath, JSON.stringify({ $schema: "./zowe.schema.json", ...config }, null, 4));
}

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

describe("allowedLoginMethod schema validation and runtime execution", () => {
    let TEST_ENVIRONMENT_SCHEMA: ITestEnvironment<ITestPropertiesSchema>;

    beforeAll(async () => {
        TEST_ENVIRONMENT_SCHEMA = await TestEnvironment.setUp({
            testName: "allowed_login_method_schema",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_SCHEMA);
    });

    it("zowe config update-schemas command includes the new allowedLoginMethod property and its five allowed values", async () => {
        await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT_SCHEMA, "zosmf", {
            host: "example.com",
            port: 443
        });

        const updateResponse = runCliScript(__dirname + "/__scripts__/auth_order_profile.sh", TEST_ENVIRONMENT_SCHEMA, ["config", "update-schemas"]);
        expect(updateResponse.status).toBe(0);

        const schemaPath = path.join(TEST_ENVIRONMENT_SCHEMA.workingDir, "zowe.schema.json");
        expect(fs.existsSync(schemaPath)).toBe(true);

        const schemaJson = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

        const allOfEntries = schemaJson.properties?.profiles?.patternProperties?.["^\\S*$"]?.allOf || [];
        let allowedLoginMethodProp: any = null;

        for (const entry of allOfEntries) {
            const props = entry.then?.properties?.properties?.properties;
            if (props && props.allowedLoginMethod) {
                allowedLoginMethodProp = props.allowedLoginMethod;
                break;
            }
        }

        expect(allowedLoginMethodProp).toBeDefined();
        expect(allowedLoginMethodProp.type).toBe("string");
        expect(allowedLoginMethodProp.enum).toEqual([
            "direct-basic",
            "direct-cert-pem",
            "apiml-basic",
            "apiml-cert-pem",
            "prompt"
        ]);
    });

    it("Illegal values: Schema only (Comma-separated, array, or unknown values are flagged by the schema; commands still run)", async () => {
        await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT_SCHEMA, "zosmf", {
            host: "example.com",
            port: 443
        });

        runCliScript(__dirname + "/__scripts__/auth_order_profile.sh", TEST_ENVIRONMENT_SCHEMA, ["config", "update-schemas"]);
        const schemaPath = path.join(TEST_ENVIRONMENT_SCHEMA.workingDir, "zowe.schema.json");
        const schemaJson = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

        // ajv 6 only knows the draft-07 meta-schema, so it cannot resolve the draft 2020-12 $schema URL
        delete schemaJson.$schema;

        const Ajv = require("ajv");
        const ajv = new Ajv({ allErrors: true, schemaId: "auto" });
        ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
        const validate = ajv.compile(schemaJson);

        // 1. Valid allowedLoginMethod value
        const validConfig = {
            $schema: "./zowe.schema.json",
            profiles: {
                zosmf: {
                    type: "zosmf",
                    properties: {
                        allowedLoginMethod: "direct-basic"
                    }
                }
            }
        };
        expect(validate(validConfig)).toBe(true);

        // 2. Illegal value: Comma-separated string
        const commaSeparatedConfig = {
            $schema: "./zowe.schema.json",
            profiles: {
                zosmf: {
                    type: "zosmf",
                    properties: {
                        allowedLoginMethod: "direct-basic, direct-cert-pem"
                    }
                }
            }
        };
        expect(validate(commaSeparatedConfig)).toBe(false);

        // 3. Illegal value: Array
        const arrayConfig = {
            $schema: "./zowe.schema.json",
            profiles: {
                zosmf: {
                    type: "zosmf",
                    properties: {
                        allowedLoginMethod: ["direct-basic"]
                    }
                }
            }
        };
        expect(validate(arrayConfig)).toBe(false);

        // 4. Illegal value: Unknown string
        const unknownConfig = {
            $schema: "./zowe.schema.json",
            profiles: {
                zosmf: {
                    type: "zosmf",
                    properties: {
                        allowedLoginMethod: "unknown-method"
                    }
                }
            }
        };
        expect(validate(unknownConfig)).toBe(false);

        // 5. Commands still run when illegal value is in zowe.config.json
        const configPath = path.join(TEST_ENVIRONMENT_SCHEMA.workingDir, "zowe.config.json");
        fs.writeFileSync(configPath, JSON.stringify(commaSeparatedConfig, null, 2));

        const cmdResponse = runCliScript(__dirname + "/__scripts__/auth_order_profile.sh", TEST_ENVIRONMENT_SCHEMA);
        expect(cmdResponse.stderr.toString()).not.toContain("Unknown argument");
        expect(cmdResponse.stderr.toString()).not.toContain("SchemaValidationError");
    });
});

describe("allowedLoginMethod option validation and environment variable", () => {
    let TEST_ENVIRONMENT_CLI: ITestEnvironment<ITestPropertiesSchema>;

    beforeAll(async () => {
        TEST_ENVIRONMENT_CLI = await TestEnvironment.setUp({
            testName: "allowed_login_method_cli_opts",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_CLI);
    });

    it("Valid CLI value accepted (--allowed-login-method apiml-basic passes syntax validation)", () => {
        const response = runCliScript(
            __dirname + "/__scripts__/auth_order_profile.sh",
            TEST_ENVIRONMENT_CLI,
            ["zosmf", "check", "status", "--allowed-login-method", "apiml-basic", "--host", "example.com"]
        );

        const stderr = response.stderr.toString();
        expect(stderr).not.toContain("Unknown argument");
        expect(stderr).not.toContain("is not valid and will be ignored");
        expect(stderr).not.toContain("Allowed values");
    });

    it("Invalid CLI value rejected (--allowed-login-method bogus on command line fails with allowed-values error)", () => {
        const response = runCliScript(
            __dirname + "/__scripts__/auth_order_profile.sh",
            TEST_ENVIRONMENT_CLI,
            ["zosmf", "check", "status", "--allowed-login-method", "bogus", "--host", "example.com"]
        );

        const output = response.stderr.toString() + response.stdout.toString();
        expect(output).toMatch(/Invalid value specified for option|must match one of the following options/i);
        expect(output).toContain("--allowed-login-method");
        expect(output).toContain("bogus");
    });

    it("Environment variable (ZOWE_OPT_ALLOWED_LOGIN_METHOD=direct-basic is picked up as option value)", () => {
        TEST_ENVIRONMENT_CLI.env.ZOWE_OPT_ALLOWED_LOGIN_METHOD = "direct-basic";

        const response = runCliScript(
            __dirname + "/__scripts__/auth_order_profile.sh",
            TEST_ENVIRONMENT_CLI,
            ["zosmf", "check", "status", "--host", "example.com"]
        );

        delete TEST_ENVIRONMENT_CLI.env.ZOWE_OPT_ALLOWED_LOGIN_METHOD;

        const stderr = response.stderr.toString();
        expect(stderr).not.toContain("Unknown argument");
        expect(stderr).not.toContain("is not valid and will be ignored");
        expect(stderr).not.toContain("Allowed values");
    });
});

describe("Service profile overrides base", () => {
    let TEST_ENVIRONMENT_OVERRIDE: ITestEnvironment<ITestPropertiesSchema>;

    beforeAll(async () => {
        TEST_ENVIRONMENT_OVERRIDE = await TestEnvironment.setUp({
            testName: "service_profile_overrides_base",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_OVERRIDE);
    });

    it("direct-basic on the zosmf profile wins over apiml-basic on the base profile", async () => {
        await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT_OVERRIDE, "base", {
            host: "example.com",
            port: 443,
            allowedLoginMethod: "apiml-basic"
        });

        await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT_OVERRIDE, "zosmf", {
            host: "example.com",
            port: 443,
            allowedLoginMethod: "direct-basic"
        });

        // createV2Profile writes no schema, but ProfileInfo needs one to merge a profile's arguments
        const updateResponse = runCliScript(__dirname + "/__scripts__/auth_order_profile.sh", TEST_ENVIRONMENT_OVERRIDE, ["config", "update-schemas"]);
        expect(updateResponse.status).toBe(0);
        addSchemaRef(path.join(TEST_ENVIRONMENT_OVERRIDE.workingDir, "zowe.config.json"));

        const profInfo = new ProfileInfo("zowe");
        await profInfo.readProfilesFromDisk({ projectDir: TEST_ENVIRONMENT_OVERRIDE.workingDir });

        const zosmfProfile = profInfo.getDefaultProfile("zosmf");
        expect(zosmfProfile).toBeDefined();

        const mergedArgs = profInfo.mergeArgsForProfile(zosmfProfile);
        const allowedLoginMethodArg = mergedArgs.knownArgs.find(arg => arg.argName === "allowedLoginMethod");

        expect(allowedLoginMethodArg).toBeDefined();
        expect(allowedLoginMethodArg.argValue).toBe("direct-basic");
    });
});

describe("Users overriding the admin value", () => {
    let TEST_ENVIRONMENT_USER_OVERRIDE: ITestEnvironment<ITestPropertiesSchema>;

    beforeAll(async () => {
        TEST_ENVIRONMENT_USER_OVERRIDE = await TestEnvironment.setUp({
            testName: "users_overriding_admin_value",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_USER_OVERRIDE);
    });

    it("allows user to bypass admin value via --allowed-login-method command-line option", async () => {
        await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT_USER_OVERRIDE, "zosmf", {
            host: "example.com",
            port: 443,
            allowedLoginMethod: "apiml-basic"
        });

        const response = runCliScript(
            __dirname + "/__scripts__/auth_order_profile.sh",
            TEST_ENVIRONMENT_USER_OVERRIDE,
            ["--allowed-login-method", "direct-basic"]
        );

        const stderr = response.stderr.toString();
        expect(stderr).not.toContain("Unknown argument");
        expect(stderr).not.toContain("is not valid and will be ignored");
    });

    it("allows user to bypass admin value via ZOWE_OPT_ALLOWED_LOGIN_METHOD environment variable", async () => {
        await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT_USER_OVERRIDE, "zosmf", {
            host: "example.com",
            port: 443,
            allowedLoginMethod: "apiml-basic"
        });

        TEST_ENVIRONMENT_USER_OVERRIDE.env.ZOWE_OPT_ALLOWED_LOGIN_METHOD = "direct-basic";

        const response = runCliScript(
            __dirname + "/__scripts__/auth_order_profile.sh",
            TEST_ENVIRONMENT_USER_OVERRIDE
        );

        delete TEST_ENVIRONMENT_USER_OVERRIDE.env.ZOWE_OPT_ALLOWED_LOGIN_METHOD;

        const stderr = response.stderr.toString();
        expect(stderr).not.toContain("Unknown argument");
        expect(stderr).not.toContain("is not valid and will be ignored");
    });

    it("allows user to bypass admin value via user config layer (zowe.config.user.json)", async () => {
        const profileName = await TempTestProfiles.createV2Profile(TEST_ENVIRONMENT_USER_OVERRIDE, "zosmf", {
            host: "example.com",
            port: 443,
            allowedLoginMethod: "apiml-basic"
        });

        // The user layer must override the profile that was just created, so it has to use that profile's generated name
        const userConfigPath = path.join(TEST_ENVIRONMENT_USER_OVERRIDE.workingDir, "zowe.config.user.json");
        // ProfileInfo loads a profile's schema from the layer the profile resolves to (here the user layer),
        // so the user config needs its own $schema reference
        const userConfig = {
            $schema: "./zowe.schema.json",
            profiles: {
                [profileName]: {
                    properties: {
                        allowedLoginMethod: "direct-basic"
                    }
                }
            }
        };
        fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2));

        // createV2Profile writes no schema, but ProfileInfo needs one to merge a profile's arguments
        const updateResponse = runCliScript(__dirname + "/__scripts__/auth_order_profile.sh", TEST_ENVIRONMENT_USER_OVERRIDE, ["config", "update-schemas"]);
        expect(updateResponse.status).toBe(0);
        addSchemaRef(path.join(TEST_ENVIRONMENT_USER_OVERRIDE.workingDir, "zowe.config.json"));

        const profInfo = new ProfileInfo("zowe");
        await profInfo.readProfilesFromDisk({ projectDir: TEST_ENVIRONMENT_USER_OVERRIDE.workingDir });

        const zosmfProfile = profInfo.getDefaultProfile("zosmf");
        expect(zosmfProfile).toBeDefined();

        const mergedArgs = profInfo.mergeArgsForProfile(zosmfProfile);
        const allowedLoginMethodArg = mergedArgs.knownArgs.find(arg => arg.argName === "allowedLoginMethod");

        expect(allowedLoginMethodArg).toBeDefined();
        expect(allowedLoginMethodArg.argValue).toBe("direct-basic");
    });
});

describe("Help text tests", () => {
    let TEST_ENVIRONMENT_HELP: ITestEnvironment<ITestPropertiesSchema>;

    beforeAll(async () => {
        TEST_ENVIRONMENT_HELP = await TestEnvironment.setUp({
            testName: "allowed_login_method_help_text",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT_HELP);
    });

    it("--allowed-login-method and --auth-order appear under BASE CONNECTION OPTIONS for zosmf-based commands, with the allowed values listed", () => {
        const response = runCliScript(
            __dirname + "/__scripts__/auth_order_profile.sh",
            TEST_ENVIRONMENT_HELP,
            ["zosmf", "check", "status", "--help"]
        );

        expect(response.status).toBe(0);
        const stdout = response.stdout.toString();

        expect(stdout).toContain("BASE CONNECTION OPTIONS");

        expect(stdout).toContain("--allowed-login-method");
        expect(stdout).toContain("direct-basic");
        expect(stdout).toContain("direct-cert-pem");
        expect(stdout).toContain("apiml-basic");
        expect(stdout).toContain("apiml-cert-pem");
        expect(stdout).toContain("prompt");

        expect(stdout).toContain("--auth-order");
        expect(stdout).toContain("basic");
        expect(stdout).toContain("bearer");
        expect(stdout).toContain("token");
        expect(stdout).toContain("cert-pem");
        expect(stdout).toContain("none");
    });
});
