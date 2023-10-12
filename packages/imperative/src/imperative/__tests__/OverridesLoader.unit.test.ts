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

import { IImperativeConfig } from "..";

jest.mock("../../security");

import { OverridesLoader } from "../src/OverridesLoader";
import { CredentialManagerFactory, AbstractCredentialManager } from "../../security";

import * as path from "path";

const TEST_MANAGER_NAME = "test manager";

describe("OverridesLoader", () => {
    const mainModule = process.mainModule;

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

        it("should load the default when not passed any configuration and keytar is present in dependencies.", async () => {
            const config: IImperativeConfig = {
                name: "ABCD",
                overrides: {},
                productDisplayName: "a fake CLI"
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
    });
});
