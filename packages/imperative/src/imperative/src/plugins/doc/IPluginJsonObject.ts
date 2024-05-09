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
 * Information about an installed plugin
 */

export interface IPluginJsonObject {
    /**
     * The package location. If this is an npm package, this will be no different
     * than the key in the JSON file.
     *
     * @type {string}
     */
    package: string;

    /**
     *  The npm registry to install from.
     *
     *  @type {string}
     */
    registry: string;

    /**
     * The version of the installed plugin.
     *
     * @type {string}
     */
    version: string;
}
