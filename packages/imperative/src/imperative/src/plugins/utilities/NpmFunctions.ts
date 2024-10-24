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

import { PMFConstants } from "./PMFConstants";
import * as path from "path";
import * as which from "which";
import { StdioOptions } from "child_process";
import { readFileSync } from "jsonfile";
import * as npmPackageArg from "npm-package-arg";
import * as pacote from "pacote";
import { ExecUtils, JsUtils } from "../../../../utilities";
import { INpmInstallArgs } from "../doc/INpmInstallArgs";
import { IPluginJsonObject } from "../doc/IPluginJsonObject";
import { INpmRegistryInfo } from "../doc/INpmRegistryInfo";
const npmCmd = findNpmOnPath();

/**
 * Common function that returns npm command as a string.
 *
 * @return {string} command with npm path
 */
export function findNpmOnPath(): string {
    return which.sync("npm");
}

/**
 * Common function that installs a npm package using the local npm cli.
 * @param {string} prefix Path where to install npm the npm package.
 *
 * @param {string} registry The npm registry to install from.
 *
 * @param {string} npmPackage The name of package to install.
 *
 * @return {string} command response
 *
 */
export function installPackages(npmPackage: string, npmArgs: INpmInstallArgs): string {
    const pipe: StdioOptions = ["pipe", "pipe", process.stderr];
    const args = ["install", npmPackage, "-g", "--legacy-peer-deps"];
    for (const [k, v] of Object.entries(npmArgs)) {
        if (v != null) {
            // If npm arg starts with @ like @zowe:registry, must use = as separator
            args.push(...k.startsWith("@") ? [`--${k}=${v}`] : [`--${k}`, v]);
        }
    }
    const execOutput = ExecUtils.spawnAndGetOutput(npmCmd, args, {
        cwd: PMFConstants.instance.PMF_ROOT,
        stdio: pipe
    });

    return execOutput.toString();
}

/**
 * Fetch name and version of NPM package that was installed
 * @param pkgSpec The package name as specified on NPM install
 */
export async function getPackageInfo(pkgSpec: string): Promise<{ name: string, version: string }> {
    const pkgInfo = npmPackageArg(pkgSpec);
    if (pkgInfo.registry) {
        // We already know package name, so read name and version from package.json
        return readFileSync(path.join(PMFConstants.instance.PLUGIN_HOME_LOCATION, pkgInfo.name, "package.json"));
    } else {
        // Package name is unknown, so fetch name and version with pacote (npm SDK)
        return pacote.manifest(pkgSpec);
    }
}

export class NpmRegistryUtils {
    /**
     * Get the registry to install to.
     * @param userRegistry Registry override specified on the command line
     * @return {string}
     */
    public static getRegistry(userRegistry?: string): string {
        if (userRegistry != null) return userRegistry;
        const execOutput = ExecUtils.spawnAndGetOutput(npmCmd, ["config", "get", "registry"]);
        return execOutput.toString().replace("\n", "");
    }

    /**
     * NPM login to be able to install from secure registry
     * @param {string} registry The npm registry to install from.
     */
    public static npmLogin(registry: string) {
        ExecUtils.spawnAndGetOutput(npmCmd,
            [
                "login",
                "--registry", registry,
                "--always-auth",
                "--auth-type=legacy"
            ], {
                stdio: [0,1,2]
            }
        );
    }

    /**
     * Get package location and npm registry args for installing it.
     * @param packageInfo Plugin name or object from plugins.json
     * @param userRegistry Registry override specified on the command line
     * @returns Location info for npm package to be installed
     */
    public static buildRegistryInfo(packageInfo: string | IPluginJsonObject, userRegistry?: string): INpmRegistryInfo {
        const packageName = typeof packageInfo === "string" ? packageInfo : packageInfo.package;
        const packageScope = packageName.startsWith("@") ? packageName.split("/")[0] : undefined;
        if (userRegistry != null) {
            // If --registry was passed on the command line, it takes precedence
            return {
                location: userRegistry,
                npmArgs: this.buildRegistryNpmArgs(userRegistry, packageScope)
            };
        } else if (typeof packageInfo === "string" || !packageInfo.location) {
            // If installing a plug-in for the first time, get default registry
            const defaultRegistry = this.getRegistry();
            return {
                location: npmPackageArg(packageName).registry ? defaultRegistry : packageName,
                npmArgs: this.buildRegistryNpmArgs(defaultRegistry, packageScope)
            };
        } else {
            // If updating a plug-in, fetch registry info from plugins.json
            const cachedRegistry = JsUtils.isUrl(packageInfo.location) ? packageInfo.location : undefined;
            return {
                location: packageInfo.location,
                npmArgs: this.buildRegistryNpmArgs(cachedRegistry ?? this.getRegistry(), packageScope)
            };
        }
    }

    private static buildRegistryNpmArgs(registryUrl: string, scope?: string): Partial<INpmInstallArgs> {
        const npmArgs: INpmRegistryInfo["npmArgs"] = { registry: registryUrl };
        if (scope != null) {
            npmArgs[`${scope}:registry`] = this.getScopeRegistry(scope);
        }
        return npmArgs;
    }

    private static getScopeRegistry(scope: string): string | undefined {
        const execOutput = ExecUtils.spawnAndGetOutput(npmCmd, ["config", "get", `${scope}:registry`]);
        if (execOutput.toString().trim() === "undefined") return;
        return execOutput.toString().replace("\n", "");
    }
}
