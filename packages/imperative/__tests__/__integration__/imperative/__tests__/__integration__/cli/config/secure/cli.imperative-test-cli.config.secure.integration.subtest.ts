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

import { ITestEnvironment } from "../../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../src/TestUtil";
import {
    expectedGlobalConfigObject, expectedGlobalUserConfigObject,
    expectedProjectConfigObject, expectedProjectUserConfigObject
} from "../__resources__/expectedObjects";
import * as fs from "fs";
import { keyring } from "@zowe/secrets-for-zowe-sdk";
import * as path from "path";
import * as lodash from "lodash";
import { IConfigProfile } from "../../../../../../../../src";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config secure", () => {
    const service = "imperative-test-cli";
    let expectedGlobalConfigLocation: string;
    let expectedGlobalUserConfigLocation: string;
    let expectedProjectConfigLocation: string;
    let expectedProjectUserConfigLocation: string;

    const expectedGlobalConfig = lodash.cloneDeep(expectedGlobalConfigObject);
    delete expectedGlobalConfig.$schema;
    expectedGlobalConfig.profiles.global_base.properties.secret = "(secure value)";
    expectedGlobalConfig.profiles.global_base.secure = ["secret"];

    const expectedGlobalUserConfig = lodash.cloneDeep(expectedGlobalUserConfigObject);
    delete expectedGlobalUserConfig.$schema;
    expectedGlobalUserConfig.profiles.global_base.secure = []; // config-init creates user base profiles with an empty secure array

    const expectedProjectConfig = lodash.cloneDeep(expectedProjectConfigObject);
    delete expectedProjectConfig.$schema;
    expectedProjectConfig.profiles.project_base.properties.secret = "(secure value)";
    expectedProjectConfig.profiles.project_base.secure = ["secret"];

    const expectedProjectUserConfig = lodash.cloneDeep(expectedProjectUserConfigObject);
    delete expectedProjectUserConfig.$schema;
    expectedProjectUserConfig.profiles.project_base.secure = []; // config-init creates user base profiles with an empty secure array

    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_secure_command"
        });
        expectedGlobalUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.user.json");
        expectedGlobalConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json");
        expectedProjectUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.user.json");
        expectedProjectConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.json");
    });

    afterEach(async () => {
        runCliScript(__dirname + "/../__scripts__/delete_configs.sh", TEST_ENVIRONMENT.workingDir,
            ["-rf imperative-test-cli.config.user.json imperative-test-cli.config.json test schema.json"]);
        await keyring.deletePassword(service, "secure_config_props");
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/../__scripts__/get_help.sh",
            TEST_ENVIRONMENT.workingDir, ["secure"]);
        expect(response.output.toString()).toContain(`Prompt for secure configuration properties.`);
    });

    it("should secure the project config", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, [""]);
        const response = runCliScript(__dirname + "/__scripts__/secure_prompt.sh", TEST_ENVIRONMENT.workingDir, [""]);
        const fileContents = JSON.parse(fs.readFileSync(expectedProjectConfigLocation).toString());
        const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
        const configJson = JSON.parse(config);
        const securedValue = await keyring.getPassword(service, "secure_config_props");
        const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
        const expectedSecuredValueJson: any = {};
        expectedSecuredValueJson[expectedProjectConfigLocation] = {
            "profiles.project_base.properties.secret": "anotherFakeValue"
        };

        expect(response.stderr.toString()).toEqual("");
        expect(response.status).toEqual(0);
        expect(configJson.data).toEqual(expectedProjectConfig);
        // Should not contain human readable credentials
        expect(fileContents.profiles.project_base.secure).toEqual(["secret"]);
        expect(fileContents.profiles.project_base.properties).not.toEqual({secret: "anotherFakeValue"});
        // Check the securely stored JSON
        expect(securedValueJson).toEqual(expectedSecuredValueJson);
    });

    it("should secure the project user config", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--user-config"]);
        const response = runCliScript(__dirname + "/__scripts__/secure_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--user-config"]);
        const fileContents = JSON.parse(fs.readFileSync(expectedProjectUserConfigLocation).toString());
        const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
        const configJson = JSON.parse(config);
        const securedValue = await keyring.getPassword(service, "secure_config_props");
        const securedValueJson = securedValue == null ? null : JSON.parse(Buffer.from(securedValue, "base64").toString());
        const expectedSecuredValueJson: any = null;

        expect(response.stderr.toString()).toEqual("");
        expect(response.status).toEqual(0);
        expect(configJson.data).toEqual(expectedProjectUserConfig);
        // Should not contain human readable credentials
        expect(fileContents.profiles.project_base.secure).not.toEqual(["secret"]);
        expect(fileContents.profiles.project_base.properties).not.toEqual({secret: "anotherFakeValue"});
        // Check the securely stored JSON
        expect(securedValueJson).toEqual(expectedSecuredValueJson);
    });

    it("should secure the global config", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--global-config"]);
        const response = runCliScript(__dirname + "/__scripts__/secure_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--global-config"]);
        const fileContents = JSON.parse(fs.readFileSync(expectedGlobalConfigLocation).toString());
        const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
        const configJson = JSON.parse(config);
        const securedValue = await keyring.getPassword(service, "secure_config_props");
        const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
        const expectedSecuredValueJson: any = {};
        expectedSecuredValueJson[expectedGlobalConfigLocation] = {
            "profiles.global_base.properties.secret": "anotherFakeValue"
        };

        expect(response.stderr.toString()).toEqual("");
        expect(response.status).toEqual(0);
        expect(configJson.data).toEqual(expectedGlobalConfig);
        // Should not contain human readable credentials
        expect(fileContents.profiles.global_base.secure).toEqual(["secret"]);
        expect(fileContents.profiles.global_base.properties).not.toEqual({secret: "anotherFakeValue"});
        // Check the securely stored JSON
        expect(securedValueJson).toEqual(expectedSecuredValueJson);
    });

    it("should secure the global user config", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--global-config --user-config"]);
        const response = runCliScript(__dirname + "/__scripts__/secure_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--global-config --user-config"]);
        const fileContents = JSON.parse(fs.readFileSync(expectedGlobalUserConfigLocation).toString());
        const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
        const configJson = JSON.parse(config);
        const securedValue = await keyring.getPassword(service, "secure_config_props");
        const securedValueJson = securedValue == null ? null : JSON.parse(Buffer.from(securedValue, "base64").toString());
        const expectedSecuredValueJson: any = null;

        expect(response.stderr.toString()).toEqual("");
        expect(response.status).toEqual(0);
        expect(configJson.data).toEqual(expectedGlobalUserConfig);
        // Should not contain human readable credentials
        expect(fileContents.profiles.global_base.secure).not.toEqual(["secret"]);
        expect(fileContents.profiles.global_base.properties).not.toEqual({secret: "anotherFakeValue"});
        // Check the securely stored JSON
        expect(securedValueJson).toEqual(expectedSecuredValueJson);
    });

    it("should prompt for user and password to obtain auth token", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir);
        const baseProfile: IConfigProfile = {
            type: "base",
            properties: {
                "host": "example.com",
                "port": 443,
                "user": "fakeUser",
                "tokenType": "jwtToken"
            },
            secure: [
                "tokenValue"
            ]
        };
        runCliScript(__dirname + "/../set/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles", JSON.stringify({ project_base: baseProfile }), "--json"]);
        const response = runCliScript(__dirname + "/__scripts__/secure_prompt.sh", TEST_ENVIRONMENT.workingDir);
        const fileContents = JSON.parse(fs.readFileSync(expectedProjectConfigLocation).toString());
        const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
        const configJson = JSON.parse(config);
        const expectedJsonWithToken = lodash.cloneDeep(expectedProjectConfig);
        expectedJsonWithToken.profiles = { project_base: baseProfile };
        expectedJsonWithToken.profiles.project_base.properties.tokenValue = "(secure value)";
        const securedValue = await keyring.getPassword(service, "secure_config_props");
        const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
        const expectedSecuredValueJson: any = {};
        expectedSecuredValueJson[expectedProjectConfigLocation] = {
            "profiles.project_base.properties.tokenValue": "fakeUser:anotherFakeValue@fakeToken"
        };

        expect(response.stderr.toString()).toEqual("");
        expect(response.status).toEqual(0);
        expect(configJson.data).toEqual(expectedJsonWithToken);
        // Should not contain human readable credentials
        expect(fileContents.profiles.project_base.secure).toEqual(["tokenValue"]);
        expect(fileContents.profiles.project_base.properties.tokenValue).toBeUndefined();
        // Check the securely stored JSON
        expect(securedValueJson).toEqual(expectedSecuredValueJson);
    });
});
