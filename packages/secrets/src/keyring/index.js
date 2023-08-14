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

const { existsSync } = require("fs");
const { join, normalize } = require("path");

function findPkgRoot(dir) {
    if (dir == null) {
        return ".";
    }

    if (existsSync(join(dir, "package.json"))) {
        return dir;
    }

    const dirUp = normalize(join(dir, ".."));
    if (dirUp !== dir) {
        return findPkgRoot(dirUp);
    }
}

function getTargetName() {
    switch (process.platform) {
        case "win32":
            return `win32-${process.arch}-msvc`;
        case "linux":
            const isMusl =
                process.report.getReport().header.glibcVersionRuntime == null;
            const abi = isMusl ? "musl" : "gnu";
            switch (process.arch) {
                case "arm":
                    return `linux-arm-${abi}eabihf`;
                default:
                    return `linux-${process.arch}-${abi}`;
            }
        case "darwin":
        default:
            return `${process.platform}-${process.arch}`;
    }
}

const requireFn =
    typeof __webpack_require__ === "function"
        ? __non_webpack_require__
        : require;
const binaryPath = requireFn.resolve(`./keyring.${getTargetName()}.node`, {
    paths: [__dirname, join(findPkgRoot(__dirname), "prebuilds")],
});
const {
    deletePassword,
    findCredentials,
    findPassword,
    getPassword,
    setPassword,
} = requireFn(binaryPath);

module.exports.deletePassword = deletePassword;
module.exports.findCredentials = findCredentials;
module.exports.findPassword = findPassword;
module.exports.getPassword = getPassword;
module.exports.setPassword = setPassword;
