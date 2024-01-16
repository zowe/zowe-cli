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
import { ConfigSchema, ProfileInfo } from "../../../../../config";
import { fileURLToPath, pathToFileURL } from "url";
import { IProfileTypeConfiguration } from "../../../../../profiles";
const npmCmd = findNpmOnPath();

/**
 * Updates `extenders.json` and returns a list of types to remove from the schema, if applicable.
 * @param npmPackage The package name for the plug-in that's being uninstalled
 * @returns A list of types to remove from the schema
 */
export function updateAndGetRemovedTypes(npmPackage: string): string[] {
    const extendersJson = ProfileInfo.readExtendersJsonFromDisk();
    const pluginTypes = Object.keys(extendersJson.profileTypes)
        .filter((type) => extendersJson.profileTypes[type].from.includes(npmPackage));
    const typesToRemove: string[] = [];
    if (pluginTypes.length > 0) {
        // Only remove a profile type contributed by this plugin if its the single source for that type.
        for (const profileType of pluginTypes) {
            const typeInfo = extendersJson.profileTypes[profileType];
            if (typeInfo.from.length > 1) {
                // If there are other sources, remove the version for that type if this plugin provides the
                // latest version. This will allow the next source to contribute a different schema version.
                if (typeInfo.latestFrom === npmPackage) {
                    extendersJson.profileTypes[profileType] = {
                        ...typeInfo,
                        from: typeInfo.from.filter((v) => v !== npmPackage),
                        latestFrom: undefined,
                        version: undefined
                    };
                } else {
                    extendersJson.profileTypes[profileType] = {
                        ...typeInfo,
                        from: typeInfo.from.filter((v) => v !== npmPackage)
                    };
                }
            } else {
                delete extendersJson.profileTypes[profileType];
                typesToRemove.push(profileType);
            }
        }
        ProfileInfo.writeExtendersJson(extendersJson);
    }

    return typesToRemove;
}

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

        if (PMFConstants.instance.PLUGIN_USING_CONFIG) {
            // Update the Imperative Configuration to add the profiles introduced by the recently installed plugin
            // This might be needed outside of PLUGIN_USING_CONFIG scenarios, but we haven't had issues with other APIs before
            const globalLayer = PMFConstants.instance.PLUGIN_CONFIG.layers.find((layer) => layer.global && layer.exists);
            if (globalLayer) {
                const schemaInfo = PMFConstants.instance.PLUGIN_CONFIG.getSchemaInfo();
                if (schemaInfo.local && fs.existsSync(schemaInfo.resolved)) {
                    let loadedSchema: IProfileTypeConfiguration[];
                    try {
                        // load schema from disk to prevent removal of profile types from other applications
                        loadedSchema = ConfigSchema.loadSchema(readFileSync(schemaInfo.resolved));
                    } catch (err) {
                        iConsole.error("Error when removing profile type for plugin %s: failed to parse schema", npmPackage);
                    }
                    // update extenders.json with any removed types - function returns the list of types to remove
                    const typesToRemove = updateAndGetRemovedTypes(npmPackage);

                    // Only update global schema if there are types to remove and accessible from disk
                    if (loadedSchema != null && typesToRemove.length > 0) {
                        loadedSchema = loadedSchema.filter((typeCfg) => !typesToRemove.includes(typeCfg.type));
                        const schema = ConfigSchema.buildSchema(loadedSchema);
                        ConfigSchema.updateSchema({ layer: "global", schema });
                    }
                }
            }
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
