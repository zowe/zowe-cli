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
import * as path from "path";
import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk";
import * as lodash from "lodash";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config set", () => {
    const service = "imperative-test-cli";
    let expectedProjectConfigLocation: string;
    let expectedUserConfigLocation: string;
    let expectedGlobalConfigLocation: string;
    let expectedGlobalUserConfigLocation: string;

    const expectedProjJson = lodash.cloneDeep(expectedProjectConfigObject);
    delete expectedProjJson.$schema;
    expectedProjJson.profiles.secured.properties.info = "(secure value)";
    expectedProjJson.profiles.secured.secure = ["info"];
    expectedProjJson.profiles.project_base.properties.secret = "(secure value)";
    expectedProjJson.profiles.project_base.properties.undefined_type = "(secure value)";
    expectedProjJson.profiles.project_base.secure = ["secret", "undefined_type"];

    const expectedGlobalJson = lodash.cloneDeep(expectedGlobalConfigObject);
    delete expectedGlobalJson.$schema;
    expectedGlobalJson.profiles.secured.properties.info = "(secure value)";
    expectedGlobalJson.profiles.secured.secure = ["info"];
    expectedGlobalJson.profiles.global_base.properties.secret = "(secure value)";
    expectedGlobalJson.profiles.global_base.properties.undefined_type = "(secure value)";
    expectedGlobalJson.profiles.global_base.secure = ["secret", "undefined_type"];

    const expectedProjUserJson = lodash.cloneDeep(expectedProjectUserConfigObject);
    delete expectedProjUserJson.$schema;
    expectedProjUserJson.profiles.secured.properties.info = "(secure value)";
    expectedProjUserJson.profiles.secured.secure = ["info"];
    expectedProjUserJson.profiles.project_base.secure = []; // config-init creates user base profile with an empty secure array

    const expectedGlobalUserJson = lodash.cloneDeep(expectedGlobalUserConfigObject);
    delete expectedGlobalUserJson.$schema;
    expectedGlobalUserJson.profiles.secured.properties.info = "(secure value)";
    expectedGlobalUserJson.profiles.secured.secure = ["info"];
    expectedGlobalUserJson.profiles.global_base.secure = []; // config-init creates user base profile with an empty secure array

    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_set_command"
        });
        expectedGlobalUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.user.json");
        expectedGlobalConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "imperative-test-cli.config.json");
        expectedUserConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.user.json");
        expectedProjectConfigLocation = path.join(TEST_ENVIRONMENT.workingDir, "test", "imperative-test-cli.config.json");
        await keytar.setPassword("imperative-test-cli", "secure_config_props", Buffer.from("{}").toString("base64"));
    });
    afterEach(() => {
        runCliScript(__dirname + "/../__scripts__/delete_configs.sh", TEST_ENVIRONMENT.workingDir,
            ["-rf imperative-test-cli.config.user.json imperative-test-cli.config.json test imperative-test-cli.schema.json"]);
    });
    it("should display the help", () => {
        const response = runCliScript(__dirname + "/../__scripts__/get_help.sh",
            TEST_ENVIRONMENT.workingDir, ["set"]);
        expect(response.output.toString()).toContain(`Create or update a configuration property.`);
    });
    it("should store a property in plain text", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--user-config"]);
        const response = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles.secured.properties.info", "some_fake_information", "--user-config"]);
        const fileContents = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
        const securedValue = await keytar.getPassword(service, "secure_config_props");

        expect(response.stderr.toString()).toEqual("");
        expect(response.status).toEqual(0);
        // Should contain human readable credentials
        expect(fileContents.profiles.secured.secure).toEqual([]);
        expect(fileContents.profiles.secured.properties).toEqual({info: "some_fake_information"});
        expect(securedValue).toEqual(Buffer.from("{}").toString("base64"));
    });
    it("should store a property in plain text, and overwrite an existing environment variable if it is not set", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--user-config"]);
        const response1 = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles.secured.properties.info", "$FAKEINFO", "--user-config"]);
        const fileContents1 = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
        const securedValue1 = await keytar.getPassword(service, "secure_config_props");

        expect(response1.stderr.toString()).toEqual("");
        expect(response1.status).toEqual(0);
        // Should contain human readable credentials
        expect(fileContents1.profiles.secured.secure).toEqual([]);
        expect(fileContents1.profiles.secured.properties).toEqual({info: "$FAKEINFO"});
        expect(securedValue1).toEqual(Buffer.from("{}").toString("base64"));

        const oldEnvironment = process.env["FAKEINFO"];
        delete process.env["FAKEINFO"];
        const response2 = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles.secured.properties.info", "some_fake_information", "--user-config"]);
        const fileContents2 = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
        const securedValue2 = await keytar.getPassword(service, "secure_config_props");

        process.env["FAKEINFO"] = oldEnvironment;
        expect(response2.stderr.toString()).not.toContain("managed by environment variables");
        expect(response2.status).toEqual(0);
        // Should contain human readable credentials
        expect(fileContents2.profiles.secured.secure).toEqual([]);
        expect(fileContents2.profiles.secured.properties).toEqual({info: "some_fake_information"});
        expect(securedValue2).toEqual(Buffer.from("{}").toString("base64"));
    });
    it("should store a property in plain text, and fail to overwrite an existing environment variable", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--user-config"]);
        const response1 = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles.secured.properties.info", "$FAKEINFO", "--user-config"]);
        const fileContents1 = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
        const securedValue1 = await keytar.getPassword(service, "secure_config_props");

        expect(response1.stderr.toString()).toEqual("");
        expect(response1.status).toEqual(0);
        // Should contain human readable credentials
        expect(fileContents1.profiles.secured.secure).toEqual([]);
        expect(fileContents1.profiles.secured.properties).toEqual({info: "$FAKEINFO"});
        expect(securedValue1).toEqual(Buffer.from("{}").toString("base64"));

        const oldEnvironment = process.env["FAKEINFO"];
        process.env["FAKEINFO"] = "fakeinformation";
        const response2 = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles.secured.properties.info", "some_fake_information", "--user-config"]);
        const fileContents2 = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
        const securedValue2 = await keytar.getPassword(service, "secure_config_props");

        process.env["FAKEINFO"] = oldEnvironment;
        expect(response2.stderr.toString()).toContain("managed by environment variables");
        expect(response2.status).toEqual(1);
        // Should contain human readable credentials
        expect(fileContents2.profiles.secured.secure).toEqual([]);
        expect(fileContents2.profiles.secured.properties).toEqual({info: "$FAKEINFO"});
        expect(securedValue2).toEqual(Buffer.from("{}").toString("base64"));
    });
    it("should prompt for and store a property in plain text", async () => {
        runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--user-config"]);
        const response = runCliScript(__dirname + "/__scripts__/set_prompt.sh", TEST_ENVIRONMENT.workingDir,
            ["profiles.secured.properties.info", "--user-config"]);
        const fileContents = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
        const securedValue = await keytar.getPassword(service, "secure_config_props");

        expect(response.stderr.toString()).toEqual("");
        expect(response.stdout.toString()).toContain("profiles.secured.properties.info");
        expect(response.status).toEqual(0);
        // Should contain human readable credentials
        expect(fileContents.profiles.secured.secure).toEqual([]);
        expect(fileContents.profiles.secured.properties).toEqual({info: "some_fake_information_prompted"});
        expect(securedValue).toEqual(Buffer.from("{}").toString("base64"));
    });
    describe("secure", () => {
        afterEach(async () => {
            await keytar.deletePassword(service, "secure_config_props");
        });
        it("should make the info property secure in the project config", async () => {
            runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, [""]);
            const response = runCliScript(__dirname + "/__scripts__/set_secure.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", "some_fake_information", ""]);
            const fileContents = JSON.parse(fs.readFileSync(expectedProjectConfigLocation).toString());
            const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
            const configJson = JSON.parse(config);
            const securedValue = await keytar.getPassword(service, "secure_config_props");
            const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
            const expectedSecuredValueJson: any = {};
            expectedSecuredValueJson[expectedProjectConfigLocation] = {
                "profiles.project_base.properties.secret": "fakeValue",
                "profiles.project_base.properties.undefined_type": "undefined_value",
                "profiles.secured.properties.info": "some_fake_information"
            };

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            expect(configJson.data).toEqual(expectedProjJson);
            // Should not contain human readable credentials
            expect(fileContents.profiles.secured.secure).toEqual(["info"]);
            expect(fileContents.profiles.secured.properties).not.toEqual({info: "some_fake_information"});
            // Check the securely stored JSON
            expect(securedValueJson).toEqual(expectedSecuredValueJson);
        });
        it("should make the info property secure in the project user config", async () => {
            runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--user-config"]);
            const response = runCliScript(__dirname + "/__scripts__/set_secure.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", "some_fake_information", "--user-config"]);
            const fileContents = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
            const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
            const configJson = JSON.parse(config);
            const securedValue = await keytar.getPassword(service, "secure_config_props");
            const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
            const expectedSecuredValueJson: any = {};
            expectedSecuredValueJson[expectedUserConfigLocation] = {
                "profiles.secured.properties.info": "some_fake_information"
            };

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            expect(configJson.data).toEqual(expectedProjUserJson);
            // Should not contain human readable credentials
            expect(fileContents.profiles.secured.secure).toEqual(["info"]);
            expect(fileContents.profiles.secured.properties).not.toEqual({info: "some_fake_information"});
            // Check the securely stored JSON
            expect(securedValueJson).toEqual(expectedSecuredValueJson);
        });
        it("should make the info property secure in the global config", async () => {
            runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--global-config"]);
            const response = runCliScript(__dirname + "/__scripts__/set_secure.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", "some_fake_information", "--global-config"]);
            const fileContents = JSON.parse(fs.readFileSync(expectedGlobalConfigLocation).toString());
            const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
            const configJson = JSON.parse(config);
            const securedValue = await keytar.getPassword(service, "secure_config_props");
            const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
            const expectedSecuredValueJson: any = {};
            expectedSecuredValueJson[expectedGlobalConfigLocation] = {
                "profiles.global_base.properties.secret": "fakeValue",
                "profiles.global_base.properties.undefined_type": "undefined_value",
                "profiles.secured.properties.info": "some_fake_information"
            };

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            expect(configJson.data).toEqual(expectedGlobalJson);
            // Should not contain human readable credentials
            expect(fileContents.profiles.secured.secure).toEqual(["info"]);
            expect(fileContents.profiles.secured.properties).not.toEqual({info: "some_fake_information"});
            // Check the securely stored JSON
            expect(securedValueJson).toEqual(expectedSecuredValueJson);
        });
        it("should make the info property secure in the global user config", async () => {
            runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--global-config --user-config"]);
            const response = runCliScript(__dirname + "/__scripts__/set_secure.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", "some_fake_information", "--global-config --user-config"]);
            const fileContents = JSON.parse(fs.readFileSync(expectedGlobalUserConfigLocation).toString());
            const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
            const configJson = JSON.parse(config);
            const securedValue = await keytar.getPassword(service, "secure_config_props");
            const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
            const expectedSecuredValueJson: any = {};
            expectedSecuredValueJson[expectedGlobalUserConfigLocation] = {
                "profiles.secured.properties.info": "some_fake_information"
            };

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            expect(configJson.data).toEqual(expectedGlobalUserJson);
            // Should not contain human readable credentials
            expect(fileContents.profiles.secured.secure).toEqual(["info"]);
            expect(fileContents.profiles.secured.properties).not.toEqual({info: "some_fake_information"});
            // Check the securely stored JSON
            expect(securedValueJson).toEqual(expectedSecuredValueJson);
        });
        it("should supply secured JSON to the info property in the global user config", async () => {
            runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--global-config --user-config"]);
            const response = runCliScript(__dirname + "/__scripts__/set_secure.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", '{"data":"fake"}', "--global-config --user-config --json"]);
            const fileContents = JSON.parse(fs.readFileSync(expectedGlobalUserConfigLocation).toString());
            const config = runCliScript(__dirname + "/../list/__scripts__/list_config.sh", TEST_ENVIRONMENT.workingDir, ["--rfj"]).stdout.toString();
            const configJson = JSON.parse(config);
            const securedValue = await keytar.getPassword(service, "secure_config_props");
            const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
            const expectedSecuredValueJson: any = {};
            expectedSecuredValueJson[expectedGlobalUserConfigLocation] = {
                "profiles.secured.properties.info": {data: "fake"}
            };

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            expect(configJson.data).toEqual(expectedGlobalUserJson);
            // Should not contain human readable credentials
            expect(fileContents.profiles.secured.secure).toEqual(["info"]);
            expect(fileContents.profiles.secured.properties).not.toEqual({info: {data: "fake"}});
            // Check the securely stored JSON
            expect(securedValueJson).toEqual(expectedSecuredValueJson);
        });
        it("should fail to parse improperly formatted JSON objects", async () => {
            runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, ["--global-config --user-config"]);
            const response = runCliScript(__dirname + "/__scripts__/set_secure.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", "{'data':'fake'}", "--global-config --user-config --json"]);

            expect(response.stderr.toString()).toContain("could not parse JSON value: ");
            expect(response.status).not.toEqual(0);
        });
        it("should store property securely without --secure flag if found in secure array", async () => {
            runCliScript(__dirname + "/../init/__scripts__/init_config_prompt.sh", TEST_ENVIRONMENT.workingDir, [""]);
            const response = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.project_base.properties.secret", "area51", ""]);
            const fileContents = JSON.parse(fs.readFileSync(expectedProjectConfigLocation).toString());
            const securedValue = await keytar.getPassword(service, "secure_config_props");
            const securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());
            const expectedSecuredValueJson: any = {};
            expectedSecuredValueJson[expectedProjectConfigLocation] = {
                "profiles.project_base.properties.secret": "area51",
                "profiles.project_base.properties.undefined_type": "undefined_value"
            };

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            // Should not contain human readable credentials
            expect(fileContents.profiles.project_base.secure).toEqual(["secret", "undefined_type"]);
            expect(fileContents.profiles.project_base.properties).toEqual({});
            // Check the securely stored JSON
            expect(securedValueJson).toEqual(expectedSecuredValueJson);
        });
        it("should toggle the security of a property if requested", async () => {
            runCliScript(__dirname + "/../init/__scripts__/init_config.sh", TEST_ENVIRONMENT.workingDir, ["--user-config"]);
            const expectedSecuredValueJson: any = {};
            expectedSecuredValueJson[expectedUserConfigLocation] = {
                "profiles.secured.properties.info": "some_fake_information"
            };

            // First store property securely
            let response = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", "some_fake_information", "--user-config --secure"]);
            let fileContents = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
            let securedValue = await keytar.getPassword(service, "secure_config_props");
            let securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            expect(fileContents.profiles.secured.secure).toEqual(["info"]);
            expect(fileContents.profiles.secured.properties).not.toEqual({info: "some_fake_information"});
            expect(securedValueJson).toEqual(expectedSecuredValueJson);

            // Now store property in plain text
            response = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", "some_fake_information", "--user-config --secure false"]);
            fileContents = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
            securedValue = await keytar.getPassword(service, "secure_config_props");
            securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            expect(fileContents.profiles.secured.secure.length).toBe(0);
            expect(fileContents.profiles.secured.properties).toEqual({info: "some_fake_information"});
            expect(securedValueJson).toEqual({});

            // Finally store property securely again
            response = runCliScript(__dirname + "/__scripts__/set.sh", TEST_ENVIRONMENT.workingDir,
                ["profiles.secured.properties.info", "some_fake_information", "--user-config --secure"]);
            fileContents = JSON.parse(fs.readFileSync(expectedUserConfigLocation).toString());
            securedValue = await keytar.getPassword(service, "secure_config_props");
            securedValueJson = JSON.parse(Buffer.from(securedValue, "base64").toString());

            expect(response.stderr.toString()).toEqual("");
            expect(response.status).toEqual(0);
            expect(fileContents.profiles.secured.secure).toEqual(["info"]);
            expect(fileContents.profiles.secured.properties).not.toEqual({info: "some_fake_information"});
            expect(securedValueJson).toEqual(expectedSecuredValueJson);
        });
    });
});
