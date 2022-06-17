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
 *   Prepares licenses in every package under the packages/ directory. 
 * 
 *   This ensures that a LICENSE file will be in every package when they are published to npm.
 */

const fs = require("fs");
const path = require("path");

// Check if we're executing from the root (npm publish) or individual package (npm pack)
let projRoot = "." + path.sep
const currDir = process.cwd()
if (currDir.indexOf("packages") !== -1) { 
    // We're in a package, get the absolute path to the root of the project
    projRoot = currDir.substring(0, currDir.indexOf("packages"));
}
const rootPkgDir = projRoot + "packages"
const pkgList = fs.readdirSync(rootPkgDir)
for (const pkgDir of pkgList) {
    // correct for any metadata files in the packages/ dir, like .DS_Store on Mac
    const absPkgDir = rootPkgDir + path.sep + pkgDir
    if (fs.lstatSync(absPkgDir).isDirectory()) {
        fs.copyFileSync(`${projRoot}LICENSE`, `${absPkgDir}${path.sep}LICENSE`);
    }
}