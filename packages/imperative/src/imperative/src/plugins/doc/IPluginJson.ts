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

import { IPluginJsonObject } from "./IPluginJsonObject";

/**
 * Format of plugins.json file. Represents the list of installed plugins.
 */
export interface IPluginJson {
    /**
   * Each object key is the name of a plugin and the value is information about
   * said plugin.
   *
   * @type {IPluginJsonObject}
   */
    [key: string]: IPluginJsonObject;
}
