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

// Resolve the project root, whether we execute from the project root or a package directory.
let projRoot = "." + path.sep
const keyFile = "lerna.json" // File which only exists in project root
while (!fs.existsSync(`${projRoot}${keyFile}`)) {

    projRoot = `${projRoot}..${path.sep}`

    if (path.resolve(projRoot) == path.resolve("/")) {
        console.log("Error trying to find project root - we're in the filesystem root.")
        console.log(`Make sure you are running from a dir under the project, and the file ${keyFile} exists in the project root.`)
        process.exit(1)
    }
}
const testPkgDir = projRoot + "__tests__" + path.sep + "__packages__"
const rootPkgDir = projRoot + "packages"
for (const pkgDir of fs.readdirSync(rootPkgDir)) {
    // correct for any metadata files in the packages/ dir, like .DS_Store on Mac
    const absPkgDir = rootPkgDir + path.sep + pkgDir
    if (fs.lstatSync(absPkgDir).isDirectory()) {
        fs.copyFileSync(`${projRoot}LICENSE`, `${absPkgDir}${path.sep}LICENSE`);
    }
}
for (const pkgDir of fs.readdirSync(testPkgDir)) {
    // correct for any metadata files in the packages/ dir, like .DS_Store on Mac
    const absPkgDir = testPkgDir + path.sep + pkgDir
    if (fs.lstatSync(absPkgDir).isDirectory()) {
        fs.copyFileSync(`${projRoot}LICENSE`, `${absPkgDir}${path.sep}LICENSE`);
    }
}