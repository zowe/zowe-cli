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

import { isAbsolute, join } from "path";
import { existsSync } from "fs";
import { PMFConstants } from "./utilities/PMFConstants";
import { IssueSeverity, PluginIssues } from "./utilities/PluginIssues";
import type { IPluginCfgProps } from "./doc/IPluginCfgProps";

/**
 * Loaded plug-in configurations and module loading, independent of command registration.
 * @internal
 */
export class PluginRuntime {
    public static instance = new PluginRuntime();
    public allPluginCfgProps: IPluginCfgProps[] = [];

    /** Resolve a module using the same installation search order as the facility. */
    public formPluginRuntimePath(
        pluginName: string,
        relativePath = "",
        locations = PMFConstants.instance.PLUGIN_NODE_MODULE_LOCATION
    ): string {
        // Attempt to find the node_modules that contains the plugin
        let pluginRuntimeDir = null;
        for (const location of locations) {
            pluginRuntimeDir = join(location, pluginName);
            if (existsSync(pluginRuntimeDir)) {
                break;
            }
        }

        if (relativePath.length === 0) {
            return pluginRuntimeDir;
        }

        /* If the relative path is already absolute, do not place our
         * plugin's runtime location in front of the supplied path.
         */
        if (isAbsolute(relativePath)) {
            return relativePath;
        }

        return join(pluginRuntimeDir, relativePath);
    }

    /** Load plug-in modules and record failures in the shared issues list. */
    public requirePluginModuleCallback(
        pluginName: string,
        resolvePath = (relativePath: string) => this.formPluginRuntimePath(pluginName, relativePath)
    ): ((relativePath: string) => any) {
        return (relativePath: string) => {
            const pluginModuleRuntimePath = resolvePath(relativePath);
            try {
                return require(pluginModuleRuntimePath);
            } catch (requireError) {
                PluginIssues.instance.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                    "Unable to load the following module for plug-in '" +
                    pluginName + "' :\n" + pluginModuleRuntimePath + "\n" +
                    "Reason = " + requireError.message
                );
                return {};
            }
        };
    }
}
