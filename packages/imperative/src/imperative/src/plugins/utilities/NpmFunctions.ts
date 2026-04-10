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
import { DaemonRequest, ExecUtils, ImperativeConfig } from "../../../../utilities";
import { INpmInstallArgs } from "../doc/INpmInstallArgs";
import { IPluginJsonObject } from "../doc/IPluginJsonObject";
import { INpmRegistryInfo } from "../doc/INpmRegistryInfo";
import { Logger } from "../../../../logger";
import { ImperativeError } from "../../../../error";

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
export function installPackages(npmPackage: string, npmArgs: INpmInstallArgs, verbose = false): string {
    const pipe: StdioOptions = ["pipe", "pipe", "pipe"];
    const args = ["install", npmPackage, "-g", "--legacy-peer-deps"];
    if (verbose) {
        const logLevel = ((logger: Logger) => {
            switch (logger.level) {
                case "TRACE": return "silly";
                case "DEBUG": return "verbose";
                default: return "info";
            }
        })(Logger.getAppLogger());
        args.push(`--loglevel=${logLevel}`, "--foreground-scripts");
    }
    for (const [k, v] of Object.entries(npmArgs)) {
        if (v != null) {
            // If npm arg starts with @ like @zowe:registry, must use = as separator
            args.push(...k.startsWith("@") ? [`--${k}=${v}`] : [`--${k}`, v]);
        }
    }
    let execOutput = "";
    const daemonStream = ImperativeConfig.instance.daemonContext?.stream;
    try {
        if (verbose && daemonStream == null) {
            ExecUtils.spawnWithInheritedStdio(npmCmd, args, {
                cwd: PMFConstants.instance.PMF_ROOT,
            });
        } else {
            execOutput = ExecUtils.spawnAndGetOutput(npmCmd, args, {
                cwd: PMFConstants.instance.PMF_ROOT,
                stdio: pipe
            }).toString();

            if (verbose && daemonStream != null) {
                daemonStream.write(DaemonRequest.create({ stdout: execOutput }));
            }
        }
    }
    catch (error) {
        if (daemonStream != null) {
            daemonStream.write(DaemonRequest.create({ stderr: error.message }));
        } else {
            process.stderr.write(error.message);
        }
    }
    return execOutput;
}

/**
 * Fetch name and version of NPM package that was installed
 * @param pkgSpec The package name as specified on NPM install
 */
export function getPackageInfo(pkgSpec: string): { name: string, version: string, [key: string]: unknown } {
    const pkgInfo = npmPackageArg(pkgSpec);
    let packageName = pkgInfo.name;

    if (!pkgInfo.registry) {
        // Package name is unknown, so fetch it with 'npm pack' command
        const maxOutputInx = 200;
        let truncationMsg = "\n<Additional output not displayed>";
        let execOutput:string = "No npm pack output was retrieved";
        try {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            const maxBuffer = 1024 * 1024 * 10; // 10MB
            execOutput = ExecUtils.spawnAndGetOutput(
                npmCmd, ["pack", pkgSpec, "--dry-run", "--json"], { maxBuffer }
            ).toString();
        } catch (err) {
            if (execOutput.length < maxOutputInx) {
                truncationMsg = "";
            }
            throw new ImperativeError({
                msg: `Spawn of 'npm pack' command failed for package: '${pkgSpec}'` +
                    "\nSpawn error = " + (err as Error).message +
                    "\nOutput of the spawn action:\n" + execOutput.substring(0, maxOutputInx) + truncationMsg
            });
        }

        // In test pipelines, parallel tests are using Git to retrieve source to compile and
        // for CodeQL analysis. Some conflict causes <YourSourceCodeRootDirectory>/.git/config.lock
        // to be left around. As a result, when the pipeline spawns 'npm pack' to get the contents
        // of package.json, an error message that looks like this:
        //      "error: could not lock config file .git/config: File exists"
        //          or
        //      "warning: unable to access '.git/config': Permission denied"
        // may be displayed before the correct contents of package.json.
        // JSON.parse() throws an error because of that error text. A successful 'npm pack' command
        // always displays its results in an array. The following code looks for the start of an array
        // and removes any error messages that occurs before the array of valid JSON. This allows
        // the JSON to be successfully parsed. Any error message is logged.
        let startOfJsonInx = execOutput.indexOf("\n[");
        if (startOfJsonInx > 0) {
            // we had some text before a JSON array
            Logger.getImperativeLogger().error(
                "The following errors were displayed by 'npm pack' before its JSON output:\n" +
                execOutput.substring(0, startOfJsonInx)
            );

            // discard the errors, and keep the JSON array
            startOfJsonInx++;
            execOutput = execOutput.substring(startOfJsonInx);
        }

        // parse the json output of the npm pack command
        try {
            packageName = JSON.parse(execOutput)[0].name;
        } catch (err) {
            if (execOutput.length < maxOutputInx) {
                truncationMsg = "";
            }
            throw new ImperativeError({
                msg: `Unable to parse the JSON output of 'npm pack' for this package: '${pkgSpec}'` +
                    "\nJSON.parse error = " + (err as Error).message +
                    "\nOutput of 'npm pack':\n" + execOutput.substring(0, maxOutputInx) + truncationMsg
            });
        }
    }
    return readFileSync(path.join(PMFConstants.instance.PLUGIN_HOME_LOCATION, packageName, "package.json"));
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
            ],
            { stdio: "inherit" }
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
            const cachedRegistry = npmPackageArg(packageInfo.package).registry ? packageInfo.location : undefined;
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
