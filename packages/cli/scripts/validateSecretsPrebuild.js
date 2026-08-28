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

/* Verify that the Secrets SDK has a keyring prebuild this platform can load.
 *
 * @zowe/secrets-for-zowe-sdk is an optional dependency of the CLI, so npm
 * quietly omits it whenever its install script fails - for example, when no
 * prebuild ships for the platform and no Rust toolchain is available to build
 * one. The CLI still installs and reports success in that state, but secure
 * credential storage is unavailable and the only symptom the user ever sees is
 * a "Failed to load Keytar module" error the first time a command reads a
 * credential. This script turns that into an actionable warning at install
 * time, while the user is still looking at the terminal.
 *
 * This script is run in our package.json:scripts:postinstall as:
 *    node ./scripts/validateSecretsPrebuild.js
 * It runs last in the chain so that any warning is the final thing printed,
 * rather than scrolling past above the "successfully installed" message.
 *
 * A missing prebuild is a warning, not an error: nothing here is allowed to
 * exit non-zero, because doing so would fail the whole `npm install`.
 */

const fs = require("fs");
const path = require("path");

const SECRETS_PKG = "@zowe/secrets-for-zowe-sdk";
const DOC_LINK = "https://github.com/zowe/zowe-cli/blob/master/packages/secrets/README.md#troubleshooting";

/* The platform target that the keyring loader builds its binary file name from.
 * Kept deliberately identical to getTargetName() in the Secrets SDK's
 * src/keyring/index.js, so that the file name we report as missing is the exact
 * file name the loader looked for.
 */
function getTargetName() {
    switch (process.platform) {
        case "win32":
            return `win32-${process.arch}-msvc`;
        case "linux": {
            const isMusl = process.report.getReport().header.glibcVersionRuntime == null;
            const abi = isMusl ? "musl" : "gnu";
            return process.arch === "arm" ? `linux-arm-${abi}eabihf` : `linux-${process.arch}-${abi}`;
        }
        default:
            return `${process.platform}-${process.arch}`;
    }
}

function resolveQuietly(request) {
    try {
        return require.resolve(request, { paths: [__dirname, process.cwd()] });
    } catch (_err) {
        return undefined;
    }
}

function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (_err) {
        return {};
    }
}

/* Look for the prebuild in both places the keyring loader accepts: its own
 * directory, where a local `npm run rebuild` writes the binary, and the
 * package's prebuilds folder, where the published binaries live.
 */
function findPrebuild(pkgDir, target) {
    const binaryName = `keyring.${target}.node`;
    return [path.join(pkgDir, "src", "keyring"), path.join(pkgDir, "prebuilds")]
        .map((dir) => path.join(dir, binaryName))
        .find((file) => fs.existsSync(file));
}

/* Returns a description of what is wrong, or undefined when the Secrets SDK is
 * usable. We only load the module - we never call into it, since reading the
 * credential vault during an install could prompt the user for keychain access.
 */
function diagnose(target) {
    const pkgJsonFile = resolveQuietly(`${SECRETS_PKG}/package.json`);

    if (pkgJsonFile == null) {
        return {
            kind: "notInstalled",
            problem: `${SECRETS_PKG} is not installed.`,
            cause: "npm omits this optional dependency when its install script fails, which " +
                "usually means no prebuild shipped for this platform and no Rust toolchain " +
                "was available to build one."
        };
    }

    const pkgDir = path.dirname(pkgJsonFile);
    const version = readJson(pkgJsonFile).version;

    if (findPrebuild(pkgDir, target) == null) {
        return {
            kind: "noPrebuild",
            problem: `${SECRETS_PKG}@${version} contains no keyring prebuild for ${target}.`,
            cause: `The keyring loader expects keyring.${target}.node, which is not present ` +
                "in this installation, so the module has to be built from source here."
        };
    }

    try {
        const { keyring } = require(pkgDir);
        if (typeof keyring.getPassword !== "function") {
            return {
                kind: "noPrebuild",
                problem: `The keyring prebuild for ${target} loaded but is missing expected functions.`,
                cause: `${SECRETS_PKG}@${version} looks like a partial or corrupted installation.`
            };
        }
        return undefined;
    } catch (err) {
        return {
            kind: "unloadable",
            problem: `The keyring prebuild for ${target} is present but could not be loaded.`,
            cause: `The operating system rejected the native module: ${err.message}`
        };
    }
}

/* The repair steps the user should follow, tailored to what we found. We do not
 * attempt the repair ourselves: rebuilding a native module needs prerequisites
 * we cannot install, and re-entering npm from inside a lifecycle script is not
 * safe.
 */
function repairSteps(problem) {
    const isGlobal = process.env.npm_config_global === "true";
    const cliVersion = readJson(path.join(process.cwd(), "package.json")).version;
    const reinstall = isGlobal
        ? `npm install -g @zowe/cli@${cliVersion} --foreground-scripts`
        : "npm install --foreground-scripts";

    switch (problem.kind) {
        case "notInstalled":
            // We cannot tell why npm skipped the package, so the first step is to
            // make it say so out loud rather than to guess at a prerequisite.
            return `To repair:

1. Re-run the install with --foreground-scripts. That prints the install
   script output that npm hid the first time:

     ${reinstall}

2. Install whatever that output reports as missing, then repeat step 1.
   - A failed Rust/cargo command means the module had to be built from
     source: install the toolchain from https://rustup.rs
   - A missing shared library on Linux (e.g. libsecret-1.so.0) means the
     libsecret runtime is absent: install it with "apt install libsecret-1-0"
     or "yum install libsecret"`;

        case "noPrebuild":
            return `To repair:

1. Install the Rust toolchain from https://rustup.rs so the keyring module
   can be built for this platform.

2. Rebuild the Secrets SDK in place, without reinstalling the CLI:

     npm rebuild ${SECRETS_PKG}

   If that is not an option, reinstall the CLI instead:

     ${reinstall}`;

        default:
            // The binary is fine; the OS could not satisfy its dependencies. A
            // rebuild produces the same binary, so do not suggest one.
            return `To repair:

1. Install the credential storage prerequisites for your platform. On Linux
   this is the libsecret runtime: "apt install libsecret-1-0" or
   "yum install libsecret".

2. Re-run the failed Zowe CLI command. No reinstall is needed once the
   prerequisites are in place.`;
    }
}

function printWarning(problem, target) {
    console.log(`
Warning: Zowe CLI cannot use secure credential storage

${problem.problem}
${problem.cause}

Zowe CLI is installed and will run, but it cannot store or read credentials
securely until this is resolved. Commands that need a stored credential fail
with "Failed to load Keytar module".

${repairSteps(problem)}

Detected platform: ${target} (node ${process.version})
Full troubleshooting steps:
  ${DOC_LINK}
`);
}

function validateSecretsPrebuild() {
    /* Only check an end-user install. A source checkout that has not been built
     * yet has no lib/main.js and no compiled Secrets SDK either, so checking
     * there would warn every contributor who runs `npm install` before
     * `npm run build`. This is the same guard validatePlugins.js uses.
     */
    if (!fs.existsSync(path.join(process.cwd(), "lib", "main.js"))) {
        return;
    }

    const target = getTargetName();
    const problem = diagnose(target);
    if (problem != null) {
        printWarning(problem, target);
    }
}

try {
    validateSecretsPrebuild();
} catch (err) {
    // A diagnostic must never break an install, so swallow anything unexpected.
    console.log(`Could not verify secure credential storage for Zowe CLI: ${err.message}`);
}
