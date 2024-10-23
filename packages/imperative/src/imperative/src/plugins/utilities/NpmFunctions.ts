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
            args.push(`--${k}`, v);
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

export class NpmRegistryInfo {
    private defaultRegistry?: string;
    private defaultRegistryScope?: string;

    constructor(private customRegistry?: string) {
        if (customRegistry == null) {
            this.defaultRegistry = this.getRegistry();
        }
    }

    private getRegistry(): string {
        const execOutput = ExecUtils.spawnAndGetOutput(npmCmd, ["config", "get", "registry"]);
        return execOutput.toString().replace("\n", "");
    }

    private getScopeRegistry(scope?: string): string {
        const execOutput = ExecUtils.spawnAndGetOutput(npmCmd, ["config", "get", `${scope ?? this.defaultRegistryScope}:registry`]);
        if (execOutput.toString().trim() === "undefined") return this.getRegistry();
        return execOutput.toString().replace("\n", "");
    }

    public get location(): string {
        return this.customRegistry ?? this.defaultRegistry;
    }

    /**
     * NPM login to be able to install from secure registry
     * @param {string} registry The npm registry to install from.
     */
    public npmLogin() {
        ExecUtils.spawnAndGetOutput(npmCmd,
            [
                "login",
                "--registry", this.customRegistry,
                "--always-auth",
                "--auth-type=legacy"
            ], {
                stdio: [0,1,2]
            }
        );
    }

    public buildRegistryArgs(): Partial<INpmInstallArgs> {
        const registrySpec = this.defaultRegistryScope ? `${this.defaultRegistryScope}:registry` : "registry";
        return this.customRegistry != null ? { [registrySpec]: this.location } : {};
    }

    public setPackage(packageInfo: string | IPluginJsonObject) {
        const packageName = typeof packageInfo === "string" ? packageInfo : packageInfo.package;
        const packageScope = packageName.startsWith("@") ? packageName.split("/")[0] : undefined;
        if (typeof packageInfo === "string" || packageInfo.location == null) {
            this.defaultRegistry = packageScope != null ? this.getScopeRegistry(packageScope) : this.getRegistry();
        } else {
            this.defaultRegistry = JsUtils.isUrl(packageInfo.location) ? packageInfo.location : undefined;
            this.defaultRegistryScope = packageScope;
        }
    }
}
