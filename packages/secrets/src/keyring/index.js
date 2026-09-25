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

const { existsSync, readdirSync } = require("fs");
const { join, normalize, parse } = require("path");

function findPrebuildsDir(dir) {
    if (!dir || existsSync(join(dir, "package.json"))) {
        return join(dir, "prebuilds");
    }

    const dirUp = normalize(join(dir, ".."));
    if (parse(dirUp).base.length > 0) {
        return findPrebuildsDir(dirUp);
    }
}

/**
 * Determine whether the current Linux system uses musl rather than glibc.
 *
 * `process.report.getReport()` is the usual way to detect this, but it is not dependable in every
 * host that embeds Node:
 *   - It is unavailable in some embedded runtimes. In the VS Code extension host `process.report`
 *     can be `undefined`, so reading `.getReport()` from it throws a `TypeError`.
 *   - It can be very slow when the host patches networking, because the report gathers network
 *     interface information (see microsoft/vscode#238607, nodejs/node#55576).
 *
 * Cheap filesystem probes are therefore tried first, and an inconclusive result reports glibc,
 * which is the common case. Callers must treat the result as a preference rather than a fact,
 * since `loadKeyring` falls back to the other ABI when the preferred binary does not load.
 *
 * @returns {boolean} True if the system appears to use musl.
 */
function isMuslLinux() {
    try {
        // musl installs its dynamic loader as /lib/ld-musl-<arch>.so.1; glibc systems do not have one.
        if (readdirSync("/lib").some((entry) => entry.startsWith("ld-musl-"))) {
            return true;
        }
    } catch (_err) {
        // /lib is unreadable or absent; fall through to process.report.
    }

    try {
        return process.report.getReport().header.glibcVersionRuntime == null;
    } catch (_err) {
        // process.report is unavailable in this runtime; assume glibc.
        return false;
    }
}

/**
 * Build the list of prebuild target names to try, in order of preference.
 *
 * On Linux both ABIs are returned so that an incorrect or indeterminate libc detection cannot
 * stop the module from loading; the non-matching binary simply fails to load and the next
 * candidate is tried.
 *
 * @returns {string[]} Prebuild target names, most likely to work first.
 */
function getTargetNames() {
    switch (process.platform) {
        case "win32":
            return [`win32-${process.arch}-msvc`];
        case "linux": {
            const target = (abi) =>
                process.arch === "arm"
                    ? `linux-arm-${abi}eabihf`
                    : `linux-${process.arch}-${abi}`;
            return isMuslLinux()
                ? [target("musl"), target("gnu")]
                : [target("gnu"), target("musl")];
        }
        case "darwin":
        default:
            return [`${process.platform}-${process.arch}`];
    }
}

const requireFn =
    typeof __webpack_require__ === "function"
        ? __non_webpack_require__
        : require;

/**
 * Load the native keyring binding for the current platform.
 *
 * @returns {object} The exports of the native module.
 * @throws {Error} If no candidate binary could be loaded. The message lists every path searched and
 * the underlying failure for each candidate, so the real cause is not hidden from the caller.
 */
function loadKeyring() {
    const paths = [__dirname, findPrebuildsDir(__dirname)].filter(Boolean);
    const attempts = [];

    for (const target of getTargetNames()) {
        const request = `./keyring.${target}.node`;
        try {
            return requireFn(requireFn.resolve(request, { paths }));
        } catch (err) {
            attempts.push(`  ${request}: ${err.message}`);
        }
    }

    const searchedPaths = paths.map(dir => `  ${dir}`).join("\n");
    const attemptedErrors = attempts.join("\n");

    throw new Error(
        `Failed to load the Zowe keyring native module for ${process.platform}-${process.arch}.\n` +
        `Searched in:\n${searchedPaths}\n` + `Attempted:\n${attemptedErrors}`
    );
}

const {
    deletePassword,
    findCredentials,
    findPassword,
    getPassword,
    setPassword,
    createTlsPipe,
} = loadKeyring();

module.exports.deletePassword = deletePassword;
module.exports.findCredentials = findCredentials;
module.exports.findPassword = findPassword;
module.exports.getPassword = getPassword;
module.exports.setPassword = setPassword;
module.exports.createTlsPipe = createTlsPipe;
