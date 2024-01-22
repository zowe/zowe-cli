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
 * Object to hold a plugin's peer dependencies version numbers.
 */
export interface IPluginPeerDepends {
    /**
     * Each object key is the name of a plugin's peer dependency
     * and the value is the version string for that dependency.
     */
    peerDepName: string;
    peerDepVer: string;
}
