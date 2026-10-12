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
import { ImperativeError } from "../../error/src/ImperativeError";

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
            throw new ImperativeError({
                msg: `Failed to launch the following command:\n    ${argv.join(" ")}`,
                additionalDetails: result.error.toString()
            });
        } else if (result.status !== 0) {
            // form a detailed message
            let additionalDetails = `Command that failed:\n    ${argv.join(" ")}`;
            if (result.status) {
                additionalDetails += `\nExit code = ${result.status.toString()}`;
            }
            if (result.stderr?.length > 0) {
                additionalDetails += `\n\nCommand's standard error stream:\n${result.stderr.toString()}`;
            }
            if (result.stdout?.length > 0) {
                additionalDetails += `\nCommand's standard output stream:\n${result.stdout.toString()}`;
            }

            // give additional tips to debug npm commands
            if (argv[0].toLowerCase().includes("npm")) {
                additionalDetails += "\nIf you are using an NPM registry, " +
                    "confirm that NPM can access the registry with the following command:\n" +
                    "    npm view <your_desired_package_name>\n" +
                    "Confirm that NPM can download your package from your registry:\n" +
                    "    npm pack <your_desired_package_name>";
            }

            throw new ImperativeError({
                msg: `Errors occurred in this program: ${argv[0]}`,
                additionalDetails: additionalDetails
            });
        }
        return result.stdout as T;
    }
}
