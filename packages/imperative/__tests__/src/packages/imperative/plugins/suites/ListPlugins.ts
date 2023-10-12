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
import { cliBin } from "../PluginManagementFacility.spec";
import { join } from "path";

describe("List plugin", () => {
    const testPluginDir = join(__dirname, "../test_plugins");

    it("should list all installed plugin", () => {
        const pluginName = "normal-plugin";
        const testPlugin = join(testPluginDir, "normal_plugin");
        let cmd = `plugins install ${testPlugin}`;
        let result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain(`Installed plugin name = '${pluginName}'`);

        cmd = `plugins list`;
        result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain(`pluginName: ${pluginName}`);
        expect(result.stdout).toContain(`package:`);
        expect(result.stdout).toContain(`version:`);
        expect(result.stdout).toContain(`registry:`);
    });

    it("should display proper message when no plugin is installed", () => {
        const cmd = `plugins list`;
        const result = T.executeTestCLICommand(cliBin, this, cmd.split(" "));
        expect(result.stdout).toContain("No plugins have been installed");
    });
});
