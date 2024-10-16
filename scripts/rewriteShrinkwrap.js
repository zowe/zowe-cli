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
const chalk = require("chalk");
const getLockfile = require("npm-lockfile/getLockfile");

const rootShrinkwrapFile = __dirname + "/../npm-shrinkwrap.json";
const newShrinkwrapFile = process.cwd() + "/" + (process.argv[2] ?? "npm-shrinkwrap.json");

// Remove "file:" links from shrinkwrap
const shrinkwrap = JSON.parse(fs.readFileSync(rootShrinkwrapFile, "utf-8"));
for (const [k, v] of Object.entries(shrinkwrap.packages)) {
    if (v.link) {
        delete shrinkwrap.packages[k];
    }
}
fs.writeFileSync(newShrinkwrapFile, JSON.stringify(shrinkwrap, null, 2));

// Build deduped shrinkwrap for subpackage (@zowe/cli or web-help)
const zoweRegistry = require("../lerna.json").command.publish.registry;
getLockfile(newShrinkwrapFile, undefined, { "@zowe:registry": zoweRegistry })
    .then((lockfile) => fs.writeFileSync(newShrinkwrapFile, lockfile))
    .then(() => console.log(chalk.green("Lockfile contents written!")))
    .catch((err) => { console.error(err); process.exit(1); });
