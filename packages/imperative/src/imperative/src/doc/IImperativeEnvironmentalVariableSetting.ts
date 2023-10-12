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
 * Interface representing a single setting
 */
export interface IImperativeEnvironmentalVariableSetting {
    /**
     * The key to the process.env object
     * AKA. the environmental variable name
     * e.g. MYCLI_APP_LOG_LEVEL
     * @type {string}
     */
    key: string;

    /**
     * The value specified by the user for this variable, if any
     * e.g. "DEBUG"
     * @type {string}
     */
    value: string;
}
