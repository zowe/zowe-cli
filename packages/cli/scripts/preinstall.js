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

/* This script creates an empty "bin" script for the @zowe/cli package.
 * It works around an npm@7 bug: https://github.com/npm/cli/issues/2632
 */

const fs = require("fs");
const path = require("path");
const devNodeModulesDir = path.join(__dirname, "..", "..", "..", "node_modules");
// The bug only happens in *nix environment when installing from source
if (process.platform !== "win32" && fs.existsSync(devNodeModulesDir)) {
    const cliLibDir = path.join(devNodeModulesDir, "@zowe", "cli", "lib");
    if (!fs.existsSync(cliLibDir)) {
        fs.mkdirSync(cliLibDir, { recursive: true });
    }
    const mainJsFile = path.join(cliLibDir, "main.js");
    if (!fs.existsSync(mainJsFile)) {
        fs.writeFileSync(mainJsFile, "");
    }
}
