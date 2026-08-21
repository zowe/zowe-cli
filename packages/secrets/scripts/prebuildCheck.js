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

const { join } = require("path");

try {
    require(join("..", "lib", "index.js"));
} catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "MODULE_NOT_FOUND") {
        // The prebuild is missing entirely. A local build can supply it, so fail here
        // and let the "install" script fall through to "npm run rebuild".
        throw new Error(`Unable to find prebuilds for Secrets SDK keyring module: ${err.message}`);
    }

    // The prebuild exists but this system cannot load it - usually a missing shared
    // library such as libsecret on Linux. A local build cannot fix that, because the
    // build needs the same library, so failing here would only break the install
    // without producing a working keyring. Warn clearly instead of exiting non-zero:
    // the user keeps a usable CLI but must know that secure storage is unavailable.
    console.error([
        "",
        "WARNING: the keyring module for secure credentials could not be loaded.",
        `  Reason: ${err.message}`,
        "",
        "  Zowe commands still work, but secure values cannot be read or written.",
        "  On Linux, install the libsecret runtime library:",
        "    Debian/Ubuntu:  sudo apt-get install libsecret-1-0",
        "    RHEL/Fedora:    sudo dnf install libsecret",
        "  Then run 'zowe config report-env' to confirm the keyring loads.",
        "",
        "  Until then, avoid storing credentials in a Zowe configuration file.",
        "  Zowe writes that file with the permissions your umask produces, so other",
        "  accounts on this system may be able to read it.",
        ""
    ].join("\n"));
}
