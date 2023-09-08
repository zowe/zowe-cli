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

import { AppSettings } from "../";
import { existsSync } from "fs";
import { SettingsAlreadyInitialized, SettingsNotInitialized } from "../src/errors";
import { readFileSync, writeFile, writeFileSync } from "jsonfile";
import { ISettingsFile } from "../src/doc/ISettingsFile";
import * as DeepMerge from "deepmerge";
import { JSONSettingsFilePersistence } from "../src/persistance/JSONSettingsFilePersistence";

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
        writeFile: writeFile as Mock<typeof writeFile>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>,
        readFileSync: readFileSync as Mock<typeof readFileSync>
    };

    const defaultSettings: ISettingsFile = {
        overrides: {
            CredentialManager: false
        }
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
    });
});
