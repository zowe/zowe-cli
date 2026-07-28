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
 * Helper script to copy and clean bundled dependencies in package node_modules
 * before npm pack / npm publish, ensuring that direct third-party dependencies
 * are physically bundled into each SDK package tarball in npm workspace monorepo.
 *
 * Uses physical dereferenced copying (fs.cpSync) so npm pack creates clean,
 * non-relative tarball entry headers (package/node_modules/...) and avoids
 * TAR_ENTRY_ERROR "path contains .." warnings during npm install.
 */

const fs = require("fs");
const path = require("path");

function stageBundledDeps(action = process.argv[2]) {
    const validActions = ["link", "unlink", "stage", "unstage", "clean"];

    if (!action || !validActions.includes(action)) {
        console.error("Error: Missing or invalid command argument for stageBundledDeps.js.");
        console.error("Usage: node stageBundledDeps.js <link|unlink>");
        console.error("  - link: Copy direct third-party dependencies into local package node_modules.");
        console.error("  - unlink: Remove local package node_modules.");
        process.exit(1);
    }

    let projRoot = process.cwd();
    while (!fs.existsSync(path.join(projRoot, "lerna.json"))) {
        const parent = path.dirname(projRoot);
        if (parent === projRoot) {
            console.error("Error: Could not find project root containing lerna.json");
            return;
        }
        projRoot = parent;
    }

    const pkgJsonPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(pkgJsonPath)) {
        return;
    }

    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const bundled = pkgJson.bundledDependencies || pkgJson.bundleDependencies;

    // Skip if no bundledDependencies or if this is the CLI package (handled separately by bundleCliTgz.js)
    if (!Array.isArray(bundled) || bundled.length === 0 || pkgJson.name === "@zowe/cli") {
        return;
    }

    const targetNm = path.join(process.cwd(), "node_modules");
    const rootNm = path.join(projRoot, "node_modules");

    if (action === "unlink" || action === "unstage" || action === "clean") {
        if (fs.existsSync(targetNm)) {
            fs.rmSync(targetNm, { recursive: true, force: true });
            console.log(`[stageBundledDeps] Unlinked ${targetNm} for ${pkgJson.name}`);
        }
        return;
    }

    // Action: link (or stage)
    function copyPackageRecursive(pkgName, visited = new Set()) {
        if (visited.has(pkgName) || pkgName.startsWith("@zowe/")) {
            return;
        }
        visited.add(pkgName);

        const srcDir = path.join(rootNm, pkgName);
        if (!fs.existsSync(srcDir)) {
            console.warn(`[stageBundledDeps] Warning: ${pkgName} not found in ${rootNm}`);
            return;
        }

        const destDir = path.join(targetNm, pkgName);
        fs.mkdirSync(path.dirname(destDir), { recursive: true });

        if (!fs.existsSync(destDir)) {
            fs.cpSync(srcDir, destDir, { recursive: true, dereference: true });
        }

        const depPkgJsonPath = path.join(srcDir, "package.json");
        if (fs.existsSync(depPkgJsonPath)) {
            try {
                const depPkgJson = JSON.parse(fs.readFileSync(depPkgJsonPath, "utf-8"));
                if (depPkgJson.dependencies) {
                    for (const childDep of Object.keys(depPkgJson.dependencies)) {
                        copyPackageRecursive(childDep, visited);
                    }
                }
            } catch (e) {
                // Ignore JSON parse errors on child packages
            }
        }
    }

    const filterBundled = bundled.filter((dep) => !dep.startsWith("@zowe/"));
    if (filterBundled.length > 0) {
        fs.mkdirSync(targetNm, { recursive: true });
        const visited = new Set();
        for (const dep of filterBundled) {
            copyPackageRecursive(dep, visited);
        }
        console.log(`[stageBundledDeps] Staged ${visited.size} copied packages into ${targetNm} for ${pkgJson.name}`);
    }
}

if (require.main === module) {
    stageBundledDeps();
}

module.exports = stageBundledDeps;
