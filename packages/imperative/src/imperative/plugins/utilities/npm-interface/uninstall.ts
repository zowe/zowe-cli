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

import * as fs from "fs";
import * as path from "path";
import { PMFConstants } from "../PMFConstants";
import { readFileSync, writeFileSync } from "jsonfile";
import { IPluginJson } from "../../doc/IPluginJson";
import { Logger } from "../../../../../logger";
import { ImperativeError } from "../../../../../error";
import { ExecUtils, TextUtils } from "../../../../../utilities";
import { StdioOptions } from "child_process";
import { findNpmOnPath } from "../NpmFunctions";
const npmCmd = findNpmOnPath();

/**
 * @TODO - allow multiple packages to be uninstalled?
 * Common function that abstracts the uninstall process.
 *
 * @param {string} packageName A package name. This value is a valid npm package name.
 *
 */
export function uninstall(packageName: string): void {
    const iConsole = Logger.getImperativeLogger();
    const chalk = TextUtils.chalk;
    const npmPackage = packageName;

    iConsole.debug(`Uninstalling package: ${packageName}`);

    iConsole.debug("Reading in the current configuration.");
    const installedPlugins: IPluginJson = readFileSync(PMFConstants.instance.PLUGIN_JSON);

    const updatedInstalledPlugins: IPluginJson = {};

    if (Object.prototype.hasOwnProperty.call(installedPlugins, packageName)) {
        // Loop through the plugins and remove the uninstalled package
        for (const pluginName in installedPlugins) {
            // Only retain the plugins that aren't being uninstalled
            if (packageName.toString() !== pluginName.toString()) {
                updatedInstalledPlugins[pluginName] = installedPlugins[pluginName];
            }
        }
    } else {
        throw new ImperativeError({
            msg: `${chalk.yellow.bold("Plugin name")} '${chalk.red.bold(packageName)}' is not installed.`
        });
    }

    try {
        // We need to capture stdout but apparently stderr also gives us a progress
        // bar from the npm install.
        const pipe: StdioOptions = ["pipe", "pipe", process.stderr];

        // Perform the npm uninstall, somehow piping stdout and inheriting stderr gives
        // some form of a half-assed progress bar. This progress bar doesn't have any
        // formatting or colors but at least I can get the output of stdout right. (comment from install handler)
        iConsole.info("Uninstalling package...this may take some time.");

        ExecUtils.spawnAndGetOutput(npmCmd,
            [
                "uninstall",
                npmPackage,
                "--prefix",
                PMFConstants.instance.PLUGIN_INSTALL_LOCATION,
                "-g"
            ], {
                cwd: PMFConstants.instance.PMF_ROOT,
                // We need to capture stdout but apparently stderr also gives us a progress
                // bar from the npm install.
                stdio: pipe
            }
        );

        const installFolder = path.join(PMFConstants.instance.PLUGIN_HOME_LOCATION, npmPackage);
        if (fs.existsSync(installFolder)) {
            throw new Error("Failed to uninstall plugin, install folder still exists:\n  " + installFolder);
        }

        iConsole.info("Uninstall complete");

        writeFileSync(PMFConstants.instance.PLUGIN_JSON, updatedInstalledPlugins, {
            spaces: 2
        });

        iConsole.info("Plugin successfully uninstalled.");
    } catch (e) {
        throw new ImperativeError({
            msg: e.message,
            causeErrors: [e]
        });
    }
}
