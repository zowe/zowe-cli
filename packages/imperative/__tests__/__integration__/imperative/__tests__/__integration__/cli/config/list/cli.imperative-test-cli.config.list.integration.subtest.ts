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
import * as path from "path";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config list", () => {
    let expectedGlobalConfigLocation: string;
    let expectedGlobalUserConfigLocation: string;
    let expectedProjectConfigLocation: string;
    let expectedProjectUserConfigLocation: string;

    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_list_command"
        });
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--user-config --prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--global-config --prompt false"]);
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir,
            ["--user-config --global-config --prompt false"]);
        expectedGlobalUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.user.json");
        expectedGlobalConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json");
        expectedProjectUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.user.json");
        expectedProjectConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.json");
    });
    afterAll(() => {
        runCliScript(__dirname + "/../__scripts__/delete_configs.sh", TEST_ENVIRONMENT.workingDir,
            ["-rf imperative-test-cli.config.user.json imperative-test-cli.config.json test imperative-test-cli.schema.json"]);
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/../__scripts__/get_help.sh",
            TEST_ENVIRONMENT.workingDir, ["list"]);
        expect(response.stdout.toString()).toContain(`List config properties`);
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should list the configuration", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("secured: secured");
        expect(response.stdout.toString()).toContain("type:       secured");
        expect(response.stdout.toString()).toContain("defaults:");
        expect(response.stdout.toString()).toContain("profiles:");
        expect(response.stdout.toString()).toContain("secure:");
        expect(response.stdout.toString()).toContain("(empty array)");
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should list the configuration in RFJ", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]);
        const parsedResponse = JSON.parse(response.stdout.toString());
        const expectedResponse = {
            data: {
                profiles: {
                    project_base: {
                        type: "base",
                        properties: {},
                        secure: ["secret", "undefined"]
                    },
                    global_base: {
                        properties: {},
                        type: "base",
                        secure: ["secret", "undefined"]
                    },
                    secured: {
                        type: "secured",
                        properties: {
                            info: ""
                        },
                        secure: [] as string[]
                    }
                },
                defaults: {
                    secured: "secured",
                    base: "project_base"
                },
                autoStore: true
            }
        };
        expect(parsedResponse.success).toEqual(true);
        expect(parsedResponse.stderr).toEqual("");
        expect(parsedResponse.exitCode).toEqual(0);
        expect(parsedResponse.data).toEqual(expectedResponse.data);
    });
    it("should list the configurations based on location", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--locations"]);
        expect(response.stdout.toString()).toContain(expectedProjectConfigLocation);
        expect(response.stdout.toString()).toContain(expectedProjectUserConfigLocation);
        expect(response.stdout.toString()).toContain(expectedGlobalConfigLocation);
        expect(response.stdout.toString()).toContain(expectedGlobalUserConfigLocation);
        expect(response.stdout.toString()).toContain("defaults:");
        expect(response.stdout.toString()).toContain("profiles:");
        expect(response.stdout.toString()).toContain("secure:");
        expect(response.stdout.toString()).toContain("type:       secured");
        expect(response.stdout.toString()).toContain("properties:");
        expect(response.stdout.toString()).toContain("secured: secured");
        expect(response.stdout.toString()).toContain("$schema:   ./imperative-test-cli.schema.json");
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should list the configurations based on location in RFJ", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--locations --rfj"]);
        const parsedResponse = JSON.parse(response.stdout.toString());

        const expectedResponse = {
            data: {} as any
        };

        // config-init of a user config creates no entries in the properties object or in the secure array.
        // So, empty the secure arrays in the user configs.
        expectedResponse.data[expectedProjectUserConfigLocation] = expectedProjectUserConfigObject;
        expectedResponse.data[expectedProjectUserConfigLocation].profiles.project_base.secure = [];

        expectedResponse.data[expectedGlobalUserConfigLocation] = expectedGlobalUserConfigObject;
        expectedResponse.data[expectedGlobalUserConfigLocation].profiles.global_base.secure = [];

        expectedResponse.data[expectedProjectConfigLocation] = expectedProjectConfigObject;
        expectedResponse.data[expectedGlobalConfigLocation] = expectedGlobalConfigObject;

        expect(parsedResponse.success).toEqual(true);
        expect(parsedResponse.stderr).toEqual("");
        expect(parsedResponse.exitCode).toEqual(0);
        expect(parsedResponse.data).toEqual(expectedResponse.data);
    });
    it("should list the root level property names only 1", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--root"]);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("defaults");
        expect(response.stdout.toString()).toContain("profiles");
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should list the root level property names only 2", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--name-only"]);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("defaults");
        expect(response.stdout.toString()).toContain("profiles");
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should get a list of config file paths 1", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--locations --root"]);
        expect(response.stdout.toString()).toContain(expectedProjectConfigLocation);
        expect(response.stdout.toString()).toContain(expectedProjectUserConfigLocation);
        expect(response.stdout.toString()).toContain(expectedGlobalConfigLocation);
        expect(response.stdout.toString()).toContain(expectedGlobalUserConfigLocation);
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should get a list of config file paths 2", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--locations --name-only"]);
        expect(response.stdout.toString()).toContain(expectedProjectConfigLocation);
        expect(response.stdout.toString()).toContain(expectedProjectUserConfigLocation);
        expect(response.stdout.toString()).toContain(expectedGlobalConfigLocation);
        expect(response.stdout.toString()).toContain(expectedGlobalUserConfigLocation);
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should list the profiles configuration property", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["profiles"]);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("secured:");
        expect(response.stdout.toString()).toContain("type:       secured");
        expect(response.stdout.toString()).toContain("base:");
        expect(response.stdout.toString()).toContain("type:       base");
        expect(response.stdout.toString()).toContain("properties:");
        expect(response.stdout.toString()).toContain("secure:");
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should list the defaults configuration property", () => {
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["defaults"]);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("secured: secured");
        expect(response.stdout.toString()).toContain("base:    project_base");
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
    it("should list the configuration without showing secure values", () => {
        runCliScript(__dirname + "/../set/__scripts__/set_secure.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles.project_base.properties.secret", "area51"]
        );
        const response = runCliScript(__dirname + "/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, [""]);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("secured: secured");
        expect(response.stdout.toString()).toContain("type:       secured");
        expect(response.stdout.toString()).toContain("defaults:");
        expect(response.stdout.toString()).toContain("profiles:");
        expect(response.stdout.toString()).toContain("secure:");
        expect(response.stdout.toString()).toContain("(empty array)");
        expect(response.stdout.toString()).toContain("secret: (secure value)");
        expect(response.stderr.toString()).toEqual("");
        expect(response.error).toBeFalsy();
    });
});
