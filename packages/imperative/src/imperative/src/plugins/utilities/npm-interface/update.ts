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

import { PMFConstants } from "../PMFConstants";
import { Logger } from "../../../../../logger";
import { getPackageInfo, installPackages } from "../NpmFunctions";
import { INpmRegistryInfo } from "../../doc/INpmRegistryInfo";

/**
 * @TODO - allow multiple packages to be updated?
 * Common function that abstracts the update process.
 *
 * @param {string} packageName A package name. This value is a valid npm package name.
 *
 * @param {INpmRegistryInfo} registryInfo The npm registry to use.
 *
 * @param {string} [allowScripts] A comma-separated list of package names that are allowed to run
 *                                their npm install scripts. Zowe passes this list to npm as its
 *                                own `--allow-scripts` option. npm 12 blocks these scripts unless
 *                                the package is in the list. Older versions of npm ignore it.
 *
 */
export async function update(packageName: string, registryInfo: INpmRegistryInfo, allowScripts?: string) {
    const iConsole = Logger.getImperativeLogger();
    const npmPackage = packageName;

    iConsole.debug(`updating package: ${packageName}`);

    // NOTE: Using npm install in order to retrieve the version which may be updated
    iConsole.info("updating package...this may take some time.");

    installPackages(npmPackage, {
        prefix: PMFConstants.instance.PLUGIN_INSTALL_LOCATION,
        ...registryInfo.npmArgs,
        allowScripts,
    });

    // We fetch the package version of newly installed plugin
    const packageInfo = getPackageInfo(npmPackage);
    const packageVersion = packageInfo.version;

    iConsole.info("Update complete");

    // return the package version so the plugins.json file can be updated
    return packageVersion;
}
