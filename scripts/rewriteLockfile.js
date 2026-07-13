/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*/

/**
 * Derives a standalone package-lock.json for packages/cli from the root
 * workspace package-lock.json, so that `npm install --workspaces=false`
 * inside packages/cli uses pinned versions from the workspace lockfile.
 *
 * This is the package-lock.json equivalent of the old rewriteShrinkwrap.js.
 *
 * Transformations applied to the workspace lockfile:
 *   1. Drop the monorepo root entry ("").
 *   2. Drop all workspace link entries (link: true) — e.g. node_modules/@zowe/*.
 *   3. Drop workspace package definition entries (packages/*, __tests__/*).
 *   4. Rebase packages/cli/node_modules/<pkg>  → node_modules/<pkg>
 *      (CLI-private version overrides become top-level in the standalone install).
 *   5. Rebase packages/<ws>/node_modules/<pkg> → node_modules/@zowe/<name>/node_modules/<pkg>
 *      (other workspace-private overrides stay nested under their @zowe package).
 *   6. Set the root entry ("") to @zowe/cli's own package.json metadata.
 */

const fs = require("fs");
const path = require("path");

const rootLockfile = path.join(__dirname, "..", "package-lock.json");
const cliPkgDir = process.cwd();
const outLockfile = path.join(cliPkgDir, "package-lock.json");
const cliPkgJson = JSON.parse(fs.readFileSync(path.join(cliPkgDir, "package.json"), "utf-8"));

const lock = JSON.parse(fs.readFileSync(rootLockfile, "utf-8"));

// Build mapping: workspace directory path → its node_modules path
// e.g. "packages/imperative" → "node_modules/@zowe/imperative"
const wsToNm = {};
for (const [k, v] of Object.entries(lock.packages)) {
    if (v.link && k.startsWith("node_modules/")) {
        wsToNm[v.resolved] = k;
    }
}

const newPackages = {};

for (const [k, v] of Object.entries(lock.packages)) {
    // Drop monorepo root
    if (k === "") continue;

    // Drop workspace link entries (symlinks in node_modules → workspace dirs)
    if (v.link) continue;

    // Handle workspace-scoped node_modules (packages/<ws>/node_modules/<pkg>)
    const wsEntry = Object.entries(wsToNm).find(([wsDir]) =>
        k.startsWith(wsDir + "/node_modules/")
    );
    if (wsEntry) {
        const [wsDir, nmPath] = wsEntry;
        const remainder = k.slice(wsDir.length); // "/node_modules/<pkg>[/node_modules/...]"
        if (wsDir === "packages/cli") {
            // CLI-private overrides → promote to top-level node_modules
            newPackages["node_modules" + remainder.slice("/node_modules".length)] = v;
        } else {
            // Other workspace private overrides → nest under their @zowe package path
            newPackages[nmPath + remainder] = v;
        }
        continue;
    }

    // Drop workspace package definition entries (packages/*, __tests__/*)
    if (k.startsWith("packages/") || k.startsWith("__tests__/")) continue;

    // Keep all regular hoisted node_modules entries verbatim
    newPackages[k] = v;
}

// Root entry describes @zowe/cli itself
newPackages[""] = {
    name: cliPkgJson.name,
    version: cliPkgJson.version,
    ...(cliPkgJson.dependencies && { dependencies: cliPkgJson.dependencies }),
    ...(cliPkgJson.optionalDependencies && { optionalDependencies: cliPkgJson.optionalDependencies }),
    ...(cliPkgJson.devDependencies && { devDependencies: cliPkgJson.devDependencies }),
    ...(cliPkgJson.engines && { engines: cliPkgJson.engines })
};

const outLock = {
    name: cliPkgJson.name,
    version: cliPkgJson.version,
    lockfileVersion: lock.lockfileVersion,
    requires: true,
    packages: newPackages
};

fs.writeFileSync(outLockfile, JSON.stringify(outLock, null, 2));
console.log(`Lockfile written to ${outLockfile} (${Object.keys(newPackages).length} entries)`);
