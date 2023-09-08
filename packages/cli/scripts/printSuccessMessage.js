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

function ensureImperativeBuild() {
    const fs = require('fs');
    const path = require('path');
    const execSync = require("child_process").execSync;
    const packageName = "@zowe/imperative";
    let packagePath;
    try {
        packagePath = require.resolve(packageName);
        return;
    } catch (err) {
        if (err.message.startsWith("Cannot find module")) {
            const matches = err.message.match(/'([^']+)'/g);
            packagePath = path.join(path.dirname(matches[0].slice(1, -1)), "..");
        } else {
            throw err;
        }
    }

    if (fs.existsSync(path.join(packagePath, 'tsconfig.json')) && !fs.existsSync(path.join(packagePath, "lib", "index.js"))) {
        // console.log(`Building ${packageName}...`);
        execSync(`cd ${packagePath} && npm run build`, { stdio: 'inherit' });
    }
}

function printSuccessMessage() {
    ensureImperativeBuild();
    const imperative = require("@zowe/imperative");

    const installSuccessMessage = "Zowe CLI has been successfully installed. " +
    "You can safely ignore all non-plug-in related errors and warnings. " +
    "Please check above for any plug-in related issues.";

    const table = imperative.TextUtils.getTable([[installSuccessMessage]], "yellow", undefined, false, true, true);
    console.log("\n" + table + "\n");
}

printSuccessMessage();