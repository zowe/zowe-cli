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

import { SpawnSyncOptions } from "child_process";
import * as spawn from "cross-spawn";

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
        // Implementation based on the child_process module
        // https://github.com/nodejs/node/blob/main/lib/child_process.js
        const result = spawn.sync(command, args, options);
        if (result.error != null) {
            throw result.error;
        } else if (result.status !== 0) {
            let msg = `Command failed: ${command} ${args.join(" ")}`;
            if (result.stderr?.length > 0) {
                msg += `\n${result.stderr.toString()}`;
            }
            throw new Error(msg);
        }
        return result.stdout;
    }
}
