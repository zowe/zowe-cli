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

import * as T from "../../../TestUtil";
import * as path from "path";
import * as fs from "fs";
import { IImperativeConfig } from "../../../../../src/imperative";
import { keyring } from "@zowe/secrets-for-zowe-sdk";
import { CliProfileManager } from "../../../../../src/cmd";
import { ProfileIO } from "../../../../../src/profiles/utils";
import { IProfile } from "../../../../../src/profiles/doc/definition";

describe("Cli Profile Manager", () => {
    const cliBin = path.join(__dirname, "../test_cli/TestCLI.ts");
    const config: IImperativeConfig = require(path.join(__dirname, "../test_cli/TestConfiguration"));
    const homeDir: string = config.defaultHome;
    const testProfileType = "username-password";
    const username: string = "username";
    const password: number = 0;
    const account: string = "account123";
    const secured: string = "secured";

    beforeAll(async () => {
        // ensure the CLI home directory exists before running our copy_profile script
        if (!fs.existsSync(homeDir)) {
            fs.mkdirSync(homeDir);
        }

        // copy existing profiles into test directory
        const response = T.runCliScript(path.join(__dirname, "__scripts__/copy_profiles_cli_prof_mgr_creds.sh"), homeDir);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // store desired secure properties into the credential vault
        await keyring.setPassword("example_with_profiles", "username-password_profile-name_username",
            Buffer.from(`"${username}"`).toString("base64")
        );
        await keyring.setPassword("example_with_profiles", "username-password_profile-name_password",
            Buffer.from(`${password}`).toString("base64")
        );
        await keyring.setPassword("example_with_profiles", "username-password_profile-name_account",
            Buffer.from(`"${account}"`).toString("base64")
        );
        await keyring.setPassword("example_with_profiles",
            "username-password_profile-name_myParent_securedProperty_mySecuredChild",
            Buffer.from(`"${secured}"`).toString("base64")
        );
    });

    afterAll(async () => {
        // delete secure properties from the credential vault
        await keyring.deletePassword("example_with_profiles", "username-password_profile-name_username");
        await keyring.deletePassword("example_with_profiles", "username-password_profile-name_password");
        await keyring.deletePassword("example_with_profiles", "username-password_profile-name_account");
        await keyring.deletePassword("example_with_profiles",
            "username-password_profile-name_myParent_securedProperty_mySecuredChild"
        );

        // delete the CLI_HOME directory
        T.rimraf(homeDir);
    });

    describe("Default Credential Management", () => {

        describe("Generic Success Scenarios", () => {

            it("should load a profile with saved credentials", () => {
                const cmd = `display-profile`;
                const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toEqual("");
                expect(JSON.parse(result.stdout)).toEqual({
                    myParent: {
                        insecuredProperty: {myInSecuredChild: "insecured"},
                        securedProperty: {mySecuredChild: "secured"}
                    },
                    account, username, password});
            });
        });

        describe("Generic Failure Scenarios", () => {
            const createdName = "profile-name";
            const changedName = "profile-name-changed";

            const profilePath = path.join(homeDir, "profiles", testProfileType);
            const createdPath = path.join(profilePath, createdName + ".yaml");
            const changedPath = path.join(profilePath, changedName + ".yaml");

            it("should fail if the Credential Manager is unable to find the profile", () => {
                // change the name of the profile so that we can break it
                fs.renameSync(createdPath, changedPath);

                const cmd = `display-profile`;
                const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                // put the profile back for cleanup
                fs.renameSync(changedPath, createdPath);

                expect(result.stderr).toContain(
                    `Your default profile named ${createdName} does not exist for type ${testProfileType}.`
                );
            });

            it("should fail if the Credential Manager is unable to retrieve a password", () => {
                // change the name of the profile so that we can break it
                fs.renameSync(createdPath, changedPath);

                const cmd = `display-profile --${testProfileType}-profile ${changedName}`;
                const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                // put the profile back for cleanup
                fs.renameSync(changedPath, createdPath);

                expect(T.stripNewLines(result.stderr)).toContain(
                    `Unable to load the secure field "${username}" associated with ` +
                    `the profile "${changedName}" of type "${testProfileType}".`
                );
                expect(T.stripNewLines(result.stderr)).toContain(
                    "Could not find an entry in the credential vault for the following:"
                );
                expect(T.stripNewLines(result.stderr)).toContain("Service = example_with_profiles");
                expect(T.stripNewLines(result.stderr)).toContain("Account = username-password_profile-name-changed_username");
            });
        });

        describe("Missing secrets SDK installation", () => {
            const secretsSdk = path.join(__dirname, "../../../../../../../node_modules/@zowe/secrets-for-zowe-sdk");
            const renamedSecretsSdk = path.join(__dirname, "../../../../../../../node_modules/@zowe/zowe-for-secrets-sdk");

            const renameSecretsSdk = () => {
                if (fs.existsSync(secretsSdk)) {
                    fs.renameSync(secretsSdk, renamedSecretsSdk);
                }
            };

            // Make sure that the secrets SDK folder is reset to the original name.
            afterEach(() => {
                if (fs.existsSync(renamedSecretsSdk)) {
                    fs.renameSync(renamedSecretsSdk, secretsSdk);
                }
            });

            it("should fail if secrets SDK is not loaded on using profile handler", () => {
                renameSecretsSdk();

                const cmd = `display-profile`;
                const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(result.stderr).toContain("Command Preparation Failed");
                expect(result.stderr).toContain(
                    `Unable to load the secure field "${username}" associated with ` +
                    `the profile "profile-name" of type "${testProfileType}".`
                );
                expect(T.stripNewLines(result.stderr)).toContain(
                    "Failed to load Keytar module: Cannot find module '@zowe/secrets-for-zowe-sdk"
                );
            });

            it("should be able to issue command", () => {
                renameSecretsSdk();

                const cmd = `display-no-secrets`;
                const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toBe("");
                expect(result.stdout).toContain("This handler does not require secrets");
            });
        });
    });

    describe("Custom Credential Management - Absolute String", () => {

        it("should use an overwritten credential manager - Absolute String", () => {
            const cliBin = path.join(__dirname, "../test_cli/TestCustomCredString.ts");
            const cmd = `display-profile`;
            const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toBe("");
            expect(result.stdout).toContain('"username":"custom"');
            expect(result.stdout).toContain('"password":"custom"');
        });
    });

    describe("Custom Credential Management - Class", () => {

        it("should use an overwritten credential manager - Class", () => {
            const cliBin = path.join(__dirname, "../test_cli/TestCustomCredClass.ts");
            const cmd = `display-profile`;
            const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toBe("");
            expect(result.stdout).toContain('"username":"custom"');
            expect(result.stdout).toContain('"password":"custom"');
        });
    });
});
