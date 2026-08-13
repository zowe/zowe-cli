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

/*
This script works around npm bugs related to bundling deps in workspaces:
 1. Deps located in root node_modules are not bundled:
    https://github.com/npm/cli/issues/3466
 2. Symlinked node_modules result in paths with backtracking in TGZ
 3. Installing CLI deps fails in CI when bundleDependencies is true
 4. Copying lockfile into CLI package dir may not resolve all deps correctly
*/

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const packlist = require("npm-packlist");

/* Constants to update for each repository */
const packageDir = "packages/cli";

process.chdir(__dirname + "/..");
const repoRoot = process.cwd();
const cliPkgDir = path.join(repoRoot, packageDir);
const cliNodeModules = path.join(cliPkgDir, "node_modules");
const cliNodeModulesBackup = path.join(cliPkgDir, "node_modules_old");
const pkgJsonFile = path.join(cliPkgDir, "package.json");

// Matches how npm formats package.json, so adding and removing bundleDependencies leaves it unchanged.
function updatePkgJson(update) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));
    update(pkgJson);
    fs.writeFileSync(pkgJsonFile, JSON.stringify(pkgJson, null, 2) + "\n");
}

// Always "/"-separated, however the platform spells paths, since archive layout is too.
function toArchivePath(realPath) {
    return path.relative(repoRoot, realPath).split(path.sep).join("/");
}

// The CLI's runtime deps, as npm resolved them on disk. An optional dep npm never installed
// (e.g. a platform-specific native) has no path to copy from, so it is skipped.
function prodDepTree(cliPkgName) {
    const output = childProcess.execSync(`npm ls --all --omit=dev --json --long -w ${cliPkgName}`, {
        cwd: repoRoot,
        maxBuffer: 1024 * 1024 * 200,
    });

    const tree = new Map(); // real absolute path -> npm ls entry
    const skipped = [];
    const queue = [JSON.parse(output).dependencies[cliPkgName]];
    while (queue.length > 0) {
        for (const [name, dep] of Object.entries(queue.shift().dependencies ?? {})) {
            if (dep.path == null) {
                skipped.push(name);
            } else if (!tree.has(dep.path)) {
                tree.set(dep.path, dep);
                queue.push(dep);
            }
        }
    }
    return { tree, skipped };
}

// Where each dep goes in the packed CLI: paths already under a node_modules keep npm's hoisted layout,
// and a version conflict nested under some package lands under that package's own packed copy.
function archiveLocations(tree) {
    // Workspaces carry a "file:" spec, so mapping them needs no scan of the repo layout.
    const owners = new Map([[packageDir, ""]]); // real dir -> packed location, "" being the CLI itself
    for (const entry of tree.values()) {
        if (entry.resolved?.startsWith("file:")) {
            owners.set(toArchivePath(fs.realpathSync(entry.path)), "node_modules/" + entry.name);
        }
    }

    const locate = (archivePath) => {
        if (archivePath.startsWith("node_modules/")) return archivePath;
        for (const [ownerDir, location] of owners) {
            if (!archivePath.startsWith(ownerDir + "/")) continue;
            const nested = archivePath.slice(ownerDir.length + 1);
            return location === "" ? nested : `${location}/${nested}`;
        }
        throw new Error(`bundleCliDeps: cannot place "${archivePath}" inside the packed CLI`);
    };
    return new Map([...tree.keys()].map((realPath) => [realPath, locate(toArchivePath(realPath))]));
}

// A registry package on disk is already its published content, so it ships verbatim; filtering again
// would drop files it has. Workspace source is filtered, detached so packlist skips bundled deps.
function filesToBundle(entry, sourceDir) {
    if (!entry.resolved?.startsWith("file:")) {
        return fs.readdirSync(sourceDir, { recursive: true }).filter((file) => {
            try {
                return fs.statSync(path.join(sourceDir, file)).isFile();
            } catch {
                return false; // a broken symlink has nothing to copy
            }
        });
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(sourceDir, "package.json"), "utf-8"));
    delete pkg.bundleDependencies;
    delete pkg.bundledDependencies;
    return packlist({ path: sourceDir, package: pkg, isProjectRoot: true, edgesOut: new Map() });
}

// Undoes the rename in prepack. The backup's existence is the only state this script tracks.
function restoreNodeModules() {
    if (!fs.existsSync(cliNodeModulesBackup)) {
        throw new Error(`bundleCliDeps: no backup at "${cliNodeModulesBackup}" to restore -- was postpack run without a matching prepack?`);
    }
    fs.rmSync(cliNodeModules, { recursive: true, force: true });
    fs.renameSync(cliNodeModulesBackup, cliNodeModules);
}

async function prepack() {
    if (fs.existsSync(cliNodeModulesBackup)) {
        throw new Error(`bundleCliDeps: "${cliNodeModulesBackup}" already exists -- a previous run may not have finished cleanly`);
    }
    const cliPkgName = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8")).name;
    const { tree, skipped } = prodDepTree(cliPkgName);
    const locations = archiveLocations(tree);

    // Shallowest first, so a package is always in place before anything nested inside it.
    const placements = [...locations].sort((a, b) => a[1].split("/").length - b[1].split("/").length);

    if (fs.existsSync(cliNodeModules)) fs.renameSync(cliNodeModules, cliNodeModulesBackup);
    try {
        fs.mkdirSync(cliNodeModules, { recursive: true });

        for (const [realPath, archiveLocation] of placements) {
            // A package's own copy can already include a nested node_modules also listed separately.
            const targetPath = path.join(cliPkgDir, archiveLocation);
            if (fs.existsSync(targetPath)) continue;

            // Anything under the CLI's own node_modules moved with the rename above. Workspace deps
            // point at their node_modules symlink, which fs calls read through.
            const sourceDir = realPath.startsWith(cliNodeModules + path.sep)
                ? path.join(cliNodeModulesBackup, realPath.slice(cliNodeModules.length + 1))
                : realPath;

            for (const file of await filesToBundle(tree.get(realPath), sourceDir)) {
                const targetFile = path.join(targetPath, file);
                fs.mkdirSync(path.dirname(targetFile), { recursive: true });
                fs.copyFileSync(path.join(sourceDir, file), targetFile);
            }
        }

        if (skipped.length > 0) {
            console.log(`bundleCliDeps: skipped ${skipped.length} optional dependencies not installed here: ${skipped.join(", ")}`);
        }
        console.log(`bundleCliDeps: staged ${placements.length} dependencies`);

        // Pack time only, since committing bundleDependencies breaks "npm ci". Just the direct deps, as
        // npm pulls in each one's own; "true" covers "dependencies" alone, leaving secrets unbundled.
        updatePkgJson((pkgJson) => {
            const direct = [...Object.keys(pkgJson.dependencies ?? {}), ...Object.keys(pkgJson.optionalDependencies ?? {})];
            // Skip any optional dep npm never installed, which has nothing staged to bundle.
            pkgJson.bundleDependencies = direct.filter((name) => fs.existsSync(path.join(cliNodeModules, name))).sort();
        });
    } catch (err) {
        restoreNodeModules();
        throw err;
    }
}

async function postpack() {
    restoreNodeModules();
    updatePkgJson((pkgJson) => delete pkgJson.bundleDependencies);
}

const run = { prepack, postpack }[process.argv[2]];
if (run == null) {
    console.error(`Usage: node ${path.basename(__filename)} <prepack|postpack>`);
    process.exit(1);
}
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
