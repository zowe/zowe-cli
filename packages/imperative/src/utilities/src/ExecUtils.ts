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

import { SpawnSyncOptions, SpawnSyncReturns } from "child_process";
import * as spawn from "cross-spawn";
import { normalize as pathNormalize } from "path";

import { ImperativeConfig } from "./ImperativeConfig";
import { Logger } from "../../logger";

/**
 * A collection of utilities related to executing a sub-process.
 * @export
 * @class ExecUtils
 */
export class ExecUtils {
    /**
     * Spawn a process with arguments and throw an error if the process fails.
     * Parameters are same as `child_process.spawnSync` (see Node.js docs).
     * Use this method if you want the safe argument parsing of `spawnSync`
     * combined with the smart output handling of `execSync`.
     * @returns Contents of stdout as buffer or string
     */
    public static spawnAndGetOutput(command: string, args?: string[], options?: SpawnSyncOptions): Buffer | string {
        const result = spawn.sync(command, args, options);
        return this.handleSpawnResult(result, [command, ...args ?? []]);
    }

    /**
     * Spawn a process with arguments and throw an error if the process fails.
     * Parameters are same as `child_process.spawnSync` (see Node.js docs).
     * Output is inherited by the parent process instead of being returned.
     * Use this method if you want the safe argument parsing of `spawnSync`
     * combined with the smart output handling of `execSync`.
     */
    public static spawnWithInheritedStdio(command: string, args?: string[], options?: SpawnSyncOptions): void {
        const result = spawn.sync(command, args, { ...options, stdio: "inherit" });
        return this.handleSpawnResult<void>(result, [command, ...args ?? []]);
    }

    private static handleSpawnResult<T = Buffer | string>(result: SpawnSyncReturns<Buffer | string>, argv: string[]): T {
        // Implementation based on the child_process module
        // https://github.com/nodejs/node/blob/main/lib/child_process.js
        if (result.error != null) {
            throw result.error;
        } else if (result.status !== 0) {
            // log a detailed message
            let errMsg = `Command that failed: ${argv.join(" ")}`;
            if (result.status) {
                errMsg += `\nExit code = ${result.status.toString()}`;
            }
            if (result.stderr?.length > 0) {
                errMsg += `\n\nCommand's standard error stream:\n${result.stderr.toString()}`;
            }
            if (result.stdout?.length > 0) {
                errMsg += `\nCommand's standard output stream:\n${result.stdout.toString()}`;
            }

            // give additional tips to debug npm commands
            if (argv[0].toLowerCase().includes("npm")) {
                errMsg += "\nIf you are using an NPM registry, " +
                    "confirm that NPM can access the registry with the following command:\n" +
                    "    npm view <your_desired_package_name>\n" +
                    "Confirm that NPM can download your package from your registry:\n" +
                    "    npm pack <your_desired_package_name> -registry <your_npm_registry_name> "
            }
            Logger.getImperativeLogger().error(errMsg);

            // throw a truncated message to be displayed
            const truncLen = 100;
            errMsg = "";
            if (result.stderr?.length > 0) {
                errMsg += `${result.stderr.toString()}`;
            }
            if (result.stdout?.length > 0) {
                errMsg += `\n${result.stdout.toString()}`;
            }
            if (errMsg.length > truncLen) {
                errMsg = errMsg.slice(0, truncLen) + " ... <message truncated>";
            }
            const impLogFileNm = pathNormalize(ImperativeConfig.instance.cliHome + "/logs/imperative.log");
            errMsg += `\nFor error details, search for 'Command that failed' in ${impLogFileNm}`;
            throw new Error(errMsg);
        }
        return result.stdout as T;
    }
}
