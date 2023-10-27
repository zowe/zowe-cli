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
import { cliBin } from "../PluginManagementFacility.integration.spec";
import { join } from "path";

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
});
