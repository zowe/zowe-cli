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

// Node's resolution over lockfile keys: try <dir>/node_modules/<name>, walk up, follow workspace links.
function resolveDep(packages, fromPath, name) {
    for (let dir = fromPath; ; ) {
        const key = (dir === "" ? "" : dir + "/") + "node_modules/" + name;
        const entry = packages[key];
        if (entry != null) {
            return entry.link ? { lockPath: entry.resolved, entry: packages[entry.resolved] } : { lockPath: key, entry };
        }
        if (dir === "") return null;
        const nested = dir.lastIndexOf("/node_modules/");
        dir = nested === -1 ? "" : dir.slice(0, nested);
    }
}

// What packages/cli needs at runtime, at lockfile-pinned versions. Prod/optional edges, not npm's dev flags.
function prodClosureOf(packages) {
    const closure = new Map(); // lockfile key -> lockfile entry
    const queue = [[packageDir, packages[packageDir]]];
    while (queue.length > 0) {
        const [fromPath, entry] = queue.shift();
        const optional = new Set(Object.keys(entry.optionalDependencies ?? {}));
        for (const name of new Set([...Object.keys(entry.dependencies ?? {}), ...optional])) {
            const found = resolveDep(packages, fromPath, name);
            if (found == null) {
                // A missing optional dep is normal; anything else means a stale lockfile and a short bundle.
                if (optional.has(name)) continue;
                throw new Error(`bundleCliDeps: "${fromPath}" depends on "${name}", which the lockfile does not resolve`);
            }
            if (closure.has(found.lockPath)) continue;
            closure.set(found.lockPath, found.entry);
            queue.push([found.lockPath, found.entry]);
        }
    }
    return closure;
}

// Where an entry belongs in the packed CLI: npm's own hoisted layout, with workspace paths rewritten.
function archiveLocationOf(lockPath, linkPathByWorkspace) {
    if (lockPath.startsWith(packageDir + "/")) return lockPath.slice(packageDir.length + 1);
    if (lockPath.startsWith("node_modules/")) return lockPath;

    for (const [workspace, linkPath] of linkPathByWorkspace) {
        if (lockPath === workspace) return linkPath;
        if (lockPath.startsWith(workspace + "/")) return linkPath + lockPath.slice(workspace.length);
    }
    throw new Error(`bundleCliDeps: cannot place "${lockPath}" inside the packed CLI`);
}

// Every file under a directory, relative to it. statSync also filters out broken symlinks.
function filesUnder(dir) {
    return fs.readdirSync(dir, { recursive: true }).filter((file) => {
        try {
            return fs.statSync(path.join(dir, file)).isFile();
        } catch {
            return false;
        }
    });
}

// Only what a workspace package publishes; detached so packlist skips bundled deps (it throws on missing ones).
function publishedFilesOf(sourceDir) {
    const pkg = JSON.parse(fs.readFileSync(path.join(sourceDir, "package.json"), "utf-8"));
    delete pkg.bundleDependencies;
    delete pkg.bundledDependencies;
    return packlist({ path: sourceDir, package: pkg, isProjectRoot: true, edgesOut: new Map() });
}

// Where a lockfile entry lives on disk; entries nested under cli's own node_modules moved to the backup.
function sourceDirOf(lockPath) {
    const nestedPrefix = packageDir + "/node_modules/";
    if (lockPath.startsWith(nestedPrefix)) return path.join(cliNodeModulesBackup, lockPath.slice(nestedPrefix.length));
    return path.join(repoRoot, lockPath);
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
    const { packages } = JSON.parse(fs.readFileSync(path.join(repoRoot, "package-lock.json"), "utf-8"));

    // Workspace packages appear twice: as a "link" under node_modules and as the directory it points at.
    const linkPathByWorkspace = new Map();
    for (const [key, entry] of Object.entries(packages)) {
        if (entry.link && key.startsWith("node_modules/") && entry.resolved !== packageDir) {
            linkPathByWorkspace.set(entry.resolved, key);
        }
    }

    // Shallowest first, so a package is always in place before anything nested inside it.
    const placements = [...prodClosureOf(packages).keys()]
        .map((lockPath) => ({ lockPath, archiveLocation: archiveLocationOf(lockPath, linkPathByWorkspace) }))
        .sort((a, b) => a.archiveLocation.split("/").length - b.archiveLocation.split("/").length);

    if (fs.existsSync(cliNodeModules)) fs.renameSync(cliNodeModules, cliNodeModulesBackup);
    try {
        fs.mkdirSync(cliNodeModules, { recursive: true });
        const bundled = [];
        const skipped = [];

        for (const { lockPath, archiveLocation } of placements) {
            const sourceDir = sourceDirOf(lockPath);
            if (!fs.existsSync(sourceDir)) {
                // Missing is only expected for an optional dep npm skipped (e.g. platform-specific).
                if (!packages[lockPath]?.optional) {
                    throw new Error(
                        `bundleCliDeps: "${lockPath}" is in the prod dependency tree but is not installed on disk (did you run npm ci?)`
                    );
                }
                skipped.push(lockPath);
                continue;
            }
            if (!archiveLocation.includes("/node_modules/")) bundled.push(archiveLocation.slice("node_modules/".length));

            // A package's own copy can already include a nested node_modules also listed separately.
            const targetPath = path.join(cliPkgDir, archiveLocation);
            if (fs.existsSync(targetPath)) continue;

            const files = linkPathByWorkspace.has(lockPath) ? await publishedFilesOf(sourceDir) : filesUnder(sourceDir);
            for (const file of files) {
                const targetFile = path.join(targetPath, file);
                fs.mkdirSync(path.dirname(targetFile), { recursive: true });
                fs.copyFileSync(path.join(sourceDir, file), targetFile);
            }
        }

        if (skipped.length > 0) {
            console.log(`bundleCliDeps: skipped ${skipped.length} optional dependencies not installed here: ${skipped.join(", ")}`);
        }
        console.log(`bundleCliDeps: staged ${bundled.length} bundled dependencies`);

        // Pack time only: "true" would drop the hoisted transitive deps, and committing either form breaks "npm ci".
        updatePkgJson((pkgJson) => (pkgJson.bundleDependencies = bundled.sort()));
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
