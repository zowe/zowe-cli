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

/**
 * @file Integration tests for installing plugins through the Plugin Management Facility.
 */

import * as T from "../../../../../src/TestUtil";
import { join, resolve } from "path";
import { TEST_REGISTRY } from "../../../../../__src__/TestConstants";
import { execSync, SpawnSyncReturns } from "child_process";

import { config, cliBin, pluginGroup } from "../PluginTestConstants";
import { CredentialManagerOverride } from "../../../../../../packages/security/src/CredentialManagerOverride";
import { readFileSync, writeFileSync } from "jsonfile";
import { IPluginJson } from "../../../../../../packages/imperative/src/plugins/doc/IPluginJson";
import { SetupTestEnvironment } from "../../../../../__src__/environment/SetupTestEnvironment";
import * as fs from "fs";
import { readJsonSync, writeJsonSync } from "fs-extra";

describe("Installing Plugins", () => {
    /**
     * This object describes the format of the plugins variable
     */
    interface ITestPluginStructure {
        /**
         * This object describes the format of the plugins variable
         */
        [key: string]: {
            /**
             * The location (or path to install) of a plugin. For anything on a registry, this should be the same as the name
             * stored in the registry.
             */
            location: string,

            /**
             * This is the name of the package.
             *
             * For local files we don't get this automatically from the file path.
             * For registry plugins, this is the same as the plugin location.
             */
            name: string,

            /**
             * This is ultimately how the plugin is added to the cli. IE the top level
             * name that gets invoked
             */
            usage: string
        };
    }

    const plugins: ITestPluginStructure = {
        normal: {
            location: join(__dirname, "../", "test_plugins", "normal_plugin"),
            name: "normal-plugin",
            usage: "normal-plugin"
        },
        normal2: {
            location: join(__dirname, "../", "test_plugins", "normal_plugin_2"),
            name: "normal-plugin-2",
            usage: "normal-plugin-2"
        },
        normal3: {
            location: join(__dirname, "../", "test_plugins", "normal_plugin_3"),
            name: "normal-plugin-3",
            usage: "normal-plugin-3"
        },
        space_in_path: {
            location: join(__dirname, "../", "test_plugins", "space in path plugin"),
            name: "space-in-path-plugin",
            usage: "space-in-path-plugin"
        },
        override: {
            location: join(__dirname, "../", "test_plugins", "override_plugin"),
            name: "override-plugin",
            usage: "override-plugin"
        },
        registry: {
            location: "imperative-sample-plugin",
            name: "imperative-sample-plugin",
            usage: "sample-plugin"
        }
    };

    /**
     * Location of the saved plugins.json file for test purposes
     * @type {string}
     */
    const pluginJsonLocation = join(config.defaultHome, "plugins", "plugins.json");

    /**
     * Takes a string and splits it into an array on spaces before sending to the test cli function.
     *
     * @param {*}      context The test context (this of test instance)
     * @param {string} cmd     The command to execute on the Test CLI
     * @returns {SpawnSyncReturns<string>} The result of the command execution
     */
    const executeCommandString = (context: any, cmd: string): SpawnSyncReturns<string> =>
        T.executeTestCLICommand(cliBin, context, cmd.split(" "));

    /**
     * The registry from the user's environment, which is used when an explicit registry is not supplied.
     * @type {string}
     */
    let envNpmRegistry: string = "";

    /**
     * Specifies whether warnings about missing peer dependencies should be
     * expected in stderr output of `npm install`. This defaults to true and is
     * set to false if version 7 or newer of NPM is detected.
     * @type {boolean}
     */
    let peerDepWarning: boolean = true;

    const defaultCredMgrDisplayNm = "TestCLI";
    const knownCredMgr = CredentialManagerOverride.getKnownCredMgrs()[1];
    const knownCredMgrDisplayNm = knownCredMgr.credMgrDisplayName as string;
    const knownCredMgrPluginNm = knownCredMgr.credMgrPluginName as string;

    /**
     * Change the pluginLifeCycle property in a plugin's Imperative configuration
     * that is located in the plugin's package.json file.
     *
     * @param {string} pluginLoc    The location of the desired plugin
     * @param {string} desiredChange One of the follwoing strings:
     *      "goodLifeCycle", "unknownName",  "noPostInstall", "noPreUnininstall", or "remove"
     */
    const changeLifeCycleInPkgJson = (pluginLoc: string, desiredChange: string): void => {
        const pkgFileNm = join(pluginLoc, "package.json");

        const pkgContents = readJsonSync(pkgFileNm);
        if (desiredChange === "goodLifeCycle") {
            pkgContents.imperative.pluginLifeCycle = "./lib/sample-plugin/lifeCycle/class_good_lifeCycle";

        } else if (desiredChange === "unknownName") {
            pkgContents.imperative.pluginLifeCycle = "./lib/sample-plugin/lifeCycle/class_unknown_name";

        } else if (desiredChange === "noPostInstall") {
            pkgContents.imperative.pluginLifeCycle = "./lib/sample-plugin/lifeCycle/class_no_post_install";

        } else if (desiredChange === "noPreUnininstall") {
            pkgContents.imperative.pluginLifeCycle = "./lib/sample-plugin/lifeCycle/class_no_pre_uninstall";

        } else if (desiredChange === "remove") {
            delete pkgContents.imperative.pluginLifeCycle;

        } else {
            throw new Error(`An invalid parm '${desiredChange}' was passed to changeLifeCycleInPkgJson.`);
        }

        writeJsonSync(pkgFileNm, pkgContents, {spaces: 2});
    };

    /**
     * Change the name property in a plugin's package.json file.
     *
     * @param {string} pluginLoc
     *      The location of the desired plugin.
     * @param {string} desiredName
     *      The name to set inside package.json for a desired test.
     */
    const changeNameInPkgJson = (pluginLoc: string, desiredName: string): void => {
        const pkgFileNm = join(pluginLoc, "package.json");
        const pkgContents = readJsonSync(pkgFileNm);
        pkgContents.name = desiredName;
        writeJsonSync(pkgFileNm, pkgContents, {spaces: 2});
    };

    /**
     * Get the currently configured credential manager display name.
     *
     * @returns {string} The display name of the currrent credential manager.
     */
    const getCurrCredMgr = (): string => {
        const settingsFileNm = join(config.defaultHome, "settings", "imperative.json");
        const settingsContents = readJsonSync(settingsFileNm);
        return settingsContents.overrides.CredentialManager;
    };

    /**
     * Set the credential manager to the specified display name.
     */
    const setCurrCredMgr = (newCredMgrName: string): void => {
        const settingsFileNm = join(config.defaultHome, "settings", "imperative.json");
        const settingsContents = readJsonSync(settingsFileNm);
        settingsContents.overrides.CredentialManager = newCredMgrName;
        writeJsonSync(settingsFileNm, settingsContents, {spaces: 2});
    };

    beforeAll(() => {
        envNpmRegistry = execSync("npm config get registry").toString().trim();
        peerDepWarning = parseInt(execSync("npm --version").toString().trim().split(".")[0], 10) < 7;
    });

    beforeEach(() => {
        // ensure that each test starts with no installed plugins
        T.rimraf(pluginJsonLocation);
    });

    /**
     * This test was purposely commented out. The CICD pipeline cannot synchronize two different
     * repos: imperative and imperative-plugins in master, since plugins is used to perform the
     * tests that permit cli to be merged into master.
     *
     * If you want to do a quick manual test using an npm registry, you can uncomment
     * this block. Just be sure to re-comment it before committing this file.
     */
    // eslint-disable-next-line jest/no-commented-out-tests
    // it("should install the sample plugin from the registry", function(){
    //     const result = executeCommandString(this, `${pluginGroup} install ${plugins.registry.location} --registry ${TEST_REGISTRY}`);
    //     console.log(result);
    //     expect(result.stderr).toEqual("");

    //     const strippedOutput = T.stripNewLines(result.stdout);
    //     expect(strippedOutput).toContain("Registry = " + TEST_REGISTRY);
    //     expect(strippedOutput).toContain(`Installed plugin = '${plugins.registry.name}'`);
    //     expect(strippedOutput).toContain("Installation of the npm package(s) was successful.");
    // });

    it("should install a plugin from a file location - no space in path", function () {
        const originalEnvHome = process.env.ZOWE_CLI_HOME;
        // Not sure if this needs done for all integration tests to simulate that
        // --global-config will point to the __results__ directory created for the test
        process.env.ZOWE_CLI_HOME = config.defaultHome;

        let result = executeCommandString(this, "--help");
        const appPrefix = resolve(config.defaultHome, config.name);

        // Verify that the sample plugin isn't there
        expect(result.stderr).toEqual("");
        expect(result.stdout).not.toContain(plugins.normal.usage);

        result = executeCommandString(this, "config init --global-config --prompt false");
        expect(result.stderr).toEqual("");
        expect(result.stdout).toContain(`Saved config template to ${appPrefix + ".config.json"}`);

        expect(fs.readFileSync(appPrefix + ".schema.json").toString()).not.toContain(plugins.normal.name);

        // Now go ahead and install the sample
        result = executeCommandString(this, `${pluginGroup} install ${plugins.normal.location}`);
        expect(fs.readFileSync(appPrefix + ".schema.json").toString()).toContain(plugins.normal.name);
        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }

        const strippedOutput = T.stripNewLines(result.stdout);
        expect(strippedOutput).toContain("Registry = " + envNpmRegistry);
        expect(strippedOutput).toContain(`Installed plugin name = '${plugins.normal.name}'`);

        // Now verify that it got added to the tree
        result = executeCommandString(this, "--help");

        expect(result.stderr).toEqual("");
        expect(result.stdout).toContain(plugins.normal.usage);

        process.env.ZOWE_CLI_HOME = originalEnvHome;
    });

    it("should fail when a credMgr override plugin has no pluginLifeCycle property", function () {
        /* The override test plugin has no pluginLifeCycle property specified in package.json.
         * Change our plugin name to be a known credMgr.
         */
        changeNameInPkgJson(plugins.override.location, knownCredMgrPluginNm);

        // Verify that the sample plugin isn't there
        let result = executeCommandString(this, "--help");
        expect(result.stderr).toEqual("");
        expect(result.stdout).not.toContain(plugins.override.usage);

        // install the plugin
        result = executeCommandString(this, `${pluginGroup} install ${plugins.override.location}`);

        expect(result.stderr).toContain(
            `The plugin '${knownCredMgrPluginNm}' attempted to override ` +
            `the CLI Credential Manager without providing a 'pluginLifeCycle' class.`
        );

        // revert back to our original plugin name for future tests
        changeNameInPkgJson(plugins.override.location, plugins.override.name);

        // settings/imperative.json should still contain the default credMgr
        expect(getCurrCredMgr()).toEqual(defaultCredMgrDisplayNm);

        // confirm it was installed even though it did not override during postInstall
        result = executeCommandString(this, "--help");
        expect(result.stderr).toEqual("");
        expect(result.stdout).toContain(plugins.override.usage);
    });

    it("should fail to override credential manager with unknown credMgr", function () {
        // Set the path to a lifecycle class with an unknown credMgr name
        changeLifeCycleInPkgJson(plugins.override.location, "unknownName");

        // Verify that the sample plugin isn't there
        let result = executeCommandString(this, "--help");
        expect(result.stderr).toEqual("");
        expect(result.stdout).not.toContain(plugins.override.usage);

        // install the plugin
        result = executeCommandString(this, `${pluginGroup} install ${plugins.override.location}`);

        // Now that we have installed, remove lifecycle option for future tests
        changeLifeCycleInPkgJson(plugins.override.location, "remove");

        expect(result.stderr).toContain(
            `Unable to perform the post-install action for plugin '${plugins.override.name}'.`
        );
        expect(result.stderr).toContain("Reason: The credential manager name");
        expect(result.stderr).toContain("is an unknown credential manager.");

        // settings/imperative.json should still contain the default credMgr
        expect(getCurrCredMgr()).toEqual(defaultCredMgrDisplayNm);

        // confirm it was installed even though it did not override during postInstall
        result = executeCommandString(this, "--help");
        expect(result.stderr).toEqual("");
        expect(result.stdout).toContain(plugins.override.usage);
    });

    it("should fail when a credMgr override plugin has no postInstall function", function () {
        // Set the path to a lifecycle class that has no postInstall
        changeLifeCycleInPkgJson(plugins.override.location, "noPostInstall");

        // Verify that the sample plugin isn't there
        let result = executeCommandString(this, "--help");
        expect(result.stderr).toEqual("");
        expect(result.stdout).not.toContain(plugins.override.usage);

        // install the plugin
        result = executeCommandString(this, `${pluginGroup} install ${plugins.override.location}`);

        // Now that we have installed, remove lifecycle option for future tests
        changeLifeCycleInPkgJson(plugins.override.location, "remove");

        expect(result.stderr).toContain("Install Failed");
        expect(result.stderr).toContain(`Unable to perform the post-install action for plugin '${plugins.override.name}'.`);
        expect(result.stderr).toContain("Reason: lifeCycleInstance.postInstall is not a function");

        // settings/imperative.json should still contain the default credMgr
        expect(getCurrCredMgr()).toEqual(defaultCredMgrDisplayNm);

        // confirm it was installed even though it did not override during postInstall
        result = executeCommandString(this, "--help");
        expect(result.stderr).toEqual("");
        expect(result.stdout).toContain(plugins.override.usage);
    });

    it("should successfully override the credMgr with a valid override plugin", function () {
        // set the path to a working lifecycle class
        changeLifeCycleInPkgJson(plugins.override.location, "goodLifeCycle");

        // Verify that the sample plugin isn't there
        let result = executeCommandString(this, "--help");
        expect(result.stderr).toEqual("");
        expect(result.stdout).not.toContain(plugins.override.usage);

        // install the plugin
        result = executeCommandString(this, `${pluginGroup} install ${plugins.override.location}`);

        // Now that we have installed, remove lifecycle option for future tests
        changeLifeCycleInPkgJson(plugins.override.location, "remove");

        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }

        // settings/imperative.json should now contain the override name that we specified
        expect(getCurrCredMgr()).toEqual(knownCredMgrDisplayNm);

        // set the credMgr override name back to the default for future tests
        setCurrCredMgr(defaultCredMgrDisplayNm);

        const strippedOutput = T.stripNewLines(result.stdout);
        expect(strippedOutput).toContain("Registry = " + envNpmRegistry);
        expect(strippedOutput).toContain(`Installed plugin name = '${plugins.override.name}'`);

        // confirm it was installed
        result = executeCommandString(this, "--help");
        expect(result.stderr).toEqual("");
        expect(result.stdout).toContain(plugins.override.usage);
    });

    it("should install multiple plugins at the same time", function () {

        // Verify that nothing currently exists
        let result = executeCommandString(this, "--help");

        expect(result.stderr).toEqual("");
        expect(result.stdout).not.toContain(plugins.normal.usage);
        expect(result.stdout).not.toContain(plugins.normal2.usage);

        // Now check that they install
        result = executeCommandString(this,
            `${pluginGroup} install ${plugins.normal.location} ${plugins.normal2.location} --registry ${TEST_REGISTRY}`);
        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }

        const strippedOutput = T.stripNewLines(result.stdout);
        expect(strippedOutput).toContain("Registry = " + TEST_REGISTRY);
        expect(strippedOutput).toContain(`Installed plugin name = '${plugins.normal.name}'`);
        expect(strippedOutput).toContain(`Installed plugin name = '${plugins.normal2.name}'`);

        // Check that the commands were added to the tree
        result = executeCommandString(this, "--help");

        expect(result.stderr).toEqual("");
        expect(result.stdout).toContain(plugins.normal.usage);
        expect(result.stdout).toContain(plugins.normal2.usage);
    });

    it("should re-install plugins using files in the cli home directory", function () {

        // check before install, and after
        const beforeInstall = executeCommandString(this, "--help");
        let result = executeCommandString(this, `${pluginGroup} install ${plugins.normal.location}`);
        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }

        let strippedOutput = T.stripNewLines(result.stdout);
        expect(strippedOutput).toContain("Registry = " + envNpmRegistry);
        expect(strippedOutput).toContain(`Installed plugin name = '${plugins.normal.name}'`);

        const afterInstall = executeCommandString(this, "--help");
        expect(afterInstall.stdout).toContain(plugins.normal.usage);

        // Remove the installed plugins for testing
        T.rimraf(join(config.defaultHome, "plugins", "installed"));

        result = executeCommandString(this, "--help");
        expect(result.stdout).toEqual(beforeInstall.stdout);

        // Try to install it back by using the plugins.json file that should still exist
        result = executeCommandString(this, `${pluginGroup} install`);
        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }

        strippedOutput = T.stripNewLines(result.stdout);
        expect(strippedOutput).toContain("Registry = " + envNpmRegistry);
        expect(strippedOutput).toContain(`Installed plugin name = '${plugins.normal.name}'`);

        result = executeCommandString(this, "--help");
        expect(result.stdout).toEqual(afterInstall.stdout);
    });

    it("should install a plugin from a file location that contain space in it path", function () {

        let result = executeCommandString(this, "--help");

        // Verify that the sample plugin isn't there
        expect(result.stderr).toEqual("");
        expect(result.stdout).not.toContain(plugins.normal.usage);

        // Now go ahead and install the sample
        result = T.executeTestCLICommand(cliBin, this, [pluginGroup, "install", plugins.space_in_path.location]);
        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }

        const strippedOutput = T.stripNewLines(result.stdout);
        expect(strippedOutput).toContain("Registry = " + envNpmRegistry);
        expect(strippedOutput).toContain(`Installed plugin name = '${plugins.space_in_path.name}'`);

        // Now verify that it got added to the tree
        result = executeCommandString(this, "--help");

        expect(result.stderr).toEqual("");
        expect(result.stdout).toContain(plugins.space_in_path.usage);
    });

    describe("Injection Tests", () => {
        let TEST_ENVIRONMENT;
        beforeEach(async () => {
            TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
                cliHomeEnvVar: "PLUGINS_TEST_CLI_HOME",
                testName: "test_plugin_install"
            });
        });

        afterEach(() => {
            T.rimraf(join(TEST_ENVIRONMENT.workingDir, '";touch test.txt;"'));
        });

        it("should fail to install a plugin from a file location with a command in it 1", async function(){
            const result = T.runCliScript(join(__dirname, "__scripts__", "injectionTestInstall1.sh"), TEST_ENVIRONMENT.workingDir, [cliBin]);
            delete process.env.PLUGINS_TEST_CLI_HOME;
            expect(result.stderr.toString()).toContain("invalid config Must be");
            expect(result.stderr.toString()).toContain("full url");

            const strippedOutput = T.stripNewLines(result.stdout.toString());
            expect(strippedOutput).toContain("Username:");
            expect(fs.existsSync(join(TEST_ENVIRONMENT.workingDir, "test.txt"))).not.toEqual(true);
        });

        it("should fail to install a plugin from a file location with a command in it 2", async function(){
            const result = T.runCliScript(join(__dirname, "__scripts__", "injectionTestInstall2.sh"), TEST_ENVIRONMENT.workingDir, [cliBin], {
                PLUGINS_TEST_CLI_HOME: join(TEST_ENVIRONMENT.workingDir, '";touch test.txt;"')
            });
            delete process.env.PLUGINS_TEST_CLI_HOME;
            expect(fs.existsSync(join(TEST_ENVIRONMENT.workingDir, '";touch test.txt;"', "plugins", "test.txt"))).not.toEqual(true);
        });

        it("should fail to install a plugin from a file location with a command in it 3", async function(){
            const result = T.runCliScript(join(__dirname, "__scripts__", "injectionTestInstall2.sh"), TEST_ENVIRONMENT.workingDir, [cliBin], {
                PLUGINS_TEST_CLI_HOME: TEST_ENVIRONMENT.workingDir,
                PLUGINS_TEST_CLI_PLUGINS_DIR: join(TEST_ENVIRONMENT.workingDir, '";touch test.txt;"')
            });
            delete process.env.PLUGINS_TEST_CLI_HOME;
            delete process.env.PLUGINS_TEST_CLI_PLUGINS_DIR;
            expect(fs.existsSync(join(TEST_ENVIRONMENT.workingDir, '";touch test.txt;"', "test.txt"))).not.toEqual(true);
        });
    });

    /**
     * Again we purposely commented out this test because versioning uses a registry,
     * which is problematic for a CICD pipeline.
     *
     * If you want to do a quick manual test using an npm registry, you can uncomment
     * this block. Just be sure to re-comment it before committing this file.
     */
    /* eslint-disable jest/no-commented-out-tests */
    // describe("versioning", () => {
    //     it("should install a strict version", function(){
    //     const version = "1.0.2";

    //     let result = executeCommandString(this, "--help");

    //     expect(result.stderr).toEqual("");
    //     expect(result.stdout).not.toContain(plugins.registry.usage);

    //     // Install the plugin with a version
    //     result = executeCommandString(this, `${pluginGroup} install ${plugins.registry.location}@${version} --registry ${TEST_REGISTRY}`);

    //     expect(result.stderr).toEqual("");
    //     expect(result.stdout).toContain("successful");
    //     result = executeCommandString(this, "--help");
    //     expect(result.stderr).toEqual("");
    //     expect(result.stdout).toContain(plugins.registry.usage);
    //     const actualJson = readFileSync(pluginJsonLocation);
    //     const expectedJson: IPluginJson = {
    //         [plugins.registry.name]: {
    //         package: plugins.registry.location,
    //         registry: TEST_REGISTRY,
    //         version
    //         }
    //     };
    //     expect(actualJson).toEqual(expectedJson);
    //     });
    //     it("should install preserving semver", function(){
    //     const version = "^1.0.0";
    //     let result = executeCommandString(this, "--help");
    //     expect(result.stderr).toEqual("");
    //     expect(result.stdout).not.toContain(plugins.registry.usage);
    //     // Install the plugin with a version
    //     result = executeCommandString(this, `${pluginGroup} install ${plugins.registry.location}@${version} --registry ${TEST_REGISTRY}`);
    //     expect(result.stderr).toEqual("");
    //     expect(result.stdout).toContain("successful");
    //     result = executeCommandString(this, "--help");
    //     expect(result.stderr).toEqual("");
    //     expect(result.stdout).toContain(plugins.registry.usage);
    //     const actualJson = readFileSync(pluginJsonLocation);
    //     const expectedJson: IPluginJson = {
    //         [plugins.registry.name]: {
    //         package: plugins.registry.location,
    //         registry: TEST_REGISTRY,
    //         version
    //         }
    //     };
    //     expect(actualJson).toEqual(expectedJson);
    //     });
    // });

    describe("providing a plugin json", () => {
        let testFile: string;
        let fileContent: object;

        // Create a plugin.json file before each test
        beforeEach(() => {
            testFile = join(__dirname, "sample-plugin.json");
            fileContent = {
                [plugins.normal.name]: {
                    package: plugins.normal.location,
                    version: "1.0.1"
                },
                [plugins.normal2.name]: {
                    package: plugins.normal2.location,
                    registry: TEST_REGISTRY,
                    version: "1.0.2"
                },
            };

            writeFileSync(testFile, fileContent, {
                spaces: 2
            });
        });

        // Remove the file after each test is complete
        afterEach(() => {
            T.rimraf(testFile);
        });

        it("should install using the created plugin json file", function () {

            // Check that the plugins aren't there
            let result = executeCommandString(this, "--help");

            expect(result.stderr).toEqual("");
            expect(result.stdout).not.toContain(plugins.normal.usage);
            expect(result.stdout).not.toContain(plugins.normal2.usage);

            // Check that the plugins got installed
            result = executeCommandString(this, `${pluginGroup} install --file ${testFile}`);
            const strippedOutput = T.stripNewLines(result.stdout);

            if (peerDepWarning) {
                expect(result.stderr).toMatch(/npm.*WARN/);
                expect(result.stderr).toContain("requires a peer of @zowe/imperative");
                expect(result.stderr).toContain("You must install peer dependencies yourself");
            } else {
                expect(result.stderr).toEqual("");
            }

            expect(strippedOutput).toContain(`Installed plugin name = '${plugins.normal.name}'`);
            expect(strippedOutput).toContain(`Installed plugin name = '${plugins.normal2.name}'`);

            // Check that the plugins are now there
            result = executeCommandString(this, "--help");
            expect(result.stderr).toEqual("");
            expect(result.stdout).toContain(plugins.normal.usage);
            expect(result.stdout).toContain(plugins.normal2.usage);

            // Check that the file in the home directory is of the proper format
            const savedPluginJson = readFileSync(pluginJsonLocation);
            const expectedContent: IPluginJson = fileContent as IPluginJson;

            expectedContent[plugins.normal.name].registry = envNpmRegistry;

            expect(savedPluginJson).toEqual(expectedContent);
        });

        it("should merge a plugins.json provided with one that is already managed", function () {

            const initialVersion = "1.0.2";

            let result = executeCommandString(this, "--help");

            expect(result.stderr).toEqual("");
            expect(result.stdout).not.toContain(plugins.normal.usage);
            expect(result.stdout).not.toContain(plugins.normal2.usage);
            expect(result.stdout).not.toContain(plugins.normal3.usage);

            // Now seed the install with normal and normal3
            result = executeCommandString(
                this,
                `${pluginGroup} install ${plugins.normal.location} ${plugins.normal3.location} --registry ${TEST_REGISTRY}`
            );

            if (peerDepWarning) {
                expect(result.stderr).toMatch(/npm.*WARN/);
                expect(result.stderr).toContain("requires a peer of @zowe/imperative");
                expect(result.stderr).toContain("You must install peer dependencies yourself");
            } else {
                expect(result.stderr).toEqual("");
            }

            expect(result.stdout).toContain(plugins.normal.name);
            expect(result.stdout).toContain(plugins.normal3.name);
            expect(result.stdout).toContain("Installed plugin name =");

            // verify that they were added to the top level
            result = executeCommandString(this, "--help");

            expect(result.stderr).toEqual("");
            expect(result.stdout).toContain(plugins.normal.usage);
            expect(result.stdout).toContain(plugins.normal3.usage);

            // Now install from the file and verify that everything exists
            result = executeCommandString(this, `${pluginGroup} install --file ${testFile}`);

            if (peerDepWarning) {
                expect(result.stderr).toMatch(/npm.*WARN/);
                expect(result.stderr).toContain("requires a peer of @zowe/imperative");
                expect(result.stderr).toContain("You must install peer dependencies yourself");
            } else {
                expect(result.stderr).toEqual("");
            }

            expect(result.stdout).toContain(plugins.normal.name);
            expect(result.stdout).toContain(plugins.normal2.name);
            expect(result.stdout).not.toContain(plugins.normal3.name);

            result = executeCommandString(this, "--help");

            expect(result.stderr).toEqual("");
            expect(result.stdout).toContain(plugins.normal.usage);
            expect(result.stdout).toContain(plugins.normal2.usage);
            expect(result.stdout).toContain(plugins.normal3.usage);

            // Now compare that the files are correct
            const expectedJson: IPluginJson = fileContent as IPluginJson;
            const actualJson = readFileSync(pluginJsonLocation);

            // Add missing registry to expected
            expectedJson[plugins.normal.name].registry = envNpmRegistry;

            // Add missing normal2 plugin not present in before each
            expectedJson[plugins.normal3.name] = {
                package: plugins.normal3.location,
                registry: TEST_REGISTRY,
                version: "1.0.3"
            };

            // Now compare the objects
            expect(actualJson).toEqual(expectedJson);
        });

        it("should error when a package and --file is specified", function () {
            expect(
                T.stripNewLines(
                    executeCommandString(this, `${pluginGroup} install ${plugins.registry.location} --file ${testFile}`).stderr
                )
            ).toContain("Option --file can not be specified if positional package... is as well. They are mutually exclusive.");
        });

        it("should error when --file and --registry are specified", function () {
            expect(
                T.stripNewLines(
                    executeCommandString(this,
                        `${pluginGroup} install ${plugins.registry.location} --file ${testFile} --registry ${TEST_REGISTRY}`).stderr
                )
            ).toContain("The following options conflict (mutually exclusive)");
        });
    });
});
