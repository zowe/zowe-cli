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
let expectedVal;
let returnedVal;

jest.mock("child_process");
jest.mock("jsonfile");
jest.mock("find-up");
jest.mock("../../../../src/plugins/utilities/PMFConstants");
jest.mock("../../../../../logger");
jest.mock("../../../../../cmd/src/response/CommandResponse");
jest.mock("../../../../../cmd/src/response/HandlerResponse");
jest.mock("../../../../src/plugins/utilities/NpmFunctions");
jest.doMock("path", () => {
    const originalPath = jest.requireActual("path");
    return {
        ...originalPath,
        resolve: (...path: string[]) => {
            if (path[0] == expectedVal) {
                return returnedVal ? returnedVal : expectedVal;
            } else {
                return originalPath.resolve(...path);
            }
        }
    };
});

import { Console } from "../../../../../console";
import { ImperativeError } from "../../../../../error";
import { install } from "../../../../src/plugins/utilities/npm-interface";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { IPluginJsonObject } from "../../../../src/plugins/doc/IPluginJsonObject";
import { Logger } from "../../../../../logger";
import { PMFConstants } from "../../../../src/plugins/utilities/PMFConstants";
import { readFileSync, writeFileSync } from "jsonfile";
import { sync } from "find-up";
import { getPackageInfo, installPackages } from "../../../../src/plugins/utilities/NpmFunctions";
import * as fs from "fs";
import * as path from "path";

function setResolve(toResolve: string, resolveTo?: string) {
    expectedVal = toResolve;
    returnedVal = resolveTo;
}

describe("PMF: Install Interface", () => {
    // Objects created so types are correct.
    const mocks = {
        installPackages: installPackages as Mock<typeof installPackages>,
        readFileSync: readFileSync as Mock<typeof readFileSync>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>,
        sync: sync as Mock<typeof sync>,
        getPackageInfo: getPackageInfo as Mock<typeof getPackageInfo>,
        path: path as Mock<typeof path>
    };

    const packageName = "a";
    const packageVersion = "1.2.3";
    const packageRegistry = "https://registry.npmjs.org/";

    beforeEach(() => {
    // Mocks need cleared after every test for clean test runs
        expectedVal = undefined;
        returnedVal = undefined;

        // This needs to be mocked before running install
        (Logger.getImperativeLogger as Mock<typeof Logger.getImperativeLogger>).mockReturnValue(new Logger(new Console()));

        /* Since install() adds new plugins into the value returned from
     * readFileSyc(plugins.json), we must reset readFileSync to return an empty set before each test.
     */
        mocks.readFileSync.mockReturnValue({});
        mocks.sync.mockReturnValue("fake_find-up_sync_result");
        jest.spyOn(path, "dirname").mockReturnValue("fake-dirname");
        jest.spyOn(path, "join").mockReturnValue("/fake/join/path");
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    /**
   * Validates that an npm install call was valid based on the parameters passed.
   *
   * @param {string} expectedPackage The package that should be sent to npm install
   * @param {string} expectedRegistry The registry that should be sent to npm install
   */
    const wasNpmInstallCallValid = (expectedPackage: string, expectedRegistry: string) => {
        expect(mocks.installPackages).toHaveBeenCalledWith(PMFConstants.instance.PLUGIN_INSTALL_LOCATION,
            expectedRegistry, expectedPackage);
    };

    /**
   * Validates that the writeFileSync was called with the proper JSON object. This object is created
   * by merging the object returned by readFileSync (should be mocked) and an object that represents
   * the new plugin added according to the plugins.json file syntax.
   *
   * @param {IPluginJson} originalJson The JSON object that was returned by readFileSync
   * @param {string} expectedName The name of the plugin that was installed
   * @param {IPluginJsonObject} expectedNewPlugin The expected object for the new plugin
   */
    const wasWriteFileSyncCallValid = (originalJson: IPluginJson, expectedName: string, expectedNewPlugin: IPluginJsonObject) => {
    // Create the object that should be sent to the command.
        const expectedObject = {
            ...originalJson
        };
        expectedObject[expectedName] = expectedNewPlugin;

        expect(mocks.writeFileSync).toHaveBeenCalledWith(
            PMFConstants.instance.PLUGIN_JSON,
            expectedObject,
            {
                spaces: 2
            }
        );
    };

    describe("Basic install", () => {
        beforeEach(() => {
            mocks.getPackageInfo.mockResolvedValue({ name: packageName, version: packageVersion });
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            jest.spyOn(path, "normalize").mockReturnValue("testing");
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isSymbolicLink: jest.fn().mockReturnValue(true)
            });
        });

        it("should install from the npm registry", async () => {
            setResolve(packageName);
            await install(packageName, packageRegistry);

            // Validate the install
            wasNpmInstallCallValid(packageName, packageRegistry);
            wasWriteFileSyncCallValid({}, packageName, {
                package: packageName,
                registry: packageRegistry,
                version: packageVersion
            });
        });

        it("should install an absolute file path", async () => {
            const rootFile = "/root/a";

            jest.spyOn(path, "isAbsolute").mockReturnValueOnce(true);
            setResolve(rootFile);
            await install(rootFile, packageRegistry);

            // Validate the install
            wasNpmInstallCallValid(rootFile, packageRegistry);
            wasWriteFileSyncCallValid({}, packageName, {
                package: rootFile,
                registry: packageRegistry,
                version: packageVersion
            });
        });

        it("should install an absolute file path with spaces", async () => {
            const rootFile = "/root/a dir/another dir/a";

            jest.spyOn(path, "isAbsolute").mockReturnValueOnce(true);
            setResolve(rootFile);
            await install(rootFile, packageRegistry);

            // Validate the install
            wasNpmInstallCallValid(rootFile, packageRegistry);
            wasWriteFileSyncCallValid({}, packageName, {
                package: rootFile,
                registry: packageRegistry,
                version: packageVersion
            });
        });

        describe("relative file path", () => {
            const relativePath = "../../install/a";
            const absolutePath = "/root/node/cli/install/a";

            // Mock these before each test here since they are common
            beforeEach(() => {
                jest.spyOn(path, "isAbsolute").mockReturnValueOnce(false);
                jest.spyOn(path, "resolve").mockReturnValueOnce(absolutePath);
            });

            it("should install a relative file path", async () => {
                // Setup mocks for install function
                jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

                // Call the install function
                setResolve(relativePath, absolutePath);
                await install(relativePath, packageRegistry);

                // Validate results
                wasNpmInstallCallValid(absolutePath, packageRegistry);
                wasWriteFileSyncCallValid({}, packageName, {
                    package: absolutePath,
                    registry: packageRegistry,
                    version: packageVersion
                });
            });
        });

        it("should install from a url", async () => {
            const installUrl = "http://www.example.com";
            setResolve(installUrl);

            // mocks.isUrl.mockReturnValue(true);

            await install(installUrl, packageRegistry);

            wasNpmInstallCallValid(installUrl, packageRegistry);
            wasWriteFileSyncCallValid({}, packageName, {
                package: installUrl,
                registry: packageRegistry,
                version: packageVersion
            });
        });
    });

    describe("Advanced install", () => {
        it("should write even when install from file is true", async () => {
            // This test is constructed in such a way that all if conditions with installFromFile
            // are validated to have been called or not.
            const location = "/this/should/not/change";

            jest.spyOn(path, "isAbsolute").mockReturnValueOnce(false);
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            mocks.getPackageInfo.mockResolvedValue({ name: packageName, version: packageVersion });
            jest.spyOn(path, "normalize").mockReturnValue("testing");
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isSymbolicLink: jest.fn().mockReturnValue(true)
            });

            await install(location, packageRegistry, true);

            wasNpmInstallCallValid(location, packageRegistry);
            expect(mocks.writeFileSync).toHaveBeenCalled();
        });

        it("should accept semver properly", async () => {
            const semverVersion = "^1.5.2";
            const semverPackage = `${packageName}@${semverVersion}`;

            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            jest.spyOn(path, "normalize").mockReturnValue("testing");
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isSymbolicLink: jest.fn().mockReturnValue(true)
            });

            // While this doesn't replicate the function, we are installing an npm package
            // so it is shorter to just skip the if condition in install.
            jest.spyOn(path, "isAbsolute").mockReturnValueOnce(true);

            // This is valid under semver ^1.5.2
            mocks.getPackageInfo.mockResolvedValue({ name: packageName, version: "1.5.16" });

            // Call the install
            setResolve(semverPackage);
            await install(semverPackage, packageRegistry);

            // Test that shit happened
            wasNpmInstallCallValid(semverPackage, packageRegistry);
            wasWriteFileSyncCallValid({}, packageName, {
                package: packageName,
                registry: packageRegistry,
                version: semverVersion
            });
        });

        it("should merge contents of previous json file", async () => {
            // value for our previous plugins.json
            const oneOldPlugin: IPluginJson = {
                plugin1: {
                    package: "plugin1",
                    registry: packageRegistry,
                    version: "1.2.3"
                }
            };

            mocks.getPackageInfo.mockResolvedValue({ name: packageName, version: packageVersion });
            jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            jest.spyOn(path, "normalize").mockReturnValue("testing");
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isSymbolicLink: jest.fn().mockReturnValue(true)
            });
            mocks.readFileSync.mockReturnValue(oneOldPlugin);

            setResolve(packageName);
            await install(packageName, packageRegistry);

            wasNpmInstallCallValid(packageName, packageRegistry);
            wasWriteFileSyncCallValid(oneOldPlugin, packageName, {
                package: packageName,
                registry: packageRegistry,
                version: packageVersion
            });
        });

        it("should throw errors", async () => {
            const error = new Error("This should be caught");

            mocks.installPackages.mockImplementation(() => {
                throw error;
            });

            // Create a placeholder error object that should be set after the call to install
            let expectedError: ImperativeError;

            try {
                await install("test", "http://www.example.com");
            } catch (e) {
                expectedError = e;
            }

            // Check that the expected ImperativeError was thrown
            expect(expectedError).toEqual(new ImperativeError({
                msg: error.message,
                causeErrors: error
            }));
        });
    });
});
