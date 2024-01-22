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

export interface IConfigMergeOpts {
    /**
     * Indicates whether we should mask off secure properties.
     * @defaultValue `false`
     */
    maskSecure?: boolean;

    /**
     * Indicates whether we should exclude global layers.
     * @defaultValue `false`
     */
    excludeGlobalLayer?: boolean;

    /**
     * Indicates whether we should clone layers to prevent accidental edits.
     * If maskSecure is true, then it is implied that cloneLayers is true.
     * @defaultValue `true`
     */
    cloneLayers?: boolean;
}
