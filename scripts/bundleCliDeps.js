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

// Deps, or specific paths within a dep, that compile platform-specific binaries on install and so
// are left out entirely: a bare name excludes the whole package, "pkg:sub/path" just that subpath.
const excludedPaths = ["cpu-features", "ssh2:lib/protocol/crypto/build"];
const excludedDeps = new Set(excludedPaths.filter((p) => !p.includes(":")));
const excludedSubpaths = excludedPaths
    .filter((p) => p.includes(":"))
    .map((p) => ({ name: p.slice(0, p.indexOf(":")), subpath: p.slice(p.indexOf(":") + 1) }));

const pkgDir = process.cwd();
process.chdir(path.join(__dirname, ".."));
const scriptName = path.basename(__filename, ".js");
const pkgNodeModules = path.join(pkgDir, "node_modules");
const nodeModulesBackup = path.join(pkgDir, "node_modules_old");
const pkgJsonFile = path.join(pkgDir, "package.json");
const { name: pkgName, private: isPrivate } = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));

function updatePkgJson(update) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));
    update(pkgJson);
    fs.writeFileSync(pkgJsonFile, JSON.stringify(pkgJson, null, 2) + "\n");
}

function normalizePath(realPath) {
    return path.relative(process.cwd(), realPath).split(path.sep).join("/");
}
const relPkgDir = normalizePath(pkgDir);

// The package's runtime deps, as npm resolved them on disk. An optional dep npm never installed
// (e.g. a platform-specific native) has no path to copy from, so it is skipped.
function prodDepTree() {
    let output;
    try {
        output = childProcess.execSync(`npm ls --all --omit=dev --json --long -w ${pkgName}`, {
            maxBuffer: 1024 * 1024 * 100,
        });
    } catch (err) {
        // npm exits non-zero for problems like missing optional/peer deps, but still writes valid JSON to stdout.
        if (err.stdout == null || err.stdout.length === 0) throw err;
        output = err.stdout;
    }

    const tree = new Map(); // real absolute path -> npm ls entry
    const skipped = [];
    const queue = [JSON.parse(output).dependencies[pkgName]];
    while (queue.length > 0) {
        for (const [name, dep] of Object.entries(queue.shift().dependencies ?? {})) {
            if (excludedDeps.has(name) || dep.path == null) {
                skipped.push(name);
            } else if (!tree.has(dep.path)) {
                tree.set(dep.path, dep);
                queue.push(dep);
            }
        }
    }
    return { tree, skipped };
}

// Where each dep goes in the packed tarball: paths already under a node_modules keep npm's hoisted
// layout, and a version conflict nested under some package lands under that package's own packed copy.
function archiveLocations(tree) {
    // Workspaces carry a "file:" spec, so mapping them needs no scan of the repo layout.
    const owners = new Map([[relPkgDir, ""]]); // real dir -> packed location, "" being this package
    for (const entry of tree.values()) {
        if (entry.resolved?.startsWith("file:")) {
            owners.set(normalizePath(fs.realpathSync(entry.path)), "node_modules/" + entry.name);
        }
    }

    const locate = (archivePath) => {
        if (archivePath.startsWith("node_modules/")) return archivePath;
        for (const [ownerDir, location] of owners) {
            if (archivePath === ownerDir) return location;
            if (!archivePath.startsWith(ownerDir + "/")) continue;
            const nested = archivePath.slice(ownerDir.length + 1);
            return location === "" ? nested : `${location}/${nested}`;
        }
        throw new Error(`${scriptName}: cannot place "${archivePath}" inside the packed tarball`);
    };
    return new Map([...tree.keys()].map((realPath) => [realPath, locate(normalizePath(realPath))]));
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

// Undoes the rename in prepack. No backup means there was no node_modules to begin with, so just
// remove what prepack staged instead of restoring anything.
function restoreNodeModules() {
    fs.rmSync(pkgNodeModules, { recursive: true, force: true });
    if (fs.existsSync(nodeModulesBackup)) {
        fs.renameSync(nodeModulesBackup, pkgNodeModules);
    }
}

async function prepack() {
    if (fs.existsSync(nodeModulesBackup)) {
        throw new Error(`${scriptName}: "${nodeModulesBackup}" already exists -- a previous run may not have finished cleanly`);
    }
    const { tree, skipped } = prodDepTree();
    const locations = archiveLocations(tree);

    // Shallowest first, so a package is always in place before anything nested inside it.
    const placements = [...locations].sort((a, b) => a[1].split("/").length - b[1].split("/").length);

    if (fs.existsSync(pkgNodeModules)) fs.renameSync(pkgNodeModules, nodeModulesBackup);
    try {
        fs.mkdirSync(pkgNodeModules, { recursive: true });
        const localBuilds = [];

        for (const [realPath, archiveLocation] of placements) {
            // A package's own copy can already include a nested node_modules also listed separately.
            const targetPath = path.join(pkgDir, archiveLocation);
            if (fs.existsSync(targetPath)) continue;

            // Anything under this package's own node_modules moved with the rename above. Workspace deps
            // point at their node_modules symlink, which fs calls read through.
            const sourceDir = realPath.startsWith(pkgNodeModules + path.sep)
                ? path.join(nodeModulesBackup, realPath.slice(pkgNodeModules.length + 1))
                : realPath;

            const entry = tree.get(realPath);
            const skipPrefixes = excludedSubpaths.filter((s) => s.name === entry.name).map((s) => s.subpath + path.sep);
            const files = (await filesToBundle(entry, sourceDir)).filter((file) => !skipPrefixes.some((p) => file.startsWith(p)));

            // A compiled .node under build/ means this was built here, for this machine only.
            if (files.some((file) => /(^|[\\/])build[\\/].*\.node$/i.test(file))) localBuilds.push(entry.name);

            for (const file of files) {
                const targetFile = path.join(targetPath, file);
                fs.mkdirSync(path.dirname(targetFile), { recursive: true });
                fs.copyFileSync(path.join(sourceDir, file), targetFile);
            }
        }

        if (skipped.length > 0) {
            console.log(`${scriptName}: skipped ${skipped.length} optional dependencies: ${skipped.join(", ")}`);
        }
        if (localBuilds.length > 0) {
            console.warn(`${scriptName}: WARNING: ${localBuilds.join(", ")} bundled a local native build, ` +
                `which will not work on other platforms -- add it (or the offending subpath) to excludedPaths`);
        }
        console.log(`${scriptName}: staged ${placements.length} dependencies`);

        // Pack time only, since committing bundleDependencies breaks "npm ci". Just the direct deps, as
        // npm pulls in each one's own; "true" covers "dependencies" alone, leaving optional ones out.
        updatePkgJson((pkgJson) => {
            const direct = [...Object.keys(pkgJson.dependencies ?? {}), ...Object.keys(pkgJson.optionalDependencies ?? {})];
            // Skip any optional dep npm never installed, which has nothing staged to bundle.
            pkgJson.bundleDependencies = direct.filter((name) => fs.existsSync(path.join(pkgNodeModules, name))).sort();
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
    console.error(`Usage: cd <package> && node ${path.relative(pkgDir, __filename)} <prepack|postpack>`);
    process.exit(1);
} else if (isPrivate) {
    console.error(`${scriptName}: "${pkgName}" is private, so cannot bundle dependencies`);
    process.exit(1);
}
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
