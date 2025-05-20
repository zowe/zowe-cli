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

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { IO } from "npm:@zowe/imperative";
import process from "node:process";

/**
 * Class containing daemon utility functions.
 * @export
 * @class DaemonUtil
 */
export class DaemonUtil {
    /**
     * Get the directory that holds daemon-related runtime files.
     * Ensures that the directory exists, or we create it.
     *
     * @returns The absolute path to the daemon directory.
     */
    public static getDaemonDir(): string {
        let daemonDir: string;
        if (process.env?.ZOWE_DAEMON_DIR?.length > 0) {
            // user can choose a daemon directory for storing runtime artifacts
            daemonDir = process.env.ZOWE_DAEMON_DIR;
        } else {
            // our default location.
            daemonDir = path.join(os.homedir(), ".zowe", "daemon");
        }
        if (!IO.existsSync(daemonDir)) {
            try {
                IO.createDirSync(daemonDir);
                const ownerReadWriteTraverse = 0o700;
                fs.chmodSync(daemonDir, ownerReadWriteTraverse);
            } catch(err) {
                throw new Error("Failed to create directory '" + daemonDir + "'\nDetails = " + err.message);
            }
        }
        return daemonDir;
    }
}
