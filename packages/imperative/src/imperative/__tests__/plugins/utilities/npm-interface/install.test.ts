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

jest.mock("cross-spawn");
jest.mock("jsonfile");
jest.mock("find-up");
jest.mock("../../../../src/plugins/utilities/PMFConstants");
jest.mock("../../../../src/plugins/PluginManagementFacility");
jest.mock("../../../../src/ConfigurationLoader");
jest.mock("../../../../src/UpdateImpConfig");
jest.mock("../../../../../config/src/ConfigSchema");
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
import { IImperativeConfig } from "../../../../src/doc/IImperativeConfig";
import { install } from "../../../../src/plugins/utilities/npm-interface";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { IPluginJsonObject } from "../../../../src/plugins/doc/IPluginJsonObject";
import { Logger } from "../../../../../logger";
import { PMFConstants } from "../../../../src/plugins/utilities/PMFConstants";
import { readFileSync, writeFileSync } from "jsonfile";
import { sync } from "find-up";
import { getPackageInfo, installPackages } from "../../../../src/plugins/utilities/NpmFunctions";
import { ConfigSchema } from "../../../../../config/src/ConfigSchema";
import { PluginManagementFacility } from "../../../../src/plugins/PluginManagementFacility";
import { AbstractPluginLifeCycle } from "../../../../src/plugins/AbstractPluginLifeCycle";
import { ConfigurationLoader } from "../../../../src/ConfigurationLoader";
import { UpdateImpConfig } from "../../../../src/UpdateImpConfig";
import * as fs from "fs";
import * as path from "path";


function setResolve(toResolve: string, resolveTo?: string) {
    expectedVal = toResolve;
    returnedVal = resolveTo;
}

describe("PMF: Install Interface", () => {
    // Objects created so types are correct.
    const pmfI = PluginManagementFacility.instance;
    const mocks = {
        installPackages: installPackages as Mock<typeof installPackages>,
        readFileSync: readFileSync as Mock<typeof readFileSync>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>,
        sync: sync as Mock<typeof sync>,
        getPackageInfo: getPackageInfo as Mock<typeof getPackageInfo>,
        ConfigSchema_updateSchema: ConfigSchema.updateSchema as Mock<typeof ConfigSchema.updateSchema>,
        PMF_requirePluginModuleCallback: pmfI.requirePluginModuleCallback as Mock<typeof pmfI.requirePluginModuleCallback>,
        ConfigurationLoader_load: ConfigurationLoader.load as Mock<typeof ConfigurationLoader.load>,
        UpdateImpConfig_addProfiles: UpdateImpConfig.addProfiles as Mock<typeof UpdateImpConfig.addProfiles>,
        path: path as Mock<typeof path>
    };

    const packageName = "a";
    const packageVersion = "1.2.3";
    const packageRegistry = "https://registry.npmjs.org/";

    beforeEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.clearAllMocks();
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
        mocks.ConfigurationLoader_load.mockReturnValue({ profiles: ["fake"] });
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
    const wasNpmInstallCallValid = (expectedPackage: string, expectedRegistry: string, updateSchema?: boolean) => {
        expect(mocks.installPackages).toHaveBeenCalledWith(PMFConstants.instance.PLUGIN_INSTALL_LOCATION,
            expectedRegistry, expectedPackage);
        shouldUpdateSchema(updateSchema ?? true);
    };

    /**
     * Validates that plugins install call updates the global schema.
     */
    const shouldUpdateSchema = (shouldUpdate: boolean) => {
        expect(mocks.PMF_requirePluginModuleCallback).toHaveBeenCalledTimes(1);
        expect(mocks.ConfigurationLoader_load).toHaveBeenCalledTimes(1);

        if (shouldUpdate) {
            expect(mocks.UpdateImpConfig_addProfiles).toHaveBeenCalledTimes(1);
            expect(mocks.ConfigSchema_updateSchema).toHaveBeenCalledTimes(1);
            expect(mocks.ConfigSchema_updateSchema).toHaveBeenCalledWith({ layer: "global" });
        } else {
            expect(mocks.UpdateImpConfig_addProfiles).not.toHaveBeenCalled();
            expect(mocks.ConfigSchema_updateSchema).not.toHaveBeenCalled();
        }
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

        it("should install plugin that does not define profiles", async () => {
            mocks.ConfigurationLoader_load.mockReturnValueOnce({});
            setResolve(packageName);
            await install(packageName, packageRegistry);

            // Validate the install
            wasNpmInstallCallValid(packageName, packageRegistry, false);
            wasWriteFileSyncCallValid({}, packageName, {
                package: packageName,
                registry: packageRegistry,
                version: packageVersion
            });
        });
    }); // end Basic install

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
    }); // end Advanced install

    describe("callPluginPostInstall", () => {
        const knownCredMgr = "@zowe/secrets-for-kubernetes-for-zowe-cli";
        const postInstallErrText = "Pretend that the plugin's postInstall function threw an error";
        let callPluginPostInstall : any;
        let fakePluginConfig: IImperativeConfig;
        let installModule;
        let LifeCycleClass;
        let postInstallWorked = false;
        let requirePluginModuleCallbackSpy;

        /**
         *  Set config to reflect if a plugin has a lifecycle class.
         */
        const pluginShouldHaveLifeCycle = (shouldHaveIt: boolean): void => {
            if (shouldHaveIt) {
                fakePluginConfig = {
                    pluginLifeCycle: "fake/path/to/file/with/LC/class"
                };
            } else {
                fakePluginConfig = {
                    // no LifeCycle
                };
            }
        };

        /**
         *  Create a lifecycle class to reflect if postInstall should work or not
         */
        const postInstallShouldWork = (shouldWork: boolean): void => {
            if (shouldWork) {
                LifeCycleClass = class extends AbstractPluginLifeCycle {
                    postInstall() {
                        postInstallWorked = true;
                    }
                    preUninstall() {
                        return;
                    }
                };
            } else {
                LifeCycleClass = class extends AbstractPluginLifeCycle {
                    postInstall() {
                        throw new ImperativeError({
                            msg: postInstallErrText
                        });
                    }
                    preUninstall() {
                        return;
                    }
                };
            }
        };

        beforeAll(() => {
            // make requirePluginModuleCallback return our fake LifeCycleClass
            requirePluginModuleCallbackSpy = jest.spyOn(
                PluginManagementFacility.instance, "requirePluginModuleCallback").
                mockImplementation((_pluginName: string) => {
                    return () => {
                        return LifeCycleClass as any;
                    };
                });

            // gain access to the non-exported callPluginPostInstall function
            installModule = require("../../../../src/plugins/utilities/npm-interface/install");
            callPluginPostInstall = installModule.onlyForTesting.callPluginPostInstall;
        });

        beforeEach(() => {
            postInstallWorked = false;
        });

        it("should throw an error if a known credMgr does not implement postInstall", async () => {
            // force our plugin to have NO LifeCycle class
            pluginShouldHaveLifeCycle(false);

            let thrownErr: any;
            try {
                await callPluginPostInstall(knownCredMgr, {});
            } catch (err) {
                thrownErr = err;
            }
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain("The plugin");
            expect(thrownErr.message).toContain(
                "attempted to override the CLI Credential Manager without providing a 'pluginLifeCycle' class"
            );
            expect(thrownErr.message).toContain("The previous Credential Manager remains in place.");
        });

        it("should do nothing if a non-credMgr does not implement postInstall", async () => {
            // force our plugin to have NO LifeCycle class
            pluginShouldHaveLifeCycle(false);

            let thrownErr: any;
            try {
                await callPluginPostInstall("plugin_does_not_override_cred_mgr", {});
            } catch (err) {
                thrownErr = err;
            }
            expect(thrownErr).not.toBeDefined();
        });

        it("should call the postInstall function of a plugin", async () => {
            // force our plugin to have a LifeCycle class
            pluginShouldHaveLifeCycle(true);

            // force our plugin's postInstall function to succeed
            postInstallShouldWork(true);

            let thrownErr: any;
            try {
                await callPluginPostInstall("FakePluginPackageName", fakePluginConfig);
            } catch (err) {
                thrownErr = err;
            }
            expect(requirePluginModuleCallbackSpy).toHaveBeenCalledTimes(1);
            expect(thrownErr).not.toBeDefined();
            expect(postInstallWorked).toBe(true);
        });

        it("should catch an error from a plugin's postInstall function", async () => {
            // force our plugin to have a LifeCycle class
            pluginShouldHaveLifeCycle(true);

            // force our plugin's postInstall function to fail
            postInstallShouldWork(false);

            let thrownErr: any;
            try {
                await callPluginPostInstall("FakePluginPackageName", fakePluginConfig);
            } catch (err) {
                thrownErr = err;
            }
            expect(requirePluginModuleCallbackSpy).toHaveBeenCalledTimes(1);
            expect(postInstallWorked).toBe(false);
            expect(thrownErr).toBeDefined();
            expect(thrownErr.message).toContain(
                "Unable to perform the post-install action for plugin 'FakePluginPackageName'."
            );
            expect(thrownErr.message).toContain(postInstallErrText);
        });
    }); // end callPluginPostInstall
}); // PMF: Install Interface
