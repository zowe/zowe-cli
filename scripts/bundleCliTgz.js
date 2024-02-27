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
const fs = require("fs-extra");
const path = require("path");

// Workaround for https://github.com/npm/cli/issues/3466
process.chdir(__dirname + "/..");
const cliPkgDir = path.join(process.cwd(), "packages", "cli");
const pkgJsonFile = path.join(cliPkgDir, "package.json");
const execCmd = (cmd) => childProcess.execSync(cmd, { cwd: cliPkgDir, stdio: "inherit" });
fs.mkdirpSync("dist");
fs.renameSync(path.join(cliPkgDir, "node_modules"), path.join(cliPkgDir, "node_modules_old"));
fs.copyFileSync(pkgJsonFile, pkgJsonFile + ".bak");

try {
    // Install node_modules directly inside packages/cli
    execCmd("npm run preshrinkwrap");
    execCmd("npm install --ignore-scripts --workspaces=false");
    for (const zowePkgDir of fs.readdirSync(path.join(cliPkgDir, "node_modules", "@zowe"))) {
        const srcDir = path.join("node_modules", "@zowe", zowePkgDir);
        const destDir = path.join(cliPkgDir, srcDir);
        fs.rmSync(destDir, { recursive: true, force: true });
        fs.copySync(fs.realpathSync(srcDir), destDir);
    }

    // Define bundled dependencies in package.json and package the TGZ
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));
    pkgJson.bundledDependencies = [
        ...Object.keys(pkgJson.dependencies),
        ...Object.keys(pkgJson.optionalDependencies ?? {})
    ];
    fs.writeFileSync(pkgJsonFile, JSON.stringify(pkgJson, null, 2));
    execCmd("npm pack --pack-destination=../../dist");
} finally {
    fs.rmSync(path.join(cliPkgDir, "node_modules"), { recursive: true, force: true });
    fs.renameSync(path.join(cliPkgDir, "node_modules_old"), path.join(cliPkgDir, "node_modules"));
    fs.rmSync(path.join(cliPkgDir, "npm-shrinkwrap.json"), { force: true });
    fs.renameSync(pkgJsonFile + ".bak", pkgJsonFile);
}
