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
 * Information interface for basic system information
 * @export
 * @interface ISystemInfo
 */
export interface ISystemInfo {

    /**
     * The system's CPU architecture
     * @type {string}
     * @memberof ISystemInfo
     */
    arch: string;

    /**
     * The OS platform in use
     * @type {string}
     * @memberof ISystemInfo
     */
    platform: string;

}