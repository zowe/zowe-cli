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

import { IImperativeConfig } from "../src/doc/IImperativeConfig";

jest.mock("../../security");
jest.mock("../../utilities/src/ImperativeConfig");

import { OverridesLoader } from "../src/OverridesLoader";
import { CredentialManagerFactory, AbstractCredentialManager } from "../../security";
import * as path from "path";
import { ImperativeConfig, Logger } from "../..";
import { AppSettings } from "../../settings";

const TEST_MANAGER_NAME = "test manager";

describe("OverridesLoader", () => {
    const mainModule = process.mainModule;
    const mockCredMgrInitialized = jest.fn().mockReturnValue(false);

    beforeAll(() => {
        Object.defineProperty(CredentialManagerFactory, "initialized", { get: mockCredMgrInitialized });
    });

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
        (process.mainModule as any) = {
            filename: __filename
        };
    });

    afterEach(() => {
        process.mainModule = mainModule;
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("loadCredentialManager", () => {
        it("should not set a credential manager if there are no overrides and keytar is not present", async () => {
            const cliName = "ABCD";
            const config: IImperativeConfig = {
                name: cliName,
                overrides: {}
            };

            const packageJson = {};

            await OverridesLoader.load(config, packageJson);

            // It should not have called initialize
            expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(0);
        });

        it("should not set a credential manager for CLI if there are no overrides and keytar is present in dependencies", async () => {
            const config: IImperativeConfig = {
                name: "ABCD",
                overrides: {},
                productDisplayName: "a fake CLI"
            };

            // Fake out package.json for the overrides loader
            const packageJson = {
                name: "host-package",
                dependencies: {
                    "@zowe/secrets-for-zowe-sdk": "1.0"
                }
            };

            jest.spyOn(AppSettings, "initialized", "get").mockReturnValue(true);
            jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                getNamespace: jest.fn()
            } as any);
            await OverridesLoader.load(config, packageJson);

            // It should not have called initialize
            expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(0);
        });

        it("should load the default for SDK if there are no overrides and keytar is present in dependencies", async () => {
            const config: IImperativeConfig = {
                name: "ABCD",
                overrides: {},
                productDisplayName: "a fake SDK"
            };

            // Fake out package.json for the overrides loader
            const packageJson = {
                name: "host-package",
                dependencies: {
                    "@zowe/secrets-for-zowe-sdk": "1.0"
                }
            };

            await OverridesLoader.load(config, packageJson);

            expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(1);
            expect(CredentialManagerFactory.initialize).toHaveBeenCalledWith({
                Manager: undefined,
                displayName: config.productDisplayName,
                invalidOnFailure: false,
                service: config.name
            });
        });

        it("should load the default when override matches host package name and keytar is present in dependencies", async () => {
            const config: IImperativeConfig = {
                name: "ABCD",
                overrides: {},
                productDisplayName: "a fake CLI"
            };

            // Fake out package.json for the overrides loader
            const packageJson = {
                name: "host-package",
                dependencies: {
                    "@zowe/secrets-for-zowe-sdk": "1.0"
                }
            };

            jest.spyOn(AppSettings, "initialized", "get").mockReturnValue(true);
            jest.spyOn(AppSettings, "instance", "get").mockReturnValue({
                getNamespace: () => ({ CredentialManager: "host-package" })
            } as any);
            await OverridesLoader.load(config, packageJson);

            expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(1);
            expect(CredentialManagerFactory.initialize).toHaveBeenCalledWith({
                Manager: undefined,
                displayName: config.productDisplayName,
                invalidOnFailure: false,
                service: config.name
            });
        });

        describe("should load a credential manager specified by the user", () => {
            it("was passed a class", async () => {
                const config: IImperativeConfig = {
                    name: "EFGH",
                    overrides: {
                        CredentialManager: class extends AbstractCredentialManager {
                            constructor(service: string) {
                                super(service, TEST_MANAGER_NAME);
                            }

                            protected async deleteCredentials(account: string): Promise<void> {
                                return;
                            }

                            protected async loadCredentials(account: string): Promise<string> {
                                return "PASSWORD";
                            }

                            protected async saveCredentials(account: string, password: string): Promise<void> {
                                return;
                            }
                        }
                    }
                };

                // Fake out package.json for the overrides loader - no keytar
                const packageJson = {};
                await OverridesLoader.load(config, packageJson);

                expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(1);
                expect(CredentialManagerFactory.initialize).toHaveBeenCalledWith({
                    Manager: config.overrides.CredentialManager,
                    displayName: config.name,
                    invalidOnFailure: true,
                    service: config.name
                });
            });

            it("was passed an absolute path", async () => {
                const config: IImperativeConfig = {
                    name: "EFGH",
                    overrides: {
                        CredentialManager: path.join(__dirname, "DummyFile.ts")
                    }
                };

                jest.spyOn(path, "resolve");

                // Fake out package.json for the overrides loader - no keytar
                const packageJson = {};
                await OverridesLoader.load(config, packageJson);

                expect(path.resolve).not.toHaveBeenCalled();
                expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(1);
                expect(CredentialManagerFactory.initialize).toHaveBeenCalledWith({
                    Manager: config.overrides.CredentialManager,
                    displayName: config.name,
                    invalidOnFailure: true,
                    service: config.name
                });
            });

            it("was passed a relative path and app settings were not initialized", async () => {
                const config: IImperativeConfig = {
                    name: "IJKL",
                    overrides: {
                        CredentialManager: "DummyFile.ts"
                    }
                };

                // DON'T YOU EVER DO THIS AFTER THE SPY, IT WILL CAUSE YOU MASSIVE PROBLEMS
                // I suspect that process.mainModule.filename somehow uses path.resolve (25 times when I ran this)
                const expectedArgs = [process.mainModule.filename, "../", config.overrides.CredentialManager];

                const expectedLocation = "/some/random/dummy/location/DummyFile.ts";
                jest.spyOn(path, "resolve").mockReturnValueOnce(expectedLocation);

                // Fake out package.json for the overrides loader - no keytar
                const packageJson = {};
                await OverridesLoader.load(config, packageJson);

                expect(path.resolve).toHaveBeenCalledTimes(1);
                expect(path.resolve).toHaveBeenLastCalledWith(expectedArgs[0], expectedArgs[1], expectedArgs[2]);

                expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(1);
                expect(CredentialManagerFactory.initialize).toHaveBeenCalledWith({
                    Manager: expectedLocation,
                    displayName: config.name,
                    invalidOnFailure: true,
                    service: config.name
                });
            });
        });

        describe("when config JSON exists", () => {
            beforeEach(() => {
                jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                    config: {
                        api: {
                            secure: {
                                load: jest.fn()
                            }
                        },
                        exists: () => true
                    }
                } as any);
            });

            it("should not set a credential manager if keytar is not present", async () => {
                const cliName = "ABCD";
                const config: IImperativeConfig = {
                    name: cliName,
                    overrides: {}
                };

                const packageJson = {};

                await OverridesLoader.load(config, packageJson);

                // It should not have called initialize
                expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(0);
            });

            it("should load the default when keytar is present in dependencies", async () => {
                const config: IImperativeConfig = {
                    name: "ABCD",
                    overrides: {}
                };

                // Fake out package.json for the overrides loader
                const packageJson = {
                    dependencies: {
                        "@zowe/secrets-for-zowe-sdk": "1.0"
                    }
                };

                await OverridesLoader.load(config, packageJson);

                expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(1);
                expect(CredentialManagerFactory.initialize).toHaveBeenCalledWith({
                    Manager: undefined,
                    displayName: config.name,
                    invalidOnFailure: false,
                    service: config.name
                });
            });

            it("should load the default when keytar is present in optional dependencies", async () => {
                const config: IImperativeConfig = {
                    name: "ABCD",
                    overrides: {}
                };

                // Fake out package.json for the overrides loader
                const packageJson = {
                    optionalDependencies: {
                        "@zowe/secrets-for-zowe-sdk": "1.0"
                    }
                };

                await OverridesLoader.load(config, packageJson);

                expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(1);
                expect(CredentialManagerFactory.initialize).toHaveBeenCalledWith({
                    Manager: undefined,
                    displayName: config.name,
                    invalidOnFailure: false,
                    service: config.name
                });
            });

            it("should not fail if secure load fails", async () => {
                const config: IImperativeConfig = {
                    name: "ABCD",
                    overrides: {}
                };

                // Fake out package.json for the overrides loader
                const packageJson = {
                    dependencies: {
                        "@zowe/secrets-for-zowe-sdk": "1.0"
                    }
                };

                mockCredMgrInitialized.mockReturnValueOnce(true);
                let caughtError;

                try {
                    await OverridesLoader.load(config, packageJson);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeUndefined();
                expect(CredentialManagerFactory.initialize).toHaveBeenCalledTimes(1);
                expect(ImperativeConfig.instance.config.api.secure.load).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("ensureCredentialManagerLoaded", () => {
        const callerPackageJson = { name: "host-package" };
        const loadedConfig = "fakeConfig";
        const mockSecureLoad = jest.fn();
        let loadCredMgrSpy: any;

        beforeEach(() => {
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                callerPackageJson, loadedConfig,
                config: {
                    api: {
                        secure: { load: mockSecureLoad }
                    }
                }
            } as any);
            loadCredMgrSpy = jest.spyOn(OverridesLoader as any, "loadCredentialManager").mockImplementationOnce(async () => {
                mockCredMgrInitialized.mockReturnValueOnce(true);
                await (OverridesLoader as any).loadSecureConfig();
            });
        });

        it("should load CredentialManager if not already initialized", async () => {
            await OverridesLoader.ensureCredentialManagerLoaded();

            expect(loadCredMgrSpy).toHaveBeenCalledTimes(1);
            expect(loadCredMgrSpy).toHaveBeenCalledWith(loadedConfig, callerPackageJson, true);
            expect(mockSecureLoad).toHaveBeenCalledTimes(1);
        });

        it("should fail to load invalid CredentialManager if not already initialized", async () => {
            const errorMessage = "invalid credential manager";
            mockSecureLoad.mockRejectedValueOnce(new Error(errorMessage));
            const loggerWarnSpy = jest.spyOn(Logger.prototype, "warn");
            await OverridesLoader.ensureCredentialManagerLoaded();

            expect(loadCredMgrSpy).toHaveBeenCalledTimes(1);
            expect(loggerWarnSpy).toHaveBeenCalled();
            expect(loggerWarnSpy.mock.calls[0][0]).toContain(errorMessage);
        });

        it("should do nothing if CredentialManager is already initialized", async () => {
            mockCredMgrInitialized.mockReturnValueOnce(true);
            const loadCredMgrSpy = jest.spyOn(OverridesLoader as any, "loadCredentialManager");
            await OverridesLoader.ensureCredentialManagerLoaded();

            expect(loadCredMgrSpy).not.toHaveBeenCalled();
        });
    });
});
