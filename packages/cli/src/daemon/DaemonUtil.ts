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

import * as os from "os";
import * as path from "path";

/**
 * Class containing daemon utility functions.
 * @export
 * @class DaemonUtil
 */
export class DaemonUtil {
    /**
     * Get the directory that holds daemon-related runtime files.
     *
     * @returns The absolute path to the daemon directory.
     */
    public static getDaemonDir(): string {
        if (process.env?.ZOWE_DAEMON_DIR?.length > 0) {
            // user can choose a daemon directory for storing runtime artifacts
            return process.env.ZOWE_DAEMON_DIR;
        } else {
            // our default location.
            return path.join(os.homedir(), ".zowe", "daemon");
        }
    }
}
