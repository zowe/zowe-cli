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

import { join } from "path";
import * as T from "../../../../../src/TestUtil";
import { TEST_REGISTRY } from "../../../../../__src__/TestConstants";
import { execSync, SpawnSyncReturns } from "child_process";

import { config, cliBin, pluginGroup } from "../PluginManagementFacility.spec";
import { readFileSync, writeFileSync } from "jsonfile";
import { IPluginJson } from "../../../../../../packages/imperative/src/plugins/doc/IPluginJson";
import { existsSync } from "fs";
import { SetupTestEnvironment } from "../../../../../__src__/environment/SetupTestEnvironment";
import * as rimraf from "rimraf";

describe("Installing Plugins", () => {
    /**
     * This object describes the format of the plugins variable
     */
    interface ITestPluginStructure {
        /**
         * The keys represent the type of plugin, so for now we have a registry and normal plugin
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
            name    : "normal-plugin",
            usage   : "normal-plugin"
        },
        normal2: {
            location: join(__dirname, "../", "test_plugins", "normal_plugin_2"),
            name    : "normal-plugin-2",
            usage   : "normal-plugin-2"
        },
        normal3: {
            location: join(__dirname, "../", "test_plugins", "normal_plugin_3"),
            name    : "normal-plugin-3",
            usage   : "normal-plugin-3"
        },
        space_in_path: {
            location: join(__dirname, "../", "test_plugins", "space in path plugin"),
            name    : "space-in-path-plugin",
            usage   : "space-in-path-plugin"
        },
        registry: {
            location: "imperative-sample-plugin",
            name    : "imperative-sample-plugin",
            usage   : "sample-plugin"
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

    it("should install a plugin from a file location", function(){

        let result = executeCommandString(this, "--help");

        // Verify that the sample plugin isn't there
        expect(result.stderr).toEqual("");
        expect(result.stdout).not.toContain(plugins.normal.usage);

        // Now go ahead and install the sample
        result = executeCommandString(this, `${pluginGroup} install ${plugins.normal.location}`);
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
    });

    it("should install multiple plugins at the same time", function(){

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

    it("should re-install plugins using files in the cli home directory", function(){

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

    it("should install a plugin from a file location that contain space in it path", function(){

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
            rimraf.sync(join(TEST_ENVIRONMENT.workingDir, '";touch test.txt;"'));
        });

        it("should fail to install a plugin from a file location with a command in it 1", async function(){
            const result = T.runCliScript(join(__dirname, "__scripts__", "injectionTestInstall1.sh"), TEST_ENVIRONMENT.workingDir, [cliBin]);
            delete process.env.PLUGINS_TEST_CLI_HOME;
            expect(result.stderr.toString()).toContain("invalid config Must be");
            expect(result.stderr.toString()).toContain("full url");

            const strippedOutput = T.stripNewLines(result.stdout.toString());
            expect(strippedOutput).toContain("Username:");
            expect(existsSync(join(TEST_ENVIRONMENT.workingDir, "test.txt"))).not.toEqual(true);
        });

        it("should fail to install a plugin from a file location with a command in it 2", async function(){
            const result = T.runCliScript(join(__dirname, "__scripts__", "injectionTestInstall2.sh"), TEST_ENVIRONMENT.workingDir, [cliBin], {
                PLUGINS_TEST_CLI_HOME: join(TEST_ENVIRONMENT.workingDir, '";touch test.txt;"')
            });
            delete process.env.PLUGINS_TEST_CLI_HOME;
            expect(existsSync(join(TEST_ENVIRONMENT.workingDir, '";touch test.txt;"', "plugins", "test.txt"))).not.toEqual(true);
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
    /* eslint-enable jest/no-commented-out-tests */

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
                    package : plugins.normal2.location,
                    registry: TEST_REGISTRY,
                    version : "1.0.2"
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

        it("should install using the created plugin json file", function(){

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

        it("should merge a plugins.json provided with one that is already managed", function(){

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

        it("should error when a package and --file is specified", function(){
            expect(
                T.stripNewLines(
                    executeCommandString(this, `${pluginGroup} install ${plugins.registry.location} --file ${testFile}`).stderr
                )
            ).toContain("Option --file can not be specified if positional package... is as well. They are mutually exclusive.");
        });

        it("should error when --file and --registry are specified", function(){
            expect(
                T.stripNewLines(
                    executeCommandString(this,
                        `${pluginGroup} install ${plugins.registry.location} --file ${testFile} --registry ${TEST_REGISTRY}`).stderr
                )
            ).toContain("The following options conflict (mutually exclusive)");
        });
    });
});
