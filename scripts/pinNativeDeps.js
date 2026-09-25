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
const path = require("path");

const nativeDeps = [
    {
        name: "cpu-features",
        workspace: "packages/cli",
        optional: true
    }
];
const lockfile = JSON.parse(fs.readFileSync("package-lock.json", "utf-8"));
for (const dep of nativeDeps) {
    const pkgKey = `${dep.optional ? "optionalDependencies" : "dependencies"}.${dep.name}`
    const pkgVersion = lockfile.packages[`node_modules/${dep.name}`]?.version;
    if (pkgVersion) {
        childProcess.execSync(`npm pkg set ${pkgKey}=${pkgVersion}`, { cwd: path.resolve(dep.workspace) });
        try {
            childProcess.execSync(`npm install ${dep.name}@${pkgVersion} --no-save`, { stdio: "pipe" });
        } catch (error) {
            console.error(`Error installing optional dependency ${dep.name}: ${error.stderr.toString()}`);
        }
    }
}
