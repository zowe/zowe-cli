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
import { cliBin, config } from "../PluginTestConstants";
import { CredentialManagerOverride } from "../../../../../../packages/security/src/CredentialManagerOverride";
import { join } from "path";
import { readJsonSync, writeJsonSync } from "fs-extra";

describe("Uninstall plugin", () => {
    const testPluginDir = join(__dirname, "../test_plugins");

    it("should uninstall plugin properly", () => {
        const pluginName = "normal-plugin";
        const testPlugin = join(testPluginDir, "normal_plugin");
        let cmd = `plugins install ${testPlugin}`;
        let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain("Installed plugin name = 'normal-plugin'");

        cmd = `plugins uninstall ${pluginName}`;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain("Removal of the npm package(s) was successful.");
    });

    it("should display proper message when no plugin package is provided", () => {
        const cmd = `plugins uninstall`;
        const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toContain("Package name is required.");
    });

    it("should display proper message when invalid plugin package is provided", () => {
        const pluginName = "invalid-package";
        const testPlugin = join(testPluginDir, "normal_plugin");
        let cmd = `plugins install ${testPlugin}`;
        let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain("Installed plugin name = 'normal-plugin'");

        cmd = `plugins uninstall ${pluginName}`;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stderr).toContain(pluginName);
        expect(result.stderr).toContain("is not installed");
    });

    describe("PluginLifecycle", () => {
        const settingsFileNm = join(config.defaultHome, "settings", "imperative.json");
        const overridePluginLoc = join(__dirname, "..", "test_plugins", "override_plugin");
        const knownCredMgr = CredentialManagerOverride.getKnownCredMgrs()[1];
        const knownCredMgrDisplayNm = knownCredMgr.credMgrDisplayName as string;
        const knownCredMgrPluginNm = knownCredMgr.credMgrPluginName as string;

        it("should fail when a credMgr override plugin has no pluginLifeCycle property", function () {
            // set to a working lifecycle class so that we can first install successfully
            changeNameInPkgJson(overridePluginLoc, knownCredMgrPluginNm);
            changeLifeCycleInPkgJson(overridePluginLoc, "goodLifeCycle");

            let cmd = `plugins install ${overridePluginLoc}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(`Installed plugin name = '${knownCredMgrPluginNm}'`);

            /* Because logging is redirected to stdout by these tests, parsing of the JSON output
             * of the validation command fails and the install does not complete its tasks. Thus,
             * the plugin's postInstall function is not run and the CredentialManager override
             * is not recorded in settings/imperative.json. We now record the correct value.
             */
            setCredMgrOverride(knownCredMgrDisplayNm);

            // remove the plugin's lifecycle
            changeLifeCycleInPkgJson(overridePluginLoc, "remove");

            cmd = `plugins uninstall ${knownCredMgrPluginNm}`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

            expect(result.stdout).toContain(
                `The plugin '${knownCredMgrPluginNm}', which overrides the CLI Credential Manager, ` +
                `does not implement the 'pluginLifeCycle' class. The CLI default Credential Manager ` +
                `(${CredentialManagerOverride.DEFAULT_CRED_MGR_NAME}) was automatically reinstated.`
            );

            // confirm that the plugin was uninstalled even after lycycle failure
            expect(result.stdout).toContain("Removal of the npm package(s) was successful.");
            expect(getCredMgrOverride()).toEqual(CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);
        });

        it("should successfully uninstall a credMgr override plugin", function () {
            // set to a working lifecycle class so that we can first install successfully
            changeNameInPkgJson(overridePluginLoc, knownCredMgrPluginNm);
            changeLifeCycleInPkgJson(overridePluginLoc, "goodLifeCycle");

            let cmd = `plugins install ${overridePluginLoc}`;
            let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
            expect(result.stdout).toContain(`Installed plugin name = '${knownCredMgrPluginNm}'`);

            /* Because logging is redirected to stdout by these tests, parsing of the JSON output
             * of the validation command fails and the install does not complete its tasks. Thus,
             * the plugin's postInstall function is not run and the CredentialManager override
             * is not recorded in settings/imperative.json. We now record the correct value.
             */
            setCredMgrOverride(knownCredMgrDisplayNm);

            cmd = `plugins uninstall ${knownCredMgrPluginNm}`;
            result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));

            // confirm that the plugin was uninstalled
            expect(result.stdout).toContain("Removal of the npm package(s) was successful.");
            expect(result.stdout).not.toContain(`Unable to perform the 'preUninstall' action of plugin '${knownCredMgrPluginNm}'`);
            expect(getCredMgrOverride()).toEqual(CredentialManagerOverride.DEFAULT_CRED_MGR_NAME);

            // set plugin's values back to its original values
            changeNameInPkgJson(overridePluginLoc, "override-plugin");
            changeLifeCycleInPkgJson(overridePluginLoc, "remove");
        });

        /*____________________________________________________________________
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

        /*____________________________________________________________________
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

        // ___________________________________________________________________________
        /**
         * Set the system's Credential Manager override value.
         *
         * @params credMgrValue - plugin name for new CredMgr override, or false for default.
         */
        function setCredMgrOverride(credMgrValue: string | false): void {
            const settingsPathNm = join(config.defaultHome, "settings", "imperative.json");
            const pkgContents = readJsonSync(settingsPathNm);
            pkgContents.overrides[CredentialManagerOverride.CRED_MGR_SETTING_NAME] = credMgrValue;
            writeJsonSync(settingsPathNm, pkgContents, {spaces: 2});
        }

        // ___________________________________________________________________________
        /**
         * Get the currently configured credential manager display name.
         *
         * @returns {string} The display name of the currrent credential manager.
         */
        const getCredMgrOverride = (): string => {
            const settingsContents = readJsonSync(settingsFileNm);
            return settingsContents.overrides[CredentialManagerOverride.CRED_MGR_SETTING_NAME];
        };
    }); // end PluginLifecycle
}); // Uninstall plugin
