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

const childProcess = require("child_process");
const fs = require("fs");
const chalk = require("chalk");

const rootLockfilePath = __dirname + "/../package-lock.json";
const newLockfilePath =
    process.cwd() + "/" + (process.argv[2] ?? "package-lock.json");

// Remove "file:" links from lock file
const lockFile = JSON.parse(fs.readFileSync(rootLockfilePath, "utf-8"));
for (const [k, v] of Object.entries(lockFile.packages)) {
    if (v.link) {
        delete lockFile.packages[k];
    }
}
fs.writeFileSync(newLockfilePath, JSON.stringify(lockFile, null, 2));

// Build deduped lock file for subpackage (e.g. @zowe/cli or web-help)
const zoweRegistry = require("../lerna.json").command.publish.registry;
const npmArgs = [
    "--ignore-scripts",
    "--no-audit",
    "--package-lock-only",
    "--workspaces=false",
    `--@zowe:registry=${zoweRegistry}`,
];
childProcess.exec(`npm install ${npmArgs.join(" ")}`, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        console.log(chalk.green("Lockfile contents written!"));
    }
});
