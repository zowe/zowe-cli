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

import * as T from "../../../../../src/TestUtil";
import { cliBin } from "../PluginTestConstants";
import { join } from "path";
import { execSync } from "child_process";

describe("Validate plugin", () => {
    const testPluginDir = join(__dirname, "../test_plugins");

    const removeNewline = (str: string): string => {
        str = str.replace(/\r?\n|\r/g, " ");
        return str;
    };

    /**
     * Specifies whether warnings about missing peer dependencies should be
     * expected in stderr output of `npm install`. This defaults to true and is
     * set to false if version 7 or newer of NPM is detected.
     * @type {boolean}
     */
    let peerDepWarning: boolean = true;

    beforeAll(() => {
        peerDepWarning = parseInt(execSync("npm --version").toString().trim().split(".")[0], 10) < 7;
    });

    describe("should validate successfully", () => {
        it("when all plugin installed successfully and no plugin name is provided", () => {
            const testPlugin = join(testPluginDir, "normal_plugin");
            const pluginName: string = "normal-plugin";
            let cmd = `plugins install ${testPlugin}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

            cmd = `plugins validate`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toEqual("");
            expect(result.stdout).toContain("successfully validated.");
            expect(result.stderr).not.toContain("Problems detected during plugin validation.");
            expect(result.status).not.toEqual(1);
        });

        it("when plugin contain space in path is installed sucessfully", () => {
            const testPlugin = join(testPluginDir, "space in path plugin");
            const pluginName: string = "space-in-path-plugin";
            let result = T.executeTestCLICommand(cliBin, this, ["plugins", "install", testPlugin]);
            expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

            const cmd = `plugins validate`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toEqual("");
            expect(result.stdout).toContain("successfully validated.");
            expect(result.stderr).not.toContain("Problems detected during plugin validation.");
            expect(result.status).not.toEqual(1);
        });

        it("when provided plugin name is installed successfully", () => {
            const pluginName = "normal-plugin";
            const testPlugin = join(testPluginDir, "normal_plugin");
            let cmd = `plugins install ${testPlugin}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

            cmd = `plugins validate ${pluginName}`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toEqual("");
            expect(result.stdout).toContain("successfully validated.");
            expect(result.stderr).not.toContain("Problems detected during plugin validation.");
            expect(result.status).not.toEqual(1);
        });

        it("when imperative object in package.json does not contains a name property", () => {
            const pluginName = "missing_name_plugin";
            const testPlugin = join(testPluginDir, "missing_name_plugin");
            let cmd = `plugins install ${testPlugin}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

            cmd = `plugins validate ${pluginName}`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toEqual("");
            expect(result.stdout).toContain("successfully validated.");
            expect(result.stderr).not.toContain("Problems detected during plugin validation.");
            expect(result.status).not.toEqual(1);
        });

        it("when imperative object in package.json does not contains a handler property but contains a chained handler", () => {
            const pluginName = "chained-handler-plugin";
            const testPlugin = join(testPluginDir, "chained_handler_plugin");
            let cmd = `plugins install ${testPlugin}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

            cmd = `plugins validate ${pluginName}`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stderr).toEqual("");
            expect(result.stdout).toContain("successfully validated.");
            expect(result.stderr).not.toContain("Problems detected during plugin validation.");
            expect(result.status).not.toEqual(1);
        });
    });

    describe("should display proper error message", () => {
        it("when no plugin is installed", () => {
            const pluginName: string = "noninstalled-plugin";
            const cmd = `plugins validate`;
            const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain("No plugins have been installed");
            expect(result.stderr).not.toContain("Problems detected during plugin validation.");
            expect(result.status).not.toEqual(1);
        });

        it("when the provided plugin is not installed", () => {
            const testPlugin = join(testPluginDir, "normal_plugin");
            const pluginName: string = "imperative-sample-plugin";
            let cmd = `plugins install ${testPlugin}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(`Installed plugin name = 'normal-plugin'`);

            cmd = `plugins validate ${pluginName} --no-fail-on-error`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(pluginName);
            expect(result.stdout).toContain("has not been installed");
            expect(result.stderr).not.toContain("Problems detected during plugin validation.");
            expect(result.status).not.toEqual(1);
        });

        it("when the provided plugin is not installed - error", () => {
            const testPlugin = join(testPluginDir, "normal_plugin");
            const pluginName: string = "imperative-sample-plugin";
            let cmd = `plugins install ${testPlugin}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(`Installed plugin name = 'normal-plugin'`);

            cmd = `plugins validate ${pluginName}`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(pluginName);
            expect(result.stdout).toContain("has not been installed");
            expect(result.stderr).toContain("Problems detected during plugin validation.");
            expect(result.status).toEqual(1);
        });

        describe("when package json contains the following scenarios", () => {
            it("duplicated command name with base CLI commands", () => {
                const testPlugin = "duplicated_base_cli_command";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("Error");
                expect(result.stdout).toContain("Your base application already contains a group with the name");
                expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                expect(result.status).not.toEqual(1);
            });

            it("duplicated command name with base CLI commands - error", () => {
                const testPlugin = "duplicated_base_cli_command";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("Error");
                expect(result.stdout).toContain("Your base application already contains a group with the name");
                expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                expect(result.stderr).toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(1);
            });

            it("duplicated command name with installed plugin", () => {
                const testPlugin = "duplicated_installed_plugin_command";
                const fullPluginPath = join(testPluginDir, "error_plugins", "duplicated_installed_plugin_command");
                const normalPlugin = join(testPluginDir, "normal_plugin");

                let cmd = `plugins install ${normalPlugin} ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                if (peerDepWarning) {
                    expect(result.stderr).toMatch(/npm.*WARN/);
                    expect(result.stderr).toContain("requires a peer of @zowe/imperative");
                    expect(result.stderr).toContain("You must install peer dependencies yourself");
                } else {
                    expect(result.stderr).toEqual("");
                }

                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("Error");
                expect(result.stdout).toContain("Your base application already contains a group with the name");
                expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                expect(result.status).not.toEqual(1);
            });

            it("duplicated command name with installed plugin - error", () => {
                const testPlugin = "duplicated_installed_plugin_command";
                const fullPluginPath = join(testPluginDir, "error_plugins", "duplicated_installed_plugin_command");
                const normalPlugin = join(testPluginDir, "normal_plugin");

                let cmd = `plugins install ${normalPlugin} ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

                if (peerDepWarning) {
                    expect(result.stderr).toMatch(/npm.*WARN/);
                    expect(result.stderr).toContain("requires a peer of @zowe/imperative");
                    expect(result.stderr).toContain("You must install peer dependencies yourself");
                } else {
                    expect(result.stderr).toEqual("");
                }

                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("Error");
                expect(result.stdout).toContain("Your base application already contains a group with the name");
                expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                expect(result.stderr).toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(1);
            });

            // TODO: remove this test in V3, when pluginHealthCheck is removed
            it("missing pluginHealthCheck property", () => {
                const testPlugin = "missing_pluginHealthCheck";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("This plugin was successfully validated. Enjoy the plugin.");
                expect(result.stdout).not.toContain("Warning");
                expect(result.stdout).not.toContain("The plugin's configuration does not contain an 'imperative.pluginHealthCheck' property.");
                expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(0);
            });

            // TODO: remove this test in V3, when pluginHealthCheck is removed
            it("missing pluginHealthCheck property - warning", () => {
                const testPlugin = "missing_pluginHealthCheck";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin} --fail-on-warning`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("This plugin was successfully validated. Enjoy the plugin.");
                expect(result.stdout).not.toContain("Warning");
                expect(result.stdout).not.toContain("The plugin's configuration does not contain an 'imperative.pluginHealthCheck' property.");
                expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(0);
            });

            // TODO: remove this test in V3, when pluginHealthCheck is removed
            it("missing pluginHealthCheck handler", () => {
                const testPlugin = "missing_healthcheck_handler";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("This plugin was successfully validated. Enjoy the plugin.");
                expect(result.stdout).not.toContain("Error");
                expect(result.stdout).not.toContain(`The program for the 'imperative.pluginHealthCheck' property does not exist:`);
                expect(result.stdout).not.toContain("This plugin has configuration errors. No component of the plugin will be available");
                expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(0);
            });

            // TODO: remove this test in V3, when pluginHealthCheck is removed
            it("missing pluginHealthCheck handler - error", () => {
                const testPlugin = "missing_healthcheck_handler";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("This plugin was successfully validated. Enjoy the plugin.");
                expect(result.stdout).not.toContain("Error");
                expect(result.stdout).not.toContain(`The program for the 'imperative.pluginHealthCheck' property does not exist:`);
                expect(result.stdout).not.toContain("This plugin has configuration errors. No component of the plugin will be available");
                expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(0);
            });

            it("missing peerDependencies properties", () => {
                const testPlugin = "missing_dependencies";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("Warning");
                expect(result.stdout).toContain("Your '@zowe' dependencies must be contained within a 'peerDependencies' property." +
                    " That property does not exist in the file");
                expect(result.stdout).toContain("package.json");
                expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(0);
            });

            it("missing peerDependencies properties - warning", () => {
                const testPlugin = "missing_dependencies";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin} --fail-on-warning`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("Warning");
                expect(result.stdout).toContain("Your '@zowe' dependencies must be contained within a 'peerDependencies' property." +
                    " That property does not exist in the file");
                expect(result.stdout).toContain("package.json");
                expect(result.stderr).toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(1);
            });

            it("missing rootCommandDescription property", () => {
                const testPlugin = "missing_rootCommandDescription";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("Error");
                expect(result.stdout).toContain("The plugin's configuration does not contain an 'imperative.rootCommandDescription' property.");
                expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                expect(result.status).not.toEqual(1);
            });

            it("missing rootCommandDescription property - error", () => {
                const testPlugin = "missing_rootCommandDescription";
                const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                let cmd = `plugins install ${fullPluginPath}`;
                let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                cmd = `plugins validate ${testPlugin}`;
                result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                result.stderr = removeNewline(result.stderr);
                expect(result.stdout).toContain(testPlugin);
                expect(result.stdout).toContain("Error");
                expect(result.stdout).toContain("The plugin's configuration does not contain an 'imperative.rootCommandDescription' property.");
                expect(result.stderr).toContain("Problems detected during plugin validation.");
                expect(result.status).toEqual(1);
            });

            describe("definitions property", () => {
                it("is missing", () => {
                    const testPlugin = "missing_definitions";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    result.stderr = removeNewline(result.stderr);
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("The plugin defines no commands and overrides no framework components");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is missing - error", () => {
                    const testPlugin = "missing_definitions";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    result.stderr = removeNewline(result.stderr);
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("The plugin defines no commands and overrides no framework components");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with empty array", () => {
                    const testPlugin = "definition_empty_array";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    result.stderr = removeNewline(result.stderr);
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("The plugin defines no commands and overrides no framework components");
                    expect(result.stdout).toContain("This plugin has configuration errors. No component of the plugin will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with empty array - error", () => {
                    const testPlugin = "definition_empty_array";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    result.stderr = removeNewline(result.stderr);
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("The plugin defines no commands and overrides no framework components");
                    expect(result.stdout).toContain("This plugin has configuration errors. No component of the plugin will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which does not contain name property", () => {
                    const testPlugin = "definition_missing_name";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error: Command definition");
                    expect(result.stdout).toContain("no 'name' property");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which does not contain name property - error", () => {
                    const testPlugin = "definition_missing_name";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error: Command definition");
                    expect(result.stdout).toContain("no 'name' property");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which does not contain description property", () => {
                    const testPlugin = "definition_missing_description";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has no 'description' property");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which does not contain description property - error", () => {
                    const testPlugin = "definition_missing_description";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has no 'description' property");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which does not contain type property", () => {
                    const testPlugin = "definition_missing_type";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has no 'type' property");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which does not contain type property - error", () => {
                    const testPlugin = "definition_missing_type";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has no 'type' property");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which does not contain handler property", () => {
                    const testPlugin = "definition_missing_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has no 'handler' property");
                    expect(result.stdout).not.toContain("has no 'handler' property in one of its chained handlers.");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which does not contain handler property - error", () => {
                    const testPlugin = "definition_missing_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has no 'handler' property");
                    expect(result.stdout).not.toContain("has no 'handler' property in one of its chained handlers.");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which does not contain handler in chained handler property", () => {
                    const testPlugin = "definition_missing_chained_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has no 'handler' property in one of its chained handlers.");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which does not contain handler in chained handler property - error", () => {
                    const testPlugin = "definition_missing_chained_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has no 'handler' property in one of its chained handlers.");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which does not contain anything in chained handler property", () => {
                    const testPlugin = "definition_empty_chained_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has defined 'chainedHandler' property but contains no handlers.");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which does not contain anything in chained handler property - error", () => {
                    const testPlugin = "definition_empty_chained_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("has defined 'chainedHandler' property but contains no handlers.");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which has a bad handler path in chained handler property", () => {
                    const testPlugin = "definition_bad_chained_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("A chained handler for command");
                    expect(result.stdout).toContain("does not exist:");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which has a bad handler path in chained handler property - error", () => {
                    const testPlugin = "definition_bad_chained_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error");
                    expect(result.stdout).toContain("A chained handler for command");
                    expect(result.stdout).toContain("does not exist:");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which contains group type and missing children", () => {
                    const testPlugin = "definition_type_group_without_children";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error: Group name");
                    expect(result.stdout).toContain("has no 'children' property");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which contains group type and missing children - error", () => {
                    const testPlugin = "definition_type_group_without_children";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error: Group name");
                    expect(result.stdout).toContain("has no 'children' property");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("is defined with definition which contains invalid handler", () => {
                    const testPlugin = "missing_command_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error: The handler for command");
                    expect(result.stdout).toContain("does not exist:");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("is defined with definition which contains invalid handler - error", () => {
                    const testPlugin = "missing_command_handler";
                    const fullPluginPath = join(testPluginDir, "error_plugins", testPlugin);

                    let cmd = `plugins install ${fullPluginPath}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${testPlugin}'`);

                    cmd = `plugins validate ${testPlugin}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(testPlugin);
                    expect(result.stdout).toContain("Error: The handler for command");
                    expect(result.stdout).toContain("does not exist:");
                    expect(result.stdout).toContain("This plugin has command errors. No plugin commands will be available");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });
            });

            describe("Detect profile problems", () => {
                it("should fail with duplicate profiles within a plugin", () => {
                    const pluginName = "profile_dup_in_plugin";
                    const pluginDir = join(testPluginDir, "error_plugins", pluginName);

                    let cmd = `plugins install ${pluginDir}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

                    cmd = `plugins validate ${pluginName} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain("");
                    expect(result.stdout).toContain(pluginName);
                    expect(result.stdout).toContain(
                        "Error: The plugin's profiles at indexes = '0' and '1' have the same 'type' property = 'DupProfile'.");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("should fail with duplicate profiles within a plugin - error", () => {
                    const pluginName = "profile_dup_in_plugin";
                    const pluginDir = join(testPluginDir, "error_plugins", pluginName);

                    let cmd = `plugins install ${pluginDir}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

                    cmd = `plugins validate ${pluginName}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain("");
                    expect(result.stdout).toContain(pluginName);
                    expect(result.stdout).toContain(
                        "Error: The plugin's profiles at indexes = '0' and '1' have the same 'type' property = 'DupProfile'.");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });

                it("should fail when a plugin contains a profile with the same name as the CLI", () => {
                    const pluginName = "profile_dup_with_cli";
                    const pluginDir = join(testPluginDir, "error_plugins", pluginName);

                    let cmd = `plugins install ${pluginDir}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

                    cmd = `plugins validate ${pluginName} --no-fail-on-error`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain("");
                    expect(result.stdout).toContain(pluginName);
                    expect(result.stdout).toContain(
                        "Error: The plugin's profile type = 'TestProfile1' already exists within existing profiles.");
                    expect(result.stderr).not.toContain("Problems detected during plugin validation.");
                    expect(result.status).not.toEqual(1);
                });

                it("should fail when a plugin contains a profile with the same name as the CLI - error", () => {
                    const pluginName = "profile_dup_with_cli";
                    const pluginDir = join(testPluginDir, "error_plugins", pluginName);

                    let cmd = `plugins install ${pluginDir}`;
                    let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

                    cmd = `plugins validate ${pluginName}`;
                    result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
                    expect(result.stdout).toContain("");
                    expect(result.stdout).toContain(pluginName);
                    expect(result.stdout).toContain(
                        "Error: The plugin's profile type = 'TestProfile1' already exists within existing profiles.");
                    expect(result.stderr).toContain("Problems detected during plugin validation.");
                    expect(result.status).toEqual(1);
                });
            });
        });
    });
});
