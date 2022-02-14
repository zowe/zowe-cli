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

const fs = require("fs");
const { join } = require("path");

try {
    // Skip preinstall script in any of the following conditions:
    // (1) Non-global install into project that may have Keytar dependency located outside of CLI node_modules
    // (2) Top-level prebuilds folder doesn't exist so we have nothing to copy
    const rootPbDir = join(__dirname, "..", "prebuilds");
    if (!process.env.npm_config_global || !fs.existsSync(rootPbDir)) {
        process.exit(0);
    }

    // Ensure that prebuilds folder exists in Keytar node_modules
    const keytarPbDir = join(__dirname, "..", "node_modules", "keytar", "prebuilds");
    if (!fs.existsSync(keytarPbDir)) {
        fs.mkdirSync(keytarPbDir, { recursive: true });
    }

    // Copy prebuilt Keytar binaries from top-level folder to Keytar node_modules
    fs.readdirSync(rootPbDir).forEach((filename) => {
        if (filename.match(/keytar-.*-napi-.*\.tar\.gz/)) {
            fs.copyFileSync(join(rootPbDir, filename), join(keytarPbDir, filename));
        }
    });
} catch (err) {
    console.error(err);
}
