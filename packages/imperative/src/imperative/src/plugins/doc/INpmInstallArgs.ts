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
 * Npm config options passed to the install command.
 */
export interface INpmInstallArgs {
    /**
     * The location to install global packages
     */
    prefix: string;

    /**
     * The base URL of the npm package registry
     */
    registry?: string;

    /**
     * Allows us to handle scoped registries in the future
     */
    [key: string]: string;
}
