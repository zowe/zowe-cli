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
import { ITestEnvironment } from "../../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../src/TestUtil";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config update-schemas", () => {
    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_update_schemas_command"
        });
    });

    beforeEach(() => {
        runCliScript(__dirname + "/../__scripts__/delete_configs.sh", TEST_ENVIRONMENT.workingDir, ["-rf test fakeHome *.json"]);
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/../__scripts__/get_help.sh",
            TEST_ENVIRONMENT.workingDir, ["update-schemas"]);
        expect(response.error).toBeFalsy();
        expect(response.stderr.toString()).toEqual("");
        expect(response.output.toString()).toContain("Update schema files by looking up the directory structure.");
        expect(response.output.toString()).toContain("Schema files up in higher level directories will always be updated.");
        expect(response.output.toString()).toContain("files down in lower level directories, specify the `--depth` flag.");
        expect(response.output.toString()).toContain("Specifies how many levels down the directory structure");
    });

    it("should not update schemas if we could not find any", () => {
        const response = runCliScript(__dirname + "/__scripts__/update-schemas.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(response.error).toBeFalsy();
        expect(response.stderr.toString()).toEqual("");
        expect(response.stdout.toString()).toContain("Configuration files found: 0");
    });

    it("should update project config schema", () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--prompt false"]);
        const response = runCliScript(__dirname + "/__scripts__/update-schemas.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(response.error).toBeFalsy();
        expect(response.stderr.toString()).toEqual("");
        expect(response.stdout.toString()).toContain("Configuration files found: 1");
        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.json"));
        expect(response.stdout.toString()).toContain("updated: ./imperative-test-cli.schema.json");
        expect(response.stdout.toString()).not.toContain("imperative-test-cli.config.user.json");
    });

    it("should update user config schema", () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, [" --uc --prompt false"]);
        const response = runCliScript(__dirname + "/__scripts__/update-schemas.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(response.error).toBeFalsy();
        expect(response.stderr.toString()).toEqual("");
        expect(response.stdout.toString()).toContain("Configuration files found: 1");
        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.user.json"));
        expect(response.stdout.toString()).toContain("updated: ./imperative-test-cli.schema.json");
        expect(response.stdout.toString()).not.toContain("imperative-test-cli.config.json");
    });

    it("should update global config schemas", () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--gc --prompt false"]);
        const response = runCliScript(__dirname + "/__scripts__/update-schemas.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(response.error).toBeFalsy();
        expect(response.stderr.toString()).toEqual("");
        expect(response.stdout.toString()).toContain("Configuration files found: 1");
        expect(response.stdout.toString()).toContain("imperative-test-cli.config.json");
        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json"));
        expect(response.stdout.toString()).toContain("updated: ./imperative-test-cli.schema.json");
        expect(response.stdout.toString()).not.toContain("imperative-test-cli.config.user.json");
    });

    it("should update global user config schema", () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--gc --uc --prompt false"]);
        const response = runCliScript(__dirname + "/__scripts__/update-schemas.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(response.error).toBeFalsy();
        expect(response.stderr.toString()).toEqual("");
        expect(response.stdout.toString()).toContain("Configuration files found: 1");
        expect(response.stdout.toString()).toContain("imperative-test-cli.config.user.json");
        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.user.json"));
        expect(response.stdout.toString()).toContain("updated: ./imperative-test-cli.schema.json");
        expect(response.stdout.toString()).not.toContain("imperative-test-cli.config.json");
    });

    it("should update all four layers of schemas", () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--uc --prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--gc --prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--gc --uc --prompt false"]);

        const response = runCliScript(__dirname + "/__scripts__/update-schemas.sh", TEST_ENVIRONMENT.workingDir, [""]);

        expect(response.error).toBeFalsy();
        expect(response.stderr.toString()).toEqual("");
        expect(response.stdout.toString()).toContain("Configuration files found: 4");
        expect(response.stdout.toString()).toContain("updated: ./imperative-test-cli.schema.json");

        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.json"));
        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.user.json"));
        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json"));
        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.user.json"));
    });

    it("should update only local schemas", () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--gc --prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--uc --prompt false"]);

        // fake http schema
        const globalPath = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json");
        const httpSchema = "http://localhost/imperative-test-cli.schema.json";
        fs.writeFileSync(globalPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(globalPath).toString()), ...{ $schema: httpSchema } }));

        const response = runCliScript(__dirname + "/__scripts__/update-schemas.sh", TEST_ENVIRONMENT.workingDir, [""]);

        expect(response.error).toBeFalsy();
        expect(response.stderr.toString()).toEqual("");
        expect(response.stdout.toString()).toContain("Configuration files found: 2");
        expect(response.stdout.toString()).toContain(path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.user.json"));
        expect(response.stdout.toString()).toContain("updated: ./imperative-test-cli.schema.json");
        expect(response.stdout.toString()).toContain(globalPath);
        expect(response.stdout.toString()).toContain(`skipped: ${httpSchema}`);
    });
});
