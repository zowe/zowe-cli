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
 * @file Integration tests for using a working plugin that was installed through
 *       the Plugin Management Facility.
 */

import * as T from "../../../../../src/TestUtil";
import * as fsExtra from "fs-extra";
import { cliBin, config } from "../PluginTestConstants";
import { join, resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { CredentialManagerOverride } from "../../../../../../packages/security/src/CredentialManagerOverride";

describe("Using a Plugin", () => {

    /**
     * Location of the saved plugins.json file for test purposes
     * @type {string}
     */
    const pluginJsonFile = join(config.defaultHome, "plugins", "plugins.json");

    /**
     * Location of the profiles created for test plugins
     * @type {string}
     */
    const pluginProfDir = join(config.defaultHome, "profiles");

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

    beforeEach(() => {
        // ensure that each test starts with no installed plugins
        T.rimraf(pluginJsonFile);
        T.rimraf(pluginProfDir);
    });

    it("should create plugin commands from in-line JSON text", () => {
        const installedPlugin = join(__dirname, "../test_plugins/normal_plugin");
        const pluginName = "normal-plugin";
        let cmd = `plugins install ${installedPlugin}`;
        let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }

        cmd = ``;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain(pluginName);
        // should use the pluginSummary field as the summary for the group
        expect(result.stdout).toContain("completely different");
        expect(result.stdout).toContain("summary");

        cmd = pluginName;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("bar dummy bar command");
        expect(result.stdout).toContain("foo dummy foo command");

        // should be able to issue the command with the first alias
        // specified in pluginAliases
        cmd = "np bar --help";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);

        // should be able to issue the command with the second alias
        // specified in pluginAliases
        cmd = "normalp bar --help";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);

        cmd = pluginName + " foo";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("Invoked sample-plugin foo handler");

        cmd = pluginName + " bar";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("@TODO Complete this command: bar");
    });

    it("should create plugin commands and profiles from config modules", () => {
        const installedPlugin = join(__dirname, "../test_plugins/normal_plugin_3");
        const pluginName = "normal-plugin-3";
        let cmd = `plugins install ${installedPlugin}`;
        let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }

        cmd = ``;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain(pluginName);
        expect(result.stdout).toContain("Test plugin with globs and profiles");

        cmd = pluginName;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("dummy bar command");
        expect(result.stdout).toContain("dummy foo command");
        expect(result.stdout).toContain("The command group definition of commands formed from globs");

        cmd = `${pluginName} globgroup`;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("globcmd1 First command created by globs");
        expect(result.stdout).toContain("globcmd2 Second command created by globs");

        cmd = "profiles list";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("bar-profiles | bar");
        expect(result.stdout).toContain("foo-profiles | foo");

        cmd = pluginName + " foo";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toContain("Command Preparation Failed:");
        expect(result.stderr).toContain("No default profile set for type \"foo\"");

        cmd = "profiles create foo myFooProfile --duration 5";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toContain("command 'profiles create' is deprecated");
        expect(result.stdout).toContain("Profile created successfully!");
        expect(result.stdout.replace(/\s+/g, " ")).toContain("size: small");
        expect(result.stdout.replace(/\s+/g, " ")).toContain("duration: 5");

        cmd = "profiles validate foo-profile";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toContain("command 'profiles validate' is deprecated");
        expect(result.stdout).toContain("Check the size of the Foo");
        expect(result.stdout).toContain("Repair in time");
        expect(result.stdout).toContain("Of 2 tests, 2 succeeded, 0 failed, and 0 had warnings or undetermined results.");

        cmd = pluginName + " foo";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("You executed the Foo command with size = small and duration = 5");
    });

    it("should use plugins to verify access of Imperative features", () => {
        const installedPlugin = join(__dirname, "../test_plugins/normal_plugin_misc");
        const pluginName = "normal-plugin-misc";
        let cmd = `plugins install ${installedPlugin}`;
        let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        if (peerDepWarning) {
            expect(result.stderr).toMatch(/npm.*WARN/);
            expect(result.stderr).toContain("requires a peer of @zowe/imperative");
            expect(result.stderr).toContain("You must install peer dependencies yourself");
        } else {
            expect(result.stderr).toEqual("");
        }
        let stdout = "";

        cmd = ``;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain(pluginName);
        // should use the pluginSummary field as the summary for the group
        stdout = result.stdout.replace(/\r?\n/g, "");
        expect(stdout).toMatch(/This\s*plugin\s*is\s*intended\s*to\s*test\s*various\s*Imperative\s*features/);

        // should be able to issue the command with the alias specified in pluginAliases
        cmd = "misc --help";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);

        cmd = pluginName;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        stdout = result.stdout.replace(/\r?\n/g, "");


        // Should have access to the Imperative APIs
        expect(stdout).toMatch(/Test\s*that\s*the\s*Imperative\s*APIs\s*are\s*accessible/);

        cmd = pluginName + " imperative-apis";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain("Imperative APIs are accessible from the test plugin");
        expect(result.stdout).toContain("Imperative APIs imperativeLogger is accessible from the test plugin");
        expect(result.stdout).toContain("Imperative APIs appLogger is accessible from the test plugin");


        // Should have access to the Imperative Config and they should correct
        expect(stdout).toMatch(/Test\s*that\s*the\s*Imperative\s*Config\s*is\s*accessible\s*and\s*correct/);

        cmd = pluginName + " imperative-config";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain("Imperative configuration is accessible from the test plugin");
        expect(result.stdout).toContain("Imperative configuration does contain the expected rootCommandDescription");
        expect(result.stdout).toContain("Imperative configuration does contain the expected defaultHome");
        expect(result.stdout).toContain("Imperative configuration does contain the expected productDisplayName");
        expect(result.stdout).toContain("Imperative configuration does contain the expected name");
        expect(result.stdout).toContain("Imperative configuration does contain the expected profiles");


        // Should be able to handle an Imperative Error from a plugin
        expect(stdout).toMatch(/Test\s*that\s*Imperative\s*can\s*handle\s*an\s*Imperative\s*error\s*from\s*a\s*plugin/);

        cmd = pluginName + " imperative-error";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain("Command ERR called!");
        expect(result.stderr).toContain("Command Error:");
        expect(result.stderr).toContain("Plugin threw an imperative error!");
        expect(result.stderr).toContain("Error Details:");
        expect(result.stderr).toContain("More details!");


        // Should make use of the loggers available to a plugin
        expect(stdout).toMatch(/Test\s*that\s*the\s*Imperative\s*Logging\s*capabilities\s*work/);

        const randomTest = Math.random();
        cmd = pluginName + " imperative-logging --test " + randomTest;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain(`${randomTest}: Messages logged successfully to the following locations`);

        // Check imperative logger
        const impLogLocation = join(config.defaultHome, "imperative", "logs", "imperative.log");
        const impLogContent = readFileSync(impLogLocation).toString();
        expect(result.stdout).toContain(resolve(impLogLocation));
        expect(impLogContent).not.toContain(`Log message from test plugin: DEBUG: ${randomTest}`);
        expect(impLogContent).not.toContain(`Log message from test plugin: INFO: ${randomTest}`);
        expect(impLogContent).toContain(`Log message from test plugin: WARN: ${randomTest}`);
        expect(impLogContent).toContain(`Log message from test plugin: ERROR: ${randomTest}`);

        // Check App/Plugin  logger
        const appLogLocation = join(config.defaultHome, config.name, "logs", config.name + ".log");
        const appLogContent = readFileSync(appLogLocation).toString();
        expect(result.stdout).toContain(resolve(appLogLocation));
        expect(appLogContent).not.toContain(`Log message from test plugin: DEBUG: ${randomTest}`);
        expect(appLogContent).not.toContain(`Log message from test plugin: INFO: ${randomTest}`);
        expect(appLogContent).toContain(`Log message from test plugin: WARN: ${randomTest}`);
        expect(appLogContent).toContain(`Log message from test plugin: ERROR: ${randomTest}`);
    });

    it("should override CredentialManager", () => {
        // put our known name and lifecycle class into package.json
        const overridePluginDir = join(__dirname, "../test_plugins/override_plugin");
        const pkgFileNm = join(overridePluginDir, "package.json");
        let pkgContents = fsExtra.readJsonSync(pkgFileNm);
        const origPkgName = pkgContents.name;
        pkgContents.name = CredentialManagerOverride.getKnownCredMgrs()[1].credMgrPluginName as string;
        pkgContents.imperative.pluginLifeCycle = "./lib/sample-plugin/lifeCycle/class_good_lifeCycle";
        fsExtra.writeJsonSync(pkgFileNm, pkgContents, {spaces: 2});

        // install the override plugin
        let cmd = `plugins install ${overridePluginDir}`;
        let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

        // confirm the plugin summary is displayed from zowe help
        const pluginGrpNm = "override-plugin";
        cmd = ``;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain(pluginGrpNm);
        expect(result.stdout).toContain("imperative override plugin pluginSummary");

        // confirm the plugin command description is displayed from zowe override-plugin help
        cmd = pluginGrpNm;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("dummy bar command");
        expect(result.stdout).toContain("dummy foo command");
        expect(result.stdout).toContain("imperative override plugin rootCommandDescription");

        // set the CredMgr override setting to this known override-plugin.
        const knownOverridePluginNm = CredentialManagerOverride.getKnownCredMgrs()[1].credMgrDisplayName as string;
        setCredMgrOverride(knownOverridePluginNm);

        // Create a zosmf profile. That will trigger the CredMgr.
        cmd = "profiles create secure-pass-profile TestProfileName --password 'AnyPass' --overwrite";
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toContain("command 'profiles create' is deprecated");
        expect(result.stdout).toContain("CredentialManager in sample-plugin is saving these creds:");
        expect(result.stdout).toContain(`password: managed by ${knownOverridePluginNm}`);

        // Restore our name and remove our lifecycle class from package.json
        pkgContents = fsExtra.readJsonSync(pkgFileNm);
        pkgContents.name = origPkgName;
        delete pkgContents.imperative.pluginLifeCycle;
        fsExtra.writeJsonSync(pkgFileNm, pkgContents, {spaces: 2});

        // set the CredMgr back to default
        setCredMgrOverride(false);
    });

    // ___________________________________________________________________________
    /**
     * Set the system's Credential Manager override value.
     *
     * @params credMgrValue - plugin name for new CredMgr override, or false for default.
     */
    function setCredMgrOverride(credMgrValue: string | false): void {
        const settingsPathNm = join(config.defaultHome, "settings", "imperative.json");
        let settingsContent = readFileSync(settingsPathNm).toString();

        if (credMgrValue !== false) {
            credMgrValue = `"${credMgrValue}"`;
        }

        settingsContent = settingsContent.replace(/"CredentialManager":.*/,
            `"CredentialManager": ${credMgrValue}`
        );

        writeFileSync(settingsPathNm, settingsContent, {
            spaces: 2
        });
    }
});
