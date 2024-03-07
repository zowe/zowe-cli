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
import * as fsExtra from "fs-extra";
import * as path from "path";
import { keyring } from "@zowe/secrets-for-zowe-sdk";
import { ITestEnvironment } from "../../../../../../../__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../../__src__/environment/SetupTestEnvironment";
import { runCliScript } from "../../../../../../../src/TestUtil";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

describe("imperative-test-cli config convert-profiles", () => {
    let configJsonPath: string;

    // Create the test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "IMPERATIVE_TEST_CLI_CLI_HOME",
            testName: "imperative_test_cli_test_config_convert_profiles_command"
        });
        configJsonPath = path.join(process.env.IMPERATIVE_TEST_CLI_CLI_HOME, "imperative-test-cli.config.json");
    });

    beforeEach(() => {
        fsExtra.copySync(__dirname + "/../../config/__resources__/profiles_secured_and_base", TEST_ENVIRONMENT.workingDir + "/profiles");
    });

    afterEach(() => {
        const response = runCliScript(__dirname + "/__scripts__/delete_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stdout.toString()).toEqual("");
        expect(response.stderr.toString()).toEqual("");

        if (fs.existsSync(configJsonPath)) {
            fs.unlinkSync(configJsonPath);
        }
        fsExtra.removeSync(TEST_ENVIRONMENT.workingDir + "/profiles-old");
    });

    describe("success scenarios", () => {
        it("should display the help", () => {
            const response = runCliScript(__dirname + "/../__scripts__/get_help.sh", TEST_ENVIRONMENT.workingDir, ["convert-profiles"]);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Convert v1 profiles to a global imperative-test-cli.config.json file.");
            expect(response.stderr.toString()).toEqual("");
        });

        it("should convert profiles to team config", async () => {
            // set a value in the secure vault that would have been created for the V1 secured profile
            await keyring.setPassword("imperative-test-cli", "secured_test_secret",
                Buffer.from('"world"').toString("base64")
            );

            const response = runCliScript(__dirname + "/__scripts__/convert_profiles.sh", TEST_ENVIRONMENT.workingDir, ["y"]);
            expect(response.stderr.toString()).toEqual("");
            expect(response.stdout.toString()).toContain("Detected 2 old V1 profile(s) to convert to a current Zowe client configuration");
            expect(response.stdout.toString()).toContain("Your new profiles have been saved");
            expect(response.stdout.toString()).toContain("Your old V1 profiles have been moved");
            expect(response.status).toBe(0);

            // Check contents of config JSON
            const configJson = JSON.parse(fs.readFileSync(configJsonPath, "utf-8"));
            expect(configJson).toMatchObject({
                profiles: {
                    secured_test: {
                        type: "secured",
                        properties: {
                            info: "hello"
                        },
                        secure: ["secret"]
                    },
                    base_test: {
                        type: "base",
                        properties: {
                            host: "example.com"
                        },
                        secure: []
                    },
                },
                defaults: {
                    secured: "secured_test",
                    base: "base_test"
                },
                autoStore: true
            });

            // Check secure credentials stored in vault
            const securedValue = await keyring.getPassword("imperative-test-cli", "secure_config_props");
            const secureConfigProps = JSON.parse(Buffer.from(securedValue, "base64").toString());
            expect(secureConfigProps).toMatchObject({
                [configJsonPath]: {
                    "profiles.secured_test.properties.secret": "world"
                }
            });

            // Ensure that profiles directory was renamed
            const cliHomeDirContents = fs.readdirSync(process.env.IMPERATIVE_TEST_CLI_CLI_HOME);
            expect(cliHomeDirContents.includes("profiles")).toBe(false);
            expect(cliHomeDirContents.includes("profiles-old")).toBe(true);
        });
    });

    it("should convert v1 profile property names to v2 names", async () => {
        // we don't want the profiles created by beforeEach(). We only want an old profile.
        let response = runCliScript(__dirname + "/__scripts__/delete_profiles.sh", TEST_ENVIRONMENT.workingDir);
        expect(response.stdout.toString()).toEqual("");
        expect(response.stderr.toString()).toEqual("");

        fsExtra.copySync(__dirname + "/../../config/__resources__/profiles_with_v1_names", TEST_ENVIRONMENT.workingDir + "/profiles");

        response = runCliScript(__dirname + "/__scripts__/convert_profiles.sh", TEST_ENVIRONMENT.workingDir, ["y"]);
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Detected 1 old V1 profile(s) to convert to a current Zowe client configuration.");
        expect(response.stdout.toString()).toContain("Your new profiles have been saved");
        expect(response.stdout.toString()).toContain("Your old V1 profiles have been moved");
        expect(response.stderr.toString()).toEqual("");

        // Check contents of config JSON
        const configJson = JSON.parse(fs.readFileSync(configJsonPath, "utf-8"));
        expect(configJson).toMatchObject({
            profiles: {
                v1profile_myv1profile: {
                    type: "v1profile",
                    properties: {
                        host: "convert hostname to host",
                        user: "convert username to user",
                        password: "convert pass to password"
                    },
                }
            },
            defaults: {
                v1profile: "v1profile_myv1profile"
            },
            autoStore: true
        });

        // Ensure that profiles directory was renamed
        const cliHomeDirContents = fs.readdirSync(process.env.IMPERATIVE_TEST_CLI_CLI_HOME);
        expect(cliHomeDirContents.includes("profiles")).toBe(false);
        expect(cliHomeDirContents.includes("profiles-old")).toBe(true);
    });

    describe("failure scenarios", () => {
        it("should not convert profiles if prompt is rejected", () => {
            const response = runCliScript(__dirname + "/__scripts__/convert_profiles.sh", TEST_ENVIRONMENT.workingDir, ["n"]);
            expect(response.stderr.toString()).toEqual("");
            expect(response.stdout.toString()).toContain("Detected 2 old V1 profile(s) to convert to a current Zowe client configuration");
            expect(response.stdout.toString()).not.toContain("Your new profiles have been saved");
            expect(response.stdout.toString()).not.toContain("Your old V1 profiles have been moved");
            expect(response.status).toBe(0);
            expect(fs.existsSync(configJsonPath)).toBe(false);
        });
        it("should not delete profiles if prompt is rejected", () => {
            // delete profiles previously created, but leave the profile type definitions
            let response = runCliScript(__dirname + "/__scripts__/delete_profiles.sh", TEST_ENVIRONMENT.workingDir);
            expect(response.stderr.toString()).toEqual("");
            expect(response.stdout.toString()).toEqual("");

            response = runCliScript(__dirname + "/__scripts__/convert_profiles_delete.sh", TEST_ENVIRONMENT.workingDir, ["n"]);
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Found no old V1 profiles to convert to a current Zowe client configuration");
            expect(response.stdout.toString()).toContain("Are you sure you want to delete your v1 profiles?");
            expect(response.stdout.toString()).not.toContain("Your new profiles have been saved");
            expect(response.stdout.toString()).not.toContain("Your old profiles have been moved");
            expect(response.stdout.toString()).not.toContain("Deleting the profiles directory");
            expect(response.stderr.toString()).not.toContain("Failed to delete the profiles directory");
            expect(response.stderr.toString()).not.toContain("Deleting secure value for");
            expect(response.stderr.toString()).not.toContain("Keytar or the credential vault are unavailable");
            expect(fs.existsSync(configJsonPath)).toBe(false);
        });
    });
});
