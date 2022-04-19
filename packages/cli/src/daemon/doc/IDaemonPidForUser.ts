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

/**
 * Represents the content of the JSON file into which the Zowe Daemon
 * stores the process ID for a given user.
 */
export interface IDaemonPidForUser {
    user: string;
    pid: number;
}
