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
import Mock = jest.Mock;

jest.mock("cross-spawn");
jest.mock("jsonfile");
jest.mock("../../../../src/plugins/utilities/PMFConstants");
jest.mock("../../../../../logger");
jest.mock("../../../../../cmd/src/response/CommandResponse");
jest.mock("../../../../../cmd/src/response/HandlerResponse");

import * as fs from "fs";
import { Console } from "../../../../../console";
import { sync } from "cross-spawn";
import { ImperativeError } from "../../../../../error";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { Logger } from "../../../../../logger";
import { PMFConstants } from "../../../../src/plugins/utilities/PMFConstants";
import { readFileSync, writeFileSync } from "jsonfile";
import { findNpmOnPath } from "../../../../src/plugins/utilities/NpmFunctions";
import { uninstall } from "../../../../src/plugins/utilities/npm-interface";


describe("PMF: Uninstall Interface", () => {
    // Objects created so types are correct.
    const mocks = {
        spawnSync: sync as Mock<typeof sync>,
        readFileSync: readFileSync as Mock<typeof readFileSync>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>
    };

    const samplePackageName = "imperative-sample-plugin";
    const packageName = "a";
    const packageRegistry = "https://registry.npmjs.org/";
    const npmCmd = findNpmOnPath();

    beforeEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();

        // This needs to be mocked before running uninstall
        (Logger.getImperativeLogger as Mock<typeof Logger.getImperativeLogger>).mockReturnValue(new Logger(new Console()));
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
                stdio: ["pipe", "pipe", process.stderr]
            }
        );
    };

    /**
     * Validates that the writeFileSync was called with the proper JSON object. This object is created
     * by copying all the plugins but the uninstalled plugin and writing to plugins.json.
     */
    const wasWriteFileSyncCallValid = () => {
        // Create the object that should be sent to the command.
        const expectedObject = {
            plugin2: {
                package: "plugin1",
                registry: packageRegistry,
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
                    registry: packageRegistry,
                    version: "3.2.1"
                },
                plugin2: {
                    package: "plugin1",
                    registry: packageRegistry,
                    version: "1.2.3"
                }
            };

            mocks.readFileSync.mockReturnValue(pluginJsonFile);

            uninstall(packageName);

            // Validate the install
            wasSpawnSyncCallValid(packageName);
            wasWriteFileSyncCallValid();
        });

        it("should uninstall imperative-sample-plugin", () => {

            const pluginJsonFile: IPluginJson = {
                "imperative-sample-plugin": {
                    package: "C:\\Users\\SWAWI03\\IdeaProjects\\imperative-plugins",
                    registry: packageRegistry,
                    version: "1.0.1"
                },
                "plugin2": {
                    package: "plugin1",
                    registry: packageRegistry,
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
                    registry: packageRegistry,
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
});
