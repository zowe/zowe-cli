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
import * as glob from "glob";
import * as jsonfile from "jsonfile";
import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk";
import { IConfig } from "../../../../../../../../packages";
import { IConfigSecureProperties } from "../../../../../../../../packages/config/src/doc/IConfigSecure";
import { runCliScript } from "../../../../../../../src/TestUtil";
import { ITestEnvironment } from "../../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../__src__/environment/SetupTestEnvironment";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
describe("cmd-cli config auto-init", () => {
    async function loadSecureProp(profileName: string): Promise<string> {
        const credSvc = "imperative-test-cli";
        const credAcct = "secure_config_props";

        const securedValue = await keytar.getPassword(credSvc, credAcct);
        if (securedValue == null) {
            return `${credSvc}/${credAcct} does not exist in cred store`;
        }

        const securedValueJson: IConfigSecureProperties = JSON.parse(
            Buffer.from(securedValue, "base64").toString()
        );
        if (securedValueJson == null) {
            return `Value of ${credSvc}/${credAcct} parsed to JSON gives null`;
        }

        const secValArray = Object.values(securedValueJson);
        if (secValArray.length < 1) {
            return `${credSvc}/${credAcct} contained no secure values`;
        }

        const tokenValue = secValArray[0][`profiles.${profileName}.properties.tokenValue`];
        if (tokenValue == null) {
            return `${credSvc}/${credAcct} contains no token value`;
        }

        return tokenValue;
    }

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_config_auto-init"
        });
        fs.mkdirSync(TEST_ENVIRONMENT.workingDir + "/testDir");
    });

    afterEach(async () => {
        const configFiles = [
            "imperative-test-cli.config.json",
            "imperative-test-cli.config.user.json",
            "imperative-test-cli.schema.json"
        ];
        runCliScript(__dirname + "/__scripts__/delete.sh", TEST_ENVIRONMENT.workingDir + "/testDir", configFiles);
        runCliScript(__dirname + "/__scripts__/delete.sh", TEST_ENVIRONMENT.workingDir, configFiles);
        await keytar.deletePassword("imperative-test-cli", "secure_config_props");
    });

    it("should initialize project config", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--host example.com", "--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("**auto-init changes**");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" }))
            .toEqual(["imperative-test-cli.config.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/testDir/imperative-test-cli.config.json");
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.tokenValue).toBeUndefined();
        expect(configJson.profiles.base_fruit.secure).toEqual(["tokenValue"]);
        expect(await loadSecureProp("base_fruit")).toBe("admin:123456@fakeToken");
    });

    it("should initialize project user config", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--user-config", "--host example.com", "--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("**auto-init changes**");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" }))
            .toEqual(["imperative-test-cli.config.user.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/testDir/imperative-test-cli.config.user.json");
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.tokenValue).toBeUndefined();
        expect(configJson.profiles.base_fruit.secure).toEqual(["tokenValue"]);
        expect(await loadSecureProp("base_fruit")).toBe("admin:123456@fakeToken");
    });

    it("should initialize global config", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--global-config",
                "--host example.com", "--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("**auto-init changes**");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir }))
            .toEqual(["imperative-test-cli.config.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/imperative-test-cli.config.json");
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.tokenValue).toBeUndefined();
        expect(configJson.profiles.base_fruit.secure).toEqual(["tokenValue"]);
        expect(await loadSecureProp("base_fruit")).toBe("admin:123456@fakeToken");
    });

    it("should initialize global user config", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--global-config", "--user-config",
                "--host example.com", "--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toContain("**auto-init changes**");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir }))
            .toEqual(["imperative-test-cli.config.user.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/imperative-test-cli.config.user.json");
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.tokenValue).toBeUndefined();
        expect(configJson.profiles.base_fruit.secure).toEqual(["tokenValue"]);
        expect(await loadSecureProp("base_fruit")).toBe("admin:123456@fakeToken");
    });

    it("should prompt for missing host", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config_prompt.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" }))
            .toEqual(["imperative-test-cli.config.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/testDir/imperative-test-cli.config.json");
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.host).toBe("fakeInput");
    });

    it("should prompt for missing user", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config_prompt.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--host example.com", "--port 443", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" }))
            .toEqual(["imperative-test-cli.config.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/testDir/imperative-test-cli.config.json");
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.tokenValue).toBeUndefined();
        expect(configJson.profiles.base_fruit.secure).toEqual(["tokenValue"]);
        expect(await loadSecureProp("base_fruit")).toBe("fakeInput:123456@fakeToken");
    });

    it("should authenticate with token if provided", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--host example.com", "--port 443",
                "--tokenType apimlAuthenticationToken", "--tokenValue null"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" }))
            .toEqual(["imperative-test-cli.config.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/testDir/imperative-test-cli.config.json");
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.tokenValue).toBeUndefined();
        expect(configJson.profiles.base_fruit.secure).toEqual(["tokenValue"]);
        expect(await loadSecureProp("base_fruit")).toBe("null");
    });

    it("should not update file on disk in dry-run mode", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--dry-run",
                "--host example.com", "--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).not.toContain("**auto-init changes**");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" })).toEqual([]);
        expect(await keytar.getPassword("imperative-test-cli", "secure_config_props")).toBeNull();
    });

    it("should merge with existing config", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config_merge.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--host example.com", "--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" }))
            .toEqual(["imperative-test-cli.config.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/testDir/imperative-test-cli.config.json");
        expect(configJson.profiles.base).toBeDefined();
        expect(configJson.profiles.base.properties.info).toBe("origConfig");
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.tokenValue).toBeUndefined();
        expect(configJson.profiles.base_fruit.secure).toEqual(["tokenValue"]);
        expect(await loadSecureProp("base_fruit")).toBe("admin:123456@fakeToken");
    });

    it("should not overwrite file without confirmation", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config_merge.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--overwrite",
                "--host example.com", "--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" }))
            .toEqual(["imperative-test-cli.config.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/testDir/imperative-test-cli.config.json");
        expect(configJson.profiles.base).toBeDefined();
        expect(configJson.profiles.base.properties.info).toBe("origConfig");
        expect(configJson.profiles.base_fruit).toBeUndefined();
    });

    it("should overwrite file when confirmation is given", async () => {
        const response = runCliScript(__dirname + "/__scripts__/auto-init_config_merge.sh",
            TEST_ENVIRONMENT.workingDir + "/testDir", ["--overwrite", "--for-sure",
                "--host example.com", "--port 443", "--user admin", "--password 123456"]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        expect(glob.sync("*.json", { cwd: TEST_ENVIRONMENT.workingDir + "/testDir" }))
            .toEqual(["imperative-test-cli.config.json", "imperative-test-cli.schema.json"]);
        const configJson: IConfig = jsonfile.readFileSync(TEST_ENVIRONMENT.workingDir + "/testDir/imperative-test-cli.config.json");
        expect(configJson.profiles.base).toBeUndefined();
        expect(configJson.profiles.base_fruit).toBeDefined();
        expect(configJson.profiles.base_fruit.properties.tokenValue).toBeUndefined();
        expect(configJson.profiles.base_fruit.secure).toEqual(["tokenValue"]);
        expect(await loadSecureProp("base_fruit")).toBe("admin:123456@fakeToken");
    });
});
