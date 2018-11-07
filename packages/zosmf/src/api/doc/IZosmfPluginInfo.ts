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
 * The plugin information structure for plugin property of the z/OSMF info response
 * @export
 * @interface IZosmfPluginInfo
 */
export interface IZosmfPluginInfo {
  pluginVersion?: string;
  pluginDefaultName?: string;
  pluginStatus?: string;
}
