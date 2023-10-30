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

/**
 * @TODO - allow multiple packages to be updated?
 * Common function that abstracts the update process.
 *
 * @param {string} packageName A package name. This value is a valid npm package name.
 *
 * @param {string} registry The npm registry.
 *
 */
export async function update(packageName: string, registry: string) {
    const iConsole = Logger.getImperativeLogger();
    const npmPackage = packageName;

    iConsole.debug(`updating package: ${packageName}`);

    // NOTE: Using npm install in order to retrieve the version which may be updated
    iConsole.info("updating package...this may take some time.");

    installPackages(PMFConstants.instance.PLUGIN_INSTALL_LOCATION, registry, npmPackage);

    // We fetch the package version of newly installed plugin
    const packageInfo = await getPackageInfo(npmPackage);
    const packageVersion = packageInfo.version;

    iConsole.info("Update complete");

    // return the package version so the plugins.json file can be updated
    return packageVersion;
}

