/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 */

const fs = require("fs");
const join = require("path").join;

// Function copied from prebuild-install
function npmCache() {
    const env = process.env;
    const home = require('os').homedir;
    return env.npm_config_cache ||
        (env.APPDATA ? join(env.APPDATA, 'npm-cache') : join(home(), '.npm'));
}

try {
    // Skip preinstall script if local prebuilds folder doesn't exist
    const localDir = join(__dirname, "..", "prebuilds");
    if (!fs.existsSync(localDir)) {
        process.exit(0);
    }

    // Ensure that prebuilds folder exists in NPM cache
    const cacheDir = join(npmCache(), "_prebuilds");
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
    }

    // Copy prebuilt Keytar binaries from local folder to NPM cache
    fs.readdirSync(localDir).forEach((filename) => {
        if (filename.match(/.*-keytar-.*-node-.*\.tar\.gz/)) {
            fs.copyFileSync(join(localDir, filename), join(cacheDir, filename));
        }
    });
} catch (err) {
    console.error(err);
}
