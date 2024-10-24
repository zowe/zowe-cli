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
    expectedSchemaObject,
    expectedGlobalConfigObject, expectedGlobalUserConfigObject,
    expectedProjectConfigObject, expectedProjectUserConfigObject
} from "../__resources__/expectedObjects";
import * as fs from "fs";
import * as path from "path";
import * as lodash from "lodash";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config init", () => {
    // config-init creates user base profiles with an empty secure array
    const expectedGlobalUserJson = lodash.cloneDeep(expectedGlobalUserConfigObject);
    expectedGlobalUserJson.profiles.global_base.secure = [];

    const expectedProjectUserJson = lodash.cloneDeep(expectedProjectUserConfigObject);
    expectedProjectUserJson.profiles.project_base.secure = [];

    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_init_command"
        });
    });
    afterEach(() => {
        runCliScript(__dirname + "/../__scripts__/delete_configs.sh", TEST_ENVIRONMENT.workingDir,
            ["-rf imperative-test-cli.config.user.json imperative-test-cli.config.json test imperative-test-cli.schema.json"]);
    });
    it("should display the help", () => {
        const response = runCliScript(__dirname + "/../__scripts__/get_help.sh",
            TEST_ENVIRONMENT.workingDir, ["init"]);
        const expectedLines = [
            `Initialize config files. Defaults to initializing`,
            `"imperative-test-cli.config.json" in the current working directory unless`,
            `otherwise specified.`,
            `Use "--user-config" to init "imperative-test-cli.config.user.json". Use`,
            `"--global-config" to initialize the configuration files in your home "~/.zowe"`,
            `directory.`,
            `Use "--no-prompt" to skip prompting for values in a CI environment.`
        ];
        expectedLines.forEach((line: string) => expect(response.output.toString()).toContain(line));
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should initialize a project config", () => {
        const response = runCliScript(__dirname + "/__scripts__/init_config.sh",
            TEST_ENVIRONMENT.workingDir, ["--prompt false"]);
        const expectedProjectConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.json");
        const expectedSchemaLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.schema.json");
        expect(response.output.toString()).toContain(`Saved config template to`);
        expect(response.output.toString()).toContain(expectedProjectConfigLocation);
        expect(fs.existsSync(expectedProjectConfigLocation)).toEqual(true);
        expect(fs.existsSync(expectedProjectConfigLocation)).toEqual(true);
        expect(JSON.parse(fs.readFileSync(expectedProjectConfigLocation).toString())).toEqual(expectedProjectConfigObject);
        expect(JSON.parse(fs.readFileSync(expectedSchemaLocation).toString())).toEqual(expectedSchemaObject);

    });
    it("should initialize a project user config", () => {
        const response = runCliScript(__dirname + "/__scripts__/init_config.sh",
            TEST_ENVIRONMENT.workingDir, ["--user-config --prompt false"]);
        const expectedProjectUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.user.json");
        const expectedSchemaLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.schema.json");
        expect(response.output.toString()).toContain(`Saved config template to`);
        expect(response.output.toString()).toContain(expectedProjectUserConfigLocation);
        expect(fs.existsSync(expectedProjectUserConfigLocation)).toEqual(true);
        expect(fs.existsSync(expectedSchemaLocation)).toEqual(true);
        expect(JSON.parse(fs.readFileSync(expectedProjectUserConfigLocation).toString())).toEqual(expectedProjectUserJson);
        expect(JSON.parse(fs.readFileSync(expectedSchemaLocation).toString())).toEqual(expectedSchemaObject);
    });
    it("should initialize a global config", () => {
        const response = runCliScript(__dirname + "/__scripts__/init_config.sh",
            TEST_ENVIRONMENT.workingDir, ["--global-config --prompt false"]);
        const expectedGlobalConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json");
        const expectedSchemaLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.schema.json");
        expect(response.output.toString()).toContain(`Saved config template to`);
        expect(response.output.toString()).toContain(expectedGlobalConfigLocation);
        expect(fs.existsSync(expectedGlobalConfigLocation)).toEqual(true);
        expect(fs.existsSync(expectedSchemaLocation)).toEqual(true);
        expect(JSON.parse(fs.readFileSync(expectedGlobalConfigLocation).toString())).toEqual(expectedGlobalConfigObject);
        expect(JSON.parse(fs.readFileSync(expectedSchemaLocation).toString())).toEqual(expectedSchemaObject);
    });
    it("should initialize a user global config", () => {
        const response = runCliScript(__dirname + "/__scripts__/init_config.sh",
            TEST_ENVIRONMENT.workingDir, ["--global-config --user-config --prompt false"]);
        const expectedGlobalUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.user.json");
        const expectedSchemaLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.schema.json");
        expect(response.output.toString()).toContain(`Saved config template to`);
        expect(response.output.toString()).toContain(expectedGlobalUserConfigLocation);
        expect(fs.existsSync(expectedGlobalUserConfigLocation)).toEqual(true);
        expect(fs.existsSync(expectedGlobalUserConfigLocation)).toEqual(true);
        expect(JSON.parse(fs.readFileSync(expectedGlobalUserConfigLocation).toString())).toEqual(expectedGlobalUserJson);
        expect(JSON.parse(fs.readFileSync(expectedSchemaLocation).toString())).toEqual(expectedSchemaObject);
    });
    it("should initialize a project config with prompting", () => {
        const response = runCliScript(__dirname + "/__scripts__/init_config_prompt.sh",
            TEST_ENVIRONMENT.workingDir, [""]);
        const expectedProjectConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.json");
        const expectedSchemaLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.schema.json");
        expect(response.output.toString()).not.toContain("Unable to securely save credentials");
        expect(response.output.toString()).toContain(`Saved config template to`);
        expect(response.output.toString()).toContain(expectedProjectConfigLocation);
        expect(fs.existsSync(expectedProjectConfigLocation)).toEqual(true);
        expect(fs.existsSync(expectedSchemaLocation)).toEqual(true);
        expect(JSON.parse(fs.readFileSync(expectedProjectConfigLocation).toString())).toEqual(expectedProjectConfigObject);
        expect(JSON.parse(fs.readFileSync(expectedSchemaLocation).toString())).toEqual(expectedSchemaObject);
    });
    it("should initialize a project user config with prompting", () => {
        const response = runCliScript(__dirname + "/__scripts__/init_config_prompt.sh",
            TEST_ENVIRONMENT.workingDir, ["--user-config"]);
        const expectedProjectUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.user.json");
        const expectedSchemaLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.schema.json");
        expect(response.output.toString()).not.toContain("Unable to securely save credentials");
        expect(response.output.toString()).toContain(`Saved config template to`);
        expect(response.output.toString()).toContain(expectedProjectUserConfigLocation);
        expect(fs.existsSync(expectedProjectUserConfigLocation)).toEqual(true);
        expect(fs.existsSync(expectedSchemaLocation)).toEqual(true);
        expect(JSON.parse(fs.readFileSync(expectedProjectUserConfigLocation).toString())).toEqual(expectedProjectUserJson);
        expect(JSON.parse(fs.readFileSync(expectedSchemaLocation).toString())).toEqual(expectedSchemaObject);
    });
    it("should initialize a global config with prompting", () => {
        const response = runCliScript(__dirname + "/__scripts__/init_config_prompt.sh",
            TEST_ENVIRONMENT.workingDir, ["--global-config"]);
        const expectedGlobalConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json");
        const expectedSchemaLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.schema.json");
        expect(response.output.toString()).not.toContain("Unable to securely save credentials");
        expect(response.output.toString()).toContain(`Saved config template to`);
        expect(response.output.toString()).toContain(expectedGlobalConfigLocation);
        expect(fs.existsSync(expectedGlobalConfigLocation)).toEqual(true);
        expect(fs.existsSync(expectedSchemaLocation)).toEqual(true);
        expect(JSON.parse(fs.readFileSync(expectedGlobalConfigLocation).toString())).toEqual(expectedGlobalConfigObject);
        expect(JSON.parse(fs.readFileSync(expectedSchemaLocation).toString())).toEqual(expectedSchemaObject);
    });
    it("should initialize a user global config with prompting", () => {
        const response = runCliScript(__dirname + "/__scripts__/init_config_prompt.sh",
            TEST_ENVIRONMENT.workingDir, ["--global-config --user-config"]);
        const expectedGlobalUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.user.json");
        const expectedSchemaLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.schema.json");
        expect(response.output.toString()).not.toContain("Unable to securely save credentials");
        expect(response.output.toString()).toContain(`Saved config template to`);
        expect(response.output.toString()).toContain(expectedGlobalUserConfigLocation);
        expect(fs.existsSync(expectedGlobalUserConfigLocation)).toEqual(true);
        expect(fs.existsSync(expectedSchemaLocation)).toEqual(true);
        expect(JSON.parse(fs.readFileSync(expectedGlobalUserConfigLocation).toString())).toEqual(expectedGlobalUserJson);
        expect(JSON.parse(fs.readFileSync(expectedSchemaLocation).toString())).toEqual(expectedSchemaObject);
    });
});
