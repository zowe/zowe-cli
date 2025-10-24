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

import Mock = jest.Mock;

jest.mock("fs");
jest.mock("jsonfile");

import { AppSettings } from "..";
import { existsSync } from "fs";
import { SettingsAlreadyInitialized, SettingsNotInitialized } from "../src/errors";
import { readFileSync, writeFile, writeFileSync } from "jsonfile";
import { ISettingsFile } from "../src/doc/ISettingsFile";
import * as DeepMerge from "deepmerge";
import { JSONSettingsFilePersistence } from "../src/persistance/JSONSettingsFilePersistence";
import { PersistenceLevel } from "../../security/src/doc/IDefaultCredentialManagerOptions";

/**
 * Type of all the keys in the app settings class
 */
type AppSettingsPublicKeys = {
    [K in keyof AppSettings]: AppSettings[K]
};

/**
 * An interface that explicitly defines private methods available to the public
 * for testing purposes only. This only works for an instantiated {@link AppSettings}
 * class object, so use it wisely.
 */
interface IAppSettingsAllMethods extends AppSettingsPublicKeys {
    flush: () => void;
}

/**
 * Takes a settings object and publicizes all protected and private methods and variables.
 * Should be used for testing purposes only.
 *
 * @param settings The settings to expose.
 *
 * @returns The input settings parameter typed as the IAppSettingsAllMethod interface. This is
 *          possible because there is really no such thing as a private variable in typescript.
 */
const exposeAppSettingsInternal = (settings: AppSettings): IAppSettingsAllMethods => {
    return (settings as any) as IAppSettingsAllMethods;
};

describe("AppSettings", () => {
    const mocks = {
        existsSync: existsSync as unknown as Mock<typeof existsSync>,
        writeFile: writeFile as unknown as Mock<typeof writeFile>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>,
        readFileSync: readFileSync as Mock<typeof readFileSync>
    };

    const defaultSettings: ISettingsFile = {
        overrides: {
            CredentialManager: false,
        },
        credentialManagerOptions: {}
    };

    afterEach(() => {
        // Each test should be isolated so clean up any changes that might have happened to the settings file.
        (AppSettings as any).mInstance = undefined;
    });

    describe("initialization static errors", () => {
        it("should error when app settings hasn't been initialized", () => {
            expect(() => {
                AppSettings.instance.set("overrides", "CredentialManager", false);
            }).toThrow(SettingsNotInitialized);
        });

        it("should error when initialized more than once", () => {
            mocks.readFileSync.mockReturnValueOnce(defaultSettings as any);

            AppSettings.initialize("test.json",defaultSettings);

            expect(() => {
                AppSettings.initialize("another-test.json",defaultSettings);
            }).toThrow(SettingsAlreadyInitialized);
        });
    });

    describe("constructing class scenarios", () => {
        it("should return the correct instance", () => {
            mocks.readFileSync.mockReturnValueOnce(defaultSettings as any);

            const appSettingsInstance = AppSettings.initialize("test.json",defaultSettings);

            expect(AppSettings.instance).toBe(appSettingsInstance);
        });

        it("should merge settings provided from the file", () => {
            // An array of test scenario objects.
            const scenarios: Array<{ provided: object, expected: object }> = [
                {
                    provided: {overrides: {CredentialManager: "test-1"}},
                    expected: {
                        ...defaultSettings,
                        overrides: {
                            ...defaultSettings.overrides,
                            CredentialManager: "test-1"
                        }
                    }
                },
                {
                    provided: {abcd: "test-2"},
                    expected: {
                        ...defaultSettings,
                        abcd: "test-2",
                        overrides: {
                            ...defaultSettings.overrides
                        }
                    }
                },
                {
                    provided: {overrides: {CredentialManager: "test-3", SomethingElse: "some-other-plugin"}},
                    expected: {
                        ...defaultSettings,
                        overrides: {
                            ...defaultSettings.overrides,
                            CredentialManager: "test-3",
                            SomethingElse: "some-other-plugin"
                        }
                    }
                },
                {
                    provided: {overrides: {SomethingElse: "test-4"}},
                    expected: {
                        ...defaultSettings,
                        overrides: {
                            ...defaultSettings.overrides,
                            SomethingElse: "test-4"
                        }
                    }
                },
                {
                    provided: {abcd: "test-5", overrides: {SomethingElse: "some-other-plugin"}},
                    expected: {
                        ...defaultSettings,
                        abcd: "test-5",
                        overrides: {
                            ...defaultSettings.overrides,
                            SomethingElse: "some-other-plugin"
                        }
                    }
                }
            ];

            for (const scenario of scenarios) {
                mocks.readFileSync.mockReturnValueOnce(scenario.provided as any);

                AppSettings.initialize("file", defaultSettings);
                exposeAppSettingsInternal(AppSettings.instance).flush();
                expect(AppSettings.instance.getSettings()).toEqual(scenario.expected);
                (AppSettings as any).mInstance = undefined;
            }


        });
    });

    describe("set", () => {
        beforeEach(() => {
            jest.spyOn(JSONSettingsFilePersistence.prototype, "read").mockReturnValueOnce({
                overrides: {
                    CredentialManager: "@zowe/cli"
                }
            });
            AppSettings.initialize("file", defaultSettings);
        });

        it("sets a property in credentialManagerOptions with the given key/value pair", () => {
            expect(() => AppSettings.instance.set("credentialManagerOptions", "persist", PersistenceLevel.LocalMachine)).not.toThrow();
        });

        it("throws an error if the given namespace does not exist", () => {
            expect(() => AppSettings.instance.set("nonexistent" as any, "blah", 123)).toThrow("Namespace nonexistent does not exist");
        });
    });

    describe("get", () => {
        beforeEach(() => {
            jest.spyOn(JSONSettingsFilePersistence.prototype, "read").mockReturnValueOnce({
                overrides: {
                    CredentialManager: false,
                },
                credentialManagerOptions: {}
            });
            AppSettings.initialize("file", defaultSettings);
        });

        it("throws an error if the given namespace does not exist", () => {
            expect(() => AppSettings.instance.get("asdfghjkl" as any, "nonexistent_key")).toThrow("Namespace asdfghjkl does not exist");
        });
        
        it("returns a property in credentialManagerOptions namespace when options are present", () => {
            AppSettings.instance.set("credentialManagerOptions", "persist", PersistenceLevel.LocalMachine);
            expect(AppSettings.instance.get("credentialManagerOptions", "persist")).not.toBeUndefined();
            expect(AppSettings.instance.get("credentialManagerOptions", "persist")).toStrictEqual(PersistenceLevel.LocalMachine);
        });

        it("returns undefined for a credentialManagerOptions property when no options are present", () => {
            expect(AppSettings.instance.get("credentialManagerOptions", "persist")).toBeUndefined();
        });
    });

    describe("getNamespace", () => {
        beforeEach(() => {
            jest.spyOn(JSONSettingsFilePersistence.prototype, "read").mockReturnValueOnce({
                overrides: {
                    CredentialManager: false
                }
            });
            AppSettings.initialize("file", defaultSettings);
        });

        it("returns the object for overrides namespace", () => {
            expect(AppSettings.instance.getNamespace("overrides")).not.toBeUndefined();
            expect(AppSettings.instance.getNamespace("overrides")).toStrictEqual(defaultSettings.overrides);
        });

        it("returns the namespace for credentialManagerOptions when options are present", () => {
            AppSettings.instance.set("credentialManagerOptions", "persist", PersistenceLevel.LocalMachine);
            expect(AppSettings.instance.getNamespace("credentialManagerOptions")).not.toBeUndefined();
            expect(AppSettings.instance.getNamespace("credentialManagerOptions")).toStrictEqual({ persist: PersistenceLevel.LocalMachine });
        });
    });

    describe("writing settings", () => {
        /**
         * Takes an app settings object and mocks the {@link IAppSettingsAllMethods#writeSettingsFile} method
         * @param settings The settings to modify.
         */
        const mockAppSettingsInternal = (settings: AppSettings): IAppSettingsAllMethods => {
            const returnSettings = exposeAppSettingsInternal(settings);

            returnSettings.flush = jest.fn();
            return returnSettings;
        };

        beforeAll(() => {
            mocks.readFileSync.mockReturnValue(defaultSettings as any);
        });

        const fileName = "test.json";

        it("should write to a settings file", async () => {
            mocks.writeFileSync.mockReset();
            mocks.readFileSync.mockClear();
            mocks.readFileSync.mockReturnValueOnce(defaultSettings as any);
            AppSettings.initialize(fileName, defaultSettings);
            exposeAppSettingsInternal(AppSettings.instance).flush();

            expect(mocks.writeFileSync).toHaveBeenCalledTimes(1);
            expect(mocks.writeFileSync).toHaveBeenCalledWith(fileName, defaultSettings, {spaces: 2});

            // Clean up from previous test
            (AppSettings as any).mInstance = undefined;
            mocks.writeFile.mockClear();

            const testLoadSettings = {
                abcd: "test"
            };

            mocks.readFileSync.mockReturnValueOnce(testLoadSettings as any);

            AppSettings.initialize(fileName, defaultSettings);
            exposeAppSettingsInternal(AppSettings.instance).flush();

            expect(mocks.writeFileSync).toHaveBeenCalledTimes(2);
            expect(mocks.writeFileSync).toHaveBeenCalledWith(
                fileName,
                DeepMerge(JSON.parse(JSON.stringify(defaultSettings)), testLoadSettings),
                {spaces: 2}
            );

        });
        it("should write to a settings file if one does not exist", async () => {
            mocks.writeFileSync.mockReset();
            mocks.readFileSync.mockClear();
            mocks.readFileSync.mockImplementation(() => {
                throw new Error();
            });
            AppSettings.initialize(fileName, defaultSettings);

            expect(mocks.writeFileSync).toHaveBeenCalledTimes(1);
            expect(mocks.writeFileSync).toHaveBeenCalledWith(fileName, defaultSettings, {spaces: 2});

        });

        describe("setting overrides", () => {
            let appSettings: IAppSettingsAllMethods;

            beforeEach(() => {
                appSettings = mockAppSettingsInternal(new AppSettings(new JSONSettingsFilePersistence("some-file"), defaultSettings));
            });

            it("should have the defaults unchanged", () => {
                expect(appSettings.getNamespace("overrides")).toEqual(defaultSettings.overrides);
            });

            it("should override every possible overrides", async () => {
                // Test each possible overrides key
                for (const override of Object.keys(defaultSettings.overrides)) {
                    // Generate a random value just to be safe
                    const newValue = Math.random().toString();

                    // Override the current key with the new value randomly generated string
                    await appSettings.set("overrides", override, newValue);

                    // Test that it was changed
                    expect(appSettings.getNamespace("overrides")).toEqual({
                        ...defaultSettings.overrides,
                        [override]: newValue
                    });
                    // Now set it back to normal
                    await appSettings.set("overrides", override, false);

                    // Test it went back to norm
                    expect(appSettings.getNamespace("overrides")).toEqual({
                        ...defaultSettings.overrides,
                        [override]: false
                    });

                    // Prepare for the next loop.
                    (appSettings.flush as Mock<typeof Function>).mockClear();
                }
            });
        });

        describe("setting credential manager options", () => {
            let appSettings: IAppSettingsAllMethods;

            beforeEach(() => {
                appSettings = mockAppSettingsInternal(new AppSettings(new JSONSettingsFilePersistence("some-file"), defaultSettings));
            });

            it("should create credential manager options outside of overrides", () => {
                appSettings.set("credentialManagerOptions", "persist", PersistenceLevel.Enterprise);

                expect(appSettings.getNamespace("credentialManagerOptions")).toEqual({
                    persist: PersistenceLevel.Enterprise
                });
            });
        });
    });
});
