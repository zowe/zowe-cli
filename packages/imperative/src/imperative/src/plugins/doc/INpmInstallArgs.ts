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
     * A comma-separated list of package names that are allowed to run their npm install scripts
     * (`preinstall`, `install`, `postinstall`, and `prepare`). The names must match exactly.
     * This is passed to npm as its own `--allow-scripts` option.
     *
     * npm 12 blocks these scripts unless the package is in the list. Older versions of npm do
     * not know this option and ignore it. If this is undefined or has no package names, we do
     * not add the option at all, so npm decides what to do.
     */
    allowScripts?: string;

    /**
     * Allows us to handle scoped registries in the future
     */
    [key: string]: string | undefined;
}
