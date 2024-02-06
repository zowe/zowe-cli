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

import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { ProfileIO } from "../../../profiles/src/utils/ProfileIO";
import { CliProfileManager } from "../../src/profiles/CliProfileManager";
import { IProfile } from "../../../profiles/src/doc/definition/IProfile";
import {
    ONLY_ORANGE_WITH_CREDENTIALS,
    SECURE_ORANGE_PROFILE_TYPE,
    TEST_PROFILE_ROOT_DIR
} from "../../../profiles/__tests__/TestConstants";
import { CredentialManagerFactory, DefaultCredentialManager } from "../../../security";
import { BasicProfileManager } from "../../../profiles/src/BasicProfileManager";
import { ProfilesConstants } from "../../../profiles";

jest.mock("../../../profiles/src/utils/ProfileIO");
jest.mock("../../../security/src/DefaultCredentialManager");

// TODO: Some of these tests are not completely isolated, some may cause others to fail depending on mocks

// **NOTE:** DefaultCredentialManager is mocked in such a way that the constructor parameters don't matter here.
// **NOTE:** Check the mocked file for what is actually used.

describe("Cli Profile Manager", () => {
    let writtenProfile: any;

    ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
        writtenProfile = profile;
    });

    afterEach(() => {
        writtenProfile = undefined; // clear any saved profile to not pollute results across tests
    });

    describe("Credential Manager functionality", () => {
        let prof: CliProfileManager;
        let parms: any;
        const securelyStored = ProfilesConstants.PROFILES_OPTION_SECURELY_STORED + " dummy manager";
        const credentialManagerErrorMessage = /(Unable to).*(the secure field)/;

        const user = "username";
        const pass = "password";
        const phone = "{\"a\":\"b\"}";
        const code = 0;
        const phrase = "phrase";
        const set = ["a1,a2", "b2"];
        const flag = false;
        const minime = "mini-me";
        const name = "My-secure-orange";
        const description = "A secure orange";

        beforeEach(() => {
            prof = new CliProfileManager({
                profileRootDirectory: TEST_PROFILE_ROOT_DIR,
                typeConfigurations: ONLY_ORANGE_WITH_CREDENTIALS,
                type: SECURE_ORANGE_PROFILE_TYPE,
                logger: TestLogger.getTestLogger()
            });

            // We need to define parms every time since implementation explicitly deletes the username and password properties from memory
            parms = {
                name,
                profile: {
                    description: "A secure orange"
                },
                overwrite: false,
                args: {
                    user,
                    phone,
                    code,
                    phrase,
                    set,
                    flag,
                    minime
                }
            };

            prof.setDefault = jest.fn();
        });

        describe("Load operation", () => {
            const tempProf: any = {
                name,
                username: user,
                password: null,
                type: SECURE_ORANGE_PROFILE_TYPE,
                secureBox: {
                    myCode: securelyStored,
                    myFlag: securelyStored,
                    myMiniBox: securelyStored,
                    myPhone: securelyStored,
                    myPhrase: securelyStored,
                    mySet: securelyStored,
                    myEmptyMiniBox: null,
                }
            };

            it("should load credentials from a profile with constant string values for secure properties", async () => {
                const dummyManager = new DefaultCredentialManager("dummy");
                dummyManager.load = jest.fn(async (propKey: string) => {
                    let ret: any = null;
                    if (propKey.indexOf("myCode") >= 0) {
                        ret = code;
                    } else if (propKey.indexOf("myFlag") >= 0) {
                        ret = flag;
                    } else if (propKey.indexOf("myMiniBox") >= 0) {
                        ret = {minime};
                    } else if (propKey.indexOf("myPhone") >= 0) {
                        ret = phone;
                    } else if (propKey.indexOf("myPhrase") >= 0) {
                        ret = phrase;
                    } else if (propKey.indexOf("mySet") >= 0) {
                        ret = set;
                    }
                    return JSON.stringify(ret);
                });
                Object.defineProperty(CredentialManagerFactory, "manager", {get: jest.fn().mockReturnValue(dummyManager)});
                Object.defineProperty(CredentialManagerFactory, "initialized", { get: jest.fn().mockReturnValue(true) });

                // same object but with real values
                const copyTempProf = JSON.parse(JSON.stringify(tempProf));
                copyTempProf.secureBox = {
                    myCode: code,
                    myFlag: flag,
                    myMiniBox: {minime},
                    myPhone: phone,
                    myPhrase: phrase,
                    mySet: set,
                    myEmptyMiniBox: null,
                };

                jest.spyOn(BasicProfileManager.prototype, "loadProfile" as any).mockReturnValue({
                    profile: tempProf // This profile will be altered by reference with the real values by CliProfileManager.loadProfile
                });

                const result = await prof.load({name});

                // BasicProfileManager should be called to load the profile with the given options
                expect((BasicProfileManager.prototype as any).loadProfile).toHaveBeenCalledWith(
                    {name, failNotFound: true, loadDefault: false, loadDependencies: true}
                );

                // Compare to the modified-by-reference profile
                expect(result.profile).toMatchObject(tempProf);

                // Compare to our manually modified profile
                expect(result.profile).toMatchObject(copyTempProf);

                (BasicProfileManager.prototype as any).loadProfile.mockRestore();
            });

            it("should not load credentials from a profile if noSecure is specified", async () => {
                const dummyManager = new DefaultCredentialManager("dummy");
                dummyManager.load = jest.fn(async (propKey: string) => {
                    let ret: any = null;
                    if (propKey.indexOf("myCode") >= 0) {
                        ret = code;
                    } else if (propKey.indexOf("myFlag") >= 0) {
                        ret = flag;
                    } else if (propKey.indexOf("myMiniBox") >= 0) {
                        ret = {minime};
                    } else if (propKey.indexOf("myPhone") >= 0) {
                        ret = phone;
                    } else if (propKey.indexOf("myPhrase") >= 0) {
                        ret = phrase;
                    } else if (propKey.indexOf("mySet") >= 0) {
                        ret = set;
                    }
                    return JSON.stringify(ret);
                });
                Object.defineProperty(CredentialManagerFactory, "manager", {get: jest.fn().mockReturnValue(dummyManager)});
                Object.defineProperty(CredentialManagerFactory, "initialized", {get: jest.fn().mockReturnValue(true)});

                // same object but with real values
                const copyTempProf = JSON.parse(JSON.stringify(tempProf));
                copyTempProf.secureBox = {
                    myCode: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myFlag: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myMiniBox: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myPhone: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myPhrase: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    mySet: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myEmptyMiniBox: null,
                };

                jest.spyOn(BasicProfileManager.prototype, "loadProfile" as any).mockReturnValue({
                    profile: copyTempProf
                });

                const result = await prof.load({name, noSecure: true});

                // BasicProfileManager should be called to save the profile with the given options
                expect((BasicProfileManager.prototype as any).loadProfile).toHaveBeenCalledWith(
                    {name, failNotFound: true, loadDefault: false, loadDependencies: true, noSecure: true}
                );

                // Compare to the modified-by-reference profile
                expect(result.profile).toMatchSnapshot();

                (BasicProfileManager.prototype as any).loadProfile.mockRestore();
            });

            it("should not attempt to load secure fields if no credential manager is present", async () => {
                const dummyManager = new DefaultCredentialManager("dummy");
                dummyManager.load = jest.fn(async (propKey: string) => {
                    let ret: any = null;
                    if (propKey.indexOf("myCode") >= 0) {
                        ret = code;
                    } else if (propKey.indexOf("myFlag") >= 0) {
                        ret = flag;
                    } else if (propKey.indexOf("myMiniBox") >= 0) {
                        ret = {minime};
                    } else if (propKey.indexOf("myPhone") >= 0) {
                        ret = phone;
                    } else if (propKey.indexOf("myPhrase") >= 0) {
                        ret = phrase;
                    } else if (propKey.indexOf("mySet") >= 0) {
                        ret = set;
                    }
                    return JSON.stringify(ret);
                });

                // Even, though it should not get the manager, we'll add a dummy to test if it gets called
                const notCalledManager = jest.fn().mockReturnValue(dummyManager);
                Object.defineProperty(CredentialManagerFactory, "manager", {get: notCalledManager});
                Object.defineProperty(CredentialManagerFactory, "initialized", {get: jest.fn().mockReturnValue(false)});

                // same object but with real values
                const copyTempProf = JSON.parse(JSON.stringify(tempProf));
                copyTempProf.secureBox = {
                    myCode: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myFlag: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myMiniBox: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myPhone: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myPhrase: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    mySet: ProfilesConstants.PROFILES_OPTION_SECURELY_STORED,
                    myEmptyMiniBox: null,
                };

                jest.spyOn(BasicProfileManager.prototype, "loadProfile" as any).mockReturnValue({
                    profile: copyTempProf
                });

                const result = await prof.load({name});

                // BasicProfileManager should be called to save the profile with the given options
                expect((BasicProfileManager.prototype as any).loadProfile).toHaveBeenCalledWith(
                    {name, failNotFound: true, loadDefault: false, loadDependencies: true}
                );

                // Compare to the modified-by-reference profile
                expect(result.profile).toMatchSnapshot();

                // The dummy manager should not have been called
                expect(notCalledManager).toHaveBeenCalledTimes(0);

                (BasicProfileManager.prototype as any).loadProfile.mockRestore();
            });

            it("should fail if the Credential Manager throws an error", async () => {
                const dummyManager = new DefaultCredentialManager("dummy");
                dummyManager.load = jest.fn(() => {
                    throw new Error("dummy error");
                });
                Object.defineProperty(CredentialManagerFactory, "manager", {get: jest.fn().mockReturnValue(dummyManager)});
                Object.defineProperty(CredentialManagerFactory, "initialized", {get: jest.fn().mockReturnValue(true)});

                jest.spyOn(BasicProfileManager.prototype, "loadProfile" as any).mockReturnValue({
                    profile: tempProf
                });

                let errorMessage = "";
                try {
                    await prof.load({name});
                } catch (err) {
                    errorMessage = err.message;
                }

                expect(errorMessage).toMatch(credentialManagerErrorMessage);

                (BasicProfileManager.prototype as any).loadProfile.mockRestore();
            });
        });
    });
});
