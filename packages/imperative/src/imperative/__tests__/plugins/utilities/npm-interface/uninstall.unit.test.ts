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

/* eslint-disable jest/expect-expect */
jest.mock("cross-spawn");
jest.mock("jsonfile");
jest.mock("../../../../src/plugins/utilities/PMFConstants");

import * as fs from "fs";
import * as jsonfile from "jsonfile";
import { Console } from "../../../../../console";
import * as spawn from "cross-spawn";
import { ImperativeError } from "../../../../../error";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { Logger } from "../../../../../logger";
import { PMFConstants } from "../../../../src/plugins/utilities/PMFConstants";
import { findNpmOnPath } from "../../../../src/plugins/utilities/NpmFunctions";
import { uninstall } from "../../../../src/plugins/utilities/npm-interface";
import { ConfigSchema, ConfigUtils } from "../../../../../config";
import mockTypeConfig from "../../__resources__/typeConfiguration";
import { ExecUtils, ImperativeConfig } from "../../../../../utilities";
import { IExtendersJsonOpts } from "../../../../../config/src/doc/IExtenderOpts";
import { updateAndGetRemovedTypes } from "../../../../src/plugins/utilities/npm-interface/uninstall";

describe("PMF: Uninstall Interface", () => {
    // Objects created so types are correct.
    const mocks = {
        spawnSync: jest.spyOn(spawn, "sync"),
        readFileSync: jest.spyOn(jsonfile, "readFileSync"),
        writeFileSync: jest.spyOn(jsonfile, "writeFileSync")
    };

    const samplePackageName = "imperative-sample-plugin";
    const packageName = "a";
    const packageRegistry = "https://registry.npmjs.org/";
    const npmCmd = findNpmOnPath();

    beforeEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();

        // This needs to be mocked before running uninstall
        jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(new Logger(new Console()));
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    /**
   * Validates that an spawnSync npm uninstall call was valid based on the parameters passed.
   *
   * @param {string} expectedPackage The package that should be sent to npm uninstall
   */
    const wasSpawnSyncCallValid = (expectedPackage: string) => {
        expect(mocks.spawnSync).toHaveBeenCalledWith(npmCmd,
            [
                "uninstall",
                expectedPackage,
                "--prefix",
                PMFConstants.instance.PLUGIN_INSTALL_LOCATION,
                "-g"
            ], {
                cwd  : PMFConstants.instance.PMF_ROOT,
                stdio: ["pipe", "pipe", "pipe"]
            }
        );
    };

    /**
     * Validates that the writeFileSync was called with the proper JSON object. This object is created
     * by copying all the plugins but the uninstalled plugin and writing to plugins.json.
     */
    const wasWriteFileSyncCallValid = () => {
        // Create the object that should be sent to the command.
        const expectedObject: IPluginJson = {
            plugin2: {
                package: "plugin1",
                location: packageRegistry,
                version: "1.2.3"
            }
        };

        expect(mocks.writeFileSync).toHaveBeenCalledWith(
            PMFConstants.instance.PLUGIN_JSON,
            expectedObject,
            {
                spaces: 2
            }
        );
    };

    describe("Basic uninstall", () => {

        beforeEach(() => {
            mocks.spawnSync.mockReturnValue({
                status: 0,
                stdout: Buffer.from(`+ ${packageName}`)
            } as any);
        });

        it("should uninstall", () => {

            const pluginJsonFile: IPluginJson = {
                a: {
                    package: "a",
                    location: packageRegistry,
                    version: "3.2.1"
                },
                plugin2: {
                    package: "plugin1",
                    location: packageRegistry,
                    version: "1.2.3"
                }
            };

            mocks.readFileSync.mockReturnValue(pluginJsonFile);

            uninstall(packageName);

            // Validate the install
            wasSpawnSyncCallValid(packageName);
            wasWriteFileSyncCallValid();
        });
        it("should uninstall and check daemon stream if available", () => {
            const writeMock = jest.fn();
            jest.spyOn(ImperativeConfig, "instance", "get").mockReturnValue({
                envVariablePrefix: "MOCK_PREFIX",
                cliHome: "/mock/home",
                daemonContext: {
                    stream: {
                        write: writeMock
                    }
                }
            } as any);

            const pluginJsonFile: IPluginJson = {
                a: {
                    package: "a",
                    location: packageRegistry,
                    version: "3.2.1"
                },
                plugin2: {
                    package: "plugin1",
                    location: packageRegistry,
                    version: "1.2.3"
                }
            };

            mocks.readFileSync.mockReturnValue(pluginJsonFile);

            uninstall(packageName);

            wasSpawnSyncCallValid(packageName);
            wasWriteFileSyncCallValid();

            expect(writeMock).toHaveBeenCalled();
        });

        it("should uninstall imperative-sample-plugin", () => {

            const pluginJsonFile: IPluginJson = {
                "imperative-sample-plugin": {
                    package: "C:\\test\\imperative-plugins",
                    location: packageRegistry,
                    version: "1.0.1"
                },
                "plugin2": {
                    package: "plugin1",
                    location: packageRegistry,
                    version: "1.2.3"
                }
            };

            mocks.readFileSync.mockReturnValue(pluginJsonFile);

            uninstall(samplePackageName);

            // Validate the install
            wasSpawnSyncCallValid(samplePackageName);
            wasWriteFileSyncCallValid();
        });

        it("should throw error if unable to read installed plugins", () => {
            const error = new Error("This should be caught");

            mocks.readFileSync.mockImplementation(() => {
                throw error;
            });

            // Create a placeholder error object that should be set after the call to install
            let expectedError: ImperativeError;

            try {
                uninstall("");
            } catch (e) {
                expectedError = e;
            }

            // Check that the expected ImperativeError was thrown
            expect(expectedError).toEqual(new ImperativeError({
                msg: error.message,
                causeErrors: [error]
            }));
        });

        it("should throw error if install folder exists after uninstall", () => {
            const pluginJsonFile: IPluginJson = {
                a: {
                    package: "a",
                    location: packageRegistry,
                    version: "3.2.1"
                }
            };

            mocks.readFileSync.mockReturnValue(pluginJsonFile);
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            let caughtError;

            try {
                uninstall("a");
            } catch (error) {
                caughtError = error;
            }

            // Validate the install
            wasSpawnSyncCallValid(packageName);
            expect(caughtError.message).toContain("Failed to uninstall plugin, install folder still exists");
        });
    });

    describe("Schema management", () => {
        const getBlockMocks = () => {
            jest.spyOn(fs, "existsSync").mockRestore();
            return {
                ConfigSchema: {
                    buildSchema: jest.spyOn(ConfigSchema, "buildSchema").mockImplementation(),
                    loadSchema: jest.spyOn(ConfigSchema, "loadSchema").mockReturnValueOnce([mockTypeConfig]),
                    updateSchema: jest.spyOn(ConfigSchema, "updateSchema").mockImplementation()
                },
                fs: {
                    existsSync: jest.spyOn(fs, "existsSync").mockReturnValueOnce(false)
                },
                jsonfile: {
                    // avoid throwing error during plugin uninstall by marking plug-in folder as non-existent
                    writeFileSync: jest.spyOn(jsonfile, "writeFileSync").mockImplementation()
                },
                ExecUtils: {
                    spawnAndGetOutput: jest.spyOn(ExecUtils, "spawnAndGetOutput").mockImplementation()
                }
            };
        };

        const expectTestSchemaMgmt = (opts: { schemaUpdated?: boolean }) => {
            const pluginJsonFile: IPluginJson = {
                a: {
                    package: "a",
                    location: packageRegistry,
                    version: "3.2.1"
                },
                plugin2: {
                    package: "plugin1",
                    location: packageRegistry,
                    version: "1.2.3"
                }
            };

            mocks.readFileSync.mockReturnValue(pluginJsonFile);
            const blockMocks = getBlockMocks();
            if (opts.schemaUpdated) {
                blockMocks.fs.existsSync.mockReturnValueOnce(true);
                jest.spyOn(ConfigUtils, "readExtendersJson").mockReturnValue({
                    profileTypes: {
                        "test-type": {
                            from: ["a"],
                        }
                    }
                });
            }
            uninstall(packageName);

            // Check that schema was updated, if it was supposed to update
            if (opts.schemaUpdated) {
                expect(blockMocks.ConfigSchema.buildSchema).toHaveBeenCalled();
                expect(blockMocks.ConfigSchema.updateSchema).toHaveBeenCalled();
                expect(blockMocks.jsonfile.writeFileSync).toHaveBeenCalled();
            } else {
                expect(blockMocks.ConfigSchema.buildSchema).not.toHaveBeenCalled();
                expect(blockMocks.ConfigSchema.updateSchema).not.toHaveBeenCalled();
                expect(blockMocks.jsonfile.writeFileSync).not.toHaveBeenCalledTimes(2);
            }
        };

        it("Removes a type from the schema if the plug-in is the last source", () => {
            expectTestSchemaMgmt({ schemaUpdated: true });
        });

        it("Does not modify the schema if another source contributes to that profile type", () => {
            expectTestSchemaMgmt({ schemaUpdated: false });
        });
    });

    describe("updateAndGetRemovedTypes", () => {
        const getBlockMocks = () => {
            const configUtils = {
                readExtendersJson: jest.spyOn(ConfigUtils, "readExtendersJson"),
                writeExtendersJson: jest.spyOn(ConfigUtils, "writeExtendersJson").mockImplementation(),
            };

            return {
                configUtils
            };
        };

        const expectUpdateExtendersJson = (shouldUpdate: {
            extJson: boolean;
            schema?: boolean;
        }, extendersJson: IExtendersJsonOpts) => {
            const blockMocks = getBlockMocks();
            blockMocks.configUtils.readExtendersJson.mockReturnValue(extendersJson);

            const hasMultipleSources = extendersJson.profileTypes["some-type"].from.length > 1;
            const wasLatestSource = extendersJson.profileTypes["some-type"].latestFrom === "aPluginPackage";

            const typesToRemove = updateAndGetRemovedTypes("aPluginPackage");
            if (shouldUpdate.extJson) {
                expect(blockMocks.configUtils.writeExtendersJson).toHaveBeenCalled();
            } else {
                expect(blockMocks.configUtils.writeExtendersJson).not.toHaveBeenCalled();
                return;
            }

            const newExtendersObj = blockMocks.configUtils.writeExtendersJson.mock.calls[0][0];

            if (hasMultipleSources) {
                expect(blockMocks.configUtils.writeExtendersJson).not.toHaveBeenCalledWith(
                    expect.objectContaining({
                        profileTypes: {
                            "some-type": {
                                latestFrom: undefined
                            }
                        }
                    })
                );

                const newFrom = newExtendersObj.profileTypes["some-type"].from;
                expect(newFrom).not.toContain("aPluginPackage");
            } else {
                expect("some-type" in newExtendersObj.profileTypes).toBe(false);
            }

            if (wasLatestSource && hasMultipleSources) {
                expect(newExtendersObj.profileTypes["some-type"].latestFrom).toBeUndefined();
                expect(newExtendersObj.profileTypes["some-type"].version).toBeUndefined();
            }

            expect(typesToRemove.length > 0).toBe(shouldUpdate.schema ?? false);
        };

        it("package is only source for profile type", () => {
            expectUpdateExtendersJson({ extJson: true, schema: true }, {
                profileTypes: {
                    "some-type": {
                        from: ["aPluginPackage"],
                    }
                }
            });
        });

        it("package is latest source of profile type", () => {
            expectUpdateExtendersJson({ extJson: true }, {
                profileTypes: {
                    "some-type": {
                        from: ["aPluginPackage", "someOtherPlugin"],
                        latestFrom: "aPluginPackage"
                    }
                }
            });
        });

        it("profile type has multiple sources", () => {
            expectUpdateExtendersJson({ extJson: true }, {
                profileTypes: {
                    "some-type": {
                        from: ["aPluginPackage", "someOtherPlugin"],
                    }
                }
            });
        });

        it("returns an empty list when package does not contribute any profile types", () => {
            const blockMocks = getBlockMocks();
            blockMocks.configUtils.readExtendersJson.mockReturnValue({
                profileTypes: {
                    "some-type": {
                        from: ["anotherPkg"]
                    }
                }
            });
            expect(updateAndGetRemovedTypes("aPluginPackage").length).toBe(0);
        });
    });
});

