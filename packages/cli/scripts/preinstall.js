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

// For global installs, configure prebuild-install to find Keytar prebuilds bundled with CLI
const fs = require("fs");
const { join } = require("path");
const prebuildsDir = join(__dirname, "..", "prebuilds");
if (process.env.npm_config_global && fs.existsSync(prebuildsDir)) {
    fs.writeFileSync(".prebuild-installrc", `local-prebuilds=${prebuildsDir}`);
}
