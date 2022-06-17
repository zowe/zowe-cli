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

const packagesDir = fs.readdirSync("packages")
for (const packageDir of packagesDir) {
    fs.copyFileSync("./LICENSE", `packages/${packageDir}/LICENSE`);
}
