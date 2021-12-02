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
 * Interface representing the result of a Dameon command.
 * @export
 * @interface IDaemonCmdResult
 */
export interface IDaemonCmdResult {
    /**
     * Success or failure.
     * @type {string}
     * @memberof IDaemonCmdResult
     */
    success: boolean;

    /**
     * Text message associated with our result.
     * @type {string}
     * @memberof IDaemonCmdResult
     */
    msgText: string;
}

