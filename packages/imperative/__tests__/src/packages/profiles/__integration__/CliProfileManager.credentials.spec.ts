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
import { IImperativeConfig } from "../../../../../packages/imperative";
import { CliProfileManager } from "../../../../../packages/cmd";
import { ProfileIO } from "../../../../../packages/profiles/src/utils";
import { IProfile } from "../../../../../packages/profiles/src/doc/definition";

describe("Cli Profile Manager", () => {
    let writtenProfile: any;
    const credentialManagerErrorMessage = /(Unable to).*(the secure field)/;

    const originalSaveProfile = (CliProfileManager.prototype as any).saveProfile;
    afterEach(() => {
        (CliProfileManager.prototype as any).saveProfile = originalSaveProfile;
    });
    ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
        writtenProfile = profile;
    });

    ProfileIO.exists = jest.fn((profilePath: string) => {
        return profilePath.indexOf("meta") === -1 ? profilePath : undefined;
    });

    ProfileIO.readMetaFile = jest.fn((fullFilePath: string) => {
        return {
            defaultProfile: "mybana",
            configuration: {
                type: "",
                schema: {
                    type: "object",
                    title: "test profile",
                    description: "test profile",
                    properties: {
                        sum: {
                            type: "number"
                        }
                    },
                    required: ["sum"]
                }
            }
        };
    });
    afterEach(() => {
        writtenProfile = undefined; // clear any saved profile to not pollute results across tests
    });

    describe("Default Credential Management", () => {
        const cliBin = path.join(__dirname, "../test_cli/TestCLI.ts");
        const config: IImperativeConfig = require(path.join(__dirname, "../test_cli/TestConfiguration"));
        const homeDir: string = config.defaultHome;

        const testProfileName = "username-password";
        const username: string = "username";
        const password: number = 0;
        const account: string = "account123";
        const secured: string = "secured";
        const insecured: string = "insecured"; // playing off insecure child...
        const newPass: number = 1;

        beforeEach(() => {
            T.rimraf(homeDir);
        });

        describe("Generic Success Scenarios", () => {
            const profileName = "profile-name";

            it("should create and load a profile with saved credentials", () => {
                let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");
                cmd = `display-profile`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toEqual("");
                expect(JSON.parse(result.stdout)).toEqual({
                    myParent: {
                        insecuredProperty: {myInSecuredChild: "insecured"},
                        securedProperty: {mySecuredChild: "secured"}
                    },
                    account, username, password});
            });

            it("should overwrite and load a profile with saved credentials", () => {
                let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");

                cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured} --ow`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Overwrote existing profile");
                expect(result.stdout).toContain("Profile created successfully!");
            });

            it("should update and load a profile with saved credentials", () => {
                const newName: string = "newName";

                let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");

                cmd = `profiles update ${testProfileName}-profile ${profileName} --username ${newName} --password ${newPass}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("command 'profiles update' is deprecated");
                expect(result.stdout).toContain("Overwrote existing profile");
                expect(result.stdout).toContain("Profile updated successfully!");

                cmd = `display-profile`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toEqual("");
                expect(JSON.parse(result.stdout)).toEqual({
                    myParent: {
                        insecuredProperty: {myInSecuredChild: "insecured"},
                        securedProperty: {mySecuredChild: "secured"}
                    },
                    account, username: newName, password: newPass});
            });

            it("should delete a profile with saved credentials", () => {
                let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");

                cmd = `profiles delete ${testProfileName}-profile ${profileName}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("command 'profiles delete' is deprecated");
                expect(result.stdout).toContain("successfully deleted");
            });

            it("should update a password", () => {
                let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");

                // profiles upd username-password username-password --password pass
                cmd = `profiles update ${testProfileName}-profile ${profileName} --password ${newPass}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(T.stripNewLines(result.stdout)).toContain("Overwrote existing profile");
                expect(result.stderr).toMatchSnapshot();

                cmd = `profiles delete ${testProfileName}-profile ${profileName}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(result.stderr).toContain("command 'profiles delete' is deprecated");
                expect(T.stripNewLines(result.stdout)).toContain("successfully deleted");
                expect(result.stdout).toMatchSnapshot();
            });
        });

        describe("Generic Failure Scenarios", () => {
            const createdName = "profile-name";
            const changedName = "profile-name-changed";
            const changedProfileName = "changed-username-password";

            const profilePath = path.join(homeDir, "profiles", testProfileName);
            const createdPath = path.join(profilePath, createdName + ".yaml");
            const changedPath = path.join(profilePath, changedName + ".yaml");

            it("should fail if the Credential Manager is unable to find the profile", () => {
                let cmd = `profiles create ${testProfileName}-profile ${createdName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");

                // Now change the name of the profile so that we can break it
                fs.renameSync(createdPath, changedPath);

                cmd = `profiles delete ${testProfileName}-profile ${createdName}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(T.stripNewLines(result.stderr)).toContain(`Profile "${createdName}" of type "${testProfileName}" does not exist.`);
                expect(result.stderr).toContain("Profile \"profile-name\" of type \"username-password\" does not exist");
                expect(result.stderr).toContain("The command 'profiles delete' is deprecated");

                // Now put it back for cleanup
                fs.renameSync(changedPath, createdPath);

                cmd = `profiles delete ${testProfileName}-profile ${createdName}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(result.stderr).toContain("command 'profiles delete' is deprecated");
                expect(T.stripNewLines(result.stdout)).toContain("successfully deleted");
            });

            it("should fail if the Credential Manager is unable to retrieve a password", () => {
                let cmd = `profiles create ${testProfileName}-profile ${createdName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");

                // Now change the name of the profile so that we can break it
                fs.renameSync(createdPath, changedPath);

                cmd = `display-profile --${testProfileName}-profile ${changedName}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(T.stripNewLines(result.stderr)).toMatch(credentialManagerErrorMessage);
                expect(result.stderr).toMatchSnapshot();

                // Now put it back for cleanup
                fs.renameSync(changedPath, createdPath);

                cmd = `profiles delete ${testProfileName}-profile ${createdName}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                expect(result.stderr).toContain("command 'profiles delete' is deprecated");
                expect(T.stripNewLines(result.stdout)).toContain("successfully deleted");
                expect(result.stdout).toMatchSnapshot();
            });
        });

        describe("Missing keytar installation", () => {
            const profileName = "missing-keytar";
            const keyTarDir = path.join(__dirname, "../../../../../node_modules/@zowe/secrets-for-zowe-sdk");
            const renamedKeyTarDir = path.join(__dirname, "../../../../../node_modules/@zowe/zowe-for-secrets-sdk");

            const renameKeyTar = () => {
                if (fs.existsSync(keyTarDir)) {
                    fs.renameSync(keyTarDir, renamedKeyTarDir);
                }
            };

            // Make sure that the keytar folder is reset to the original name.
            afterEach(() => {
                if (fs.existsSync(renamedKeyTarDir)) {
                    fs.renameSync(renamedKeyTarDir, keyTarDir);
                }
            });

            it("should fail if keytar is not loaded on profiles create", () => {
                renameKeyTar();

                const cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toEqual("");
                expect(result.stderr).toContain(profileName);
                expect(result.stderr).toContain("Failed to load Keytar module");
            });

            it("should fail if keytar is not loaded on using profile handler", () => {
                let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");

                renameKeyTar();

                cmd = `display-profile`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("Command Preparation Failed");
                expect(result.stderr).toContain("Failed to load Keytar module");
            });

            it("should fail if keytar is not loaded on profiles delete", () => {
                let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} ` +
                    `--password ${password} --account ${account} --sec1 ${secured} --insec1 ${insecured}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain("command 'profiles create' is deprecated");
                expect(result.stdout).toContain("Profile created successfully!");

                renameKeyTar();

                cmd = `profiles delete ${testProfileName}-profile ${profileName}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stderr).toContain(profileName);
                expect(result.stderr).toMatch(credentialManagerErrorMessage);
            });

            it("should be able to issue command", () => {
                renameKeyTar();

                const cmd = `display-non-keytar`;
                const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain("This handler does not require keytar");
            });
        });
    });

    describe("Custom Credential Management (Absolute String)", () => {
        const cliBin = path.join(__dirname, "../test_cli/TestCustomCredString.ts");
        const config: IImperativeConfig = require(path.join(__dirname, "../test_cli/TestCustomCredStringConfiguration"));
        const homeDir: string = config.defaultHome;

        const testProfileName = "username-password";
        const username: string = "username";
        const password: string = "password";

        beforeEach(() => {
            T.rimraf(homeDir);
        });

        it("should use an overwritten credential manager (Absolute String)", () => {
            const profileName = "custom-credential-string";

            let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} --password ${password}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toContain("command 'profiles create' is deprecated");
            expect(result.stdout).toContain("Profile created successfully!");

            cmd = `display-profile`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(JSON.parse(result.stdout)).toEqual({username: "custom", password: "custom"});
        });
    });

    describe("Custom Credential Management (Class)", () => {
        const cliBin = path.join(__dirname, "../test_cli/TestCustomCredClass.ts");
        const config: IImperativeConfig = require(path.join(__dirname, "../test_cli/TestCustomCredClassConfiguration"));
        const homeDir: string = config.defaultHome;

        const testProfileName = "username-password";
        const username: string = "username";
        const password: string = "password";

        beforeEach(() => {
            T.rimraf(homeDir);
        });

        it("should use an overwritten credential manager (Class)", () => {
            const profileName = "custom-credential-class";

            let cmd = `profiles create ${testProfileName}-profile ${profileName} --username ${username} --password ${password}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toContain("command 'profiles create' is deprecated");
            expect(result.stdout).toContain("Profile created successfully!");

            cmd = `display-profile`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(JSON.parse(result.stdout)).toEqual({ username: "custom", password: "custom"});
        });
    });
});
