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
const path = require("path");
const Arborist = require("@npmcli/arborist");
const packlist = require("npm-packlist");

// Workaround for https://github.com/npm/cli/issues/3466
process.chdir(__dirname + "/..");
const repoRoot = process.cwd();
const cliPkgDir = path.join(repoRoot, "packages", "cli");
const cliNodeModules = path.join(cliPkgDir, "node_modules");
const pkgJsonFile = path.join(cliPkgDir, "package.json");
// Inside node_modules so it is already ignored by git, and never picked up by npm pack.
const stateFile = path.join(cliNodeModules, ".bundle-deps-state.json");

// Rewrites package.json the way npm formats it, so toggling bundleDependencies leaves it untouched.
function updatePkgJson(update) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));
    update(pkgJson);
    fs.writeFileSync(pkgJsonFile, JSON.stringify(pkgJson, null, 2) + "\n");
}

// Nodes reachable from packages/cli through prod and optional edges only - 201 of the monorepo tree's
// 1355. Filtering on each node's own dev flag instead would additionally bundle rimraf, its subtree and
// cli-test-utils, since npm computes dev-ness against the whole workspace, not one member of it.
function prodClosureOf(cliNode) {
    const reachable = new Set();
    const queue = [cliNode];
    while (queue.length > 0) {
        for (const edge of queue.shift().edgesOut.values()) {
            if ((edge.type !== "prod" && edge.type !== "optional") || edge.to == null) continue;
            const node = edge.to.isLink ? edge.to.target : edge.to;
            if (!reachable.has(node)) {
                reachable.add(node);
                queue.push(node);
            }
        }
    }
    return reachable;
}

// The monorepo tree is npm's own hoisted, deduped layout, so it transfers over as-is; only workspace
// paths are rewritten, from "packages/imperative/..." to "node_modules/@zowe/imperative/...".
function archiveLocationOf(location, linkLocationByWorkspace) {
    if (location.startsWith("packages/cli/")) return location.slice("packages/cli/".length);
    if (location.startsWith("node_modules/")) return location;

    for (const [workspace, linkLocation] of linkLocationByWorkspace) {
        if (location === workspace) return linkLocation;
        if (location.startsWith(workspace + "/")) return linkLocation + location.slice(workspace.length);
    }
    throw new Error(`bundleCliDeps: cannot place "${location}" inside the packed CLI`);
}

// Every file under a directory, relative to it, with symlinks resolved.
function filesUnder(dir, prefix = "") {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name);
        let stats;
        try {
            stats = fs.statSync(entryPath);
        } catch {
            continue; // broken symlink
        }
        if (stats.isDirectory()) files.push(...filesUnder(entryPath, prefix + entry.name + "/"));
        else if (stats.isFile()) files.push(prefix + entry.name);
    }
    return files;
}

// Only what a workspace package would publish; its source directory also holds gigabytes of build
// output. The detached stand-in stops packlist walking bundled deps (it throws on uninstalled optional).
function publishedFilesOf(node) {
    const pkg = { ...node.package };
    delete pkg.bundleDependencies;
    delete pkg.bundledDependencies;
    return packlist({ path: node.realpath, package: pkg, isProjectRoot: true, edgesOut: new Map() });
}

async function prepack() {
    // loadVirtual reads only the committed lockfile, so every node is a version already pinned and
    // installed; buildIdealTree would re-resolve ranges into versions that aren't on disk.
    const tree = await new Arborist({ path: repoRoot }).loadVirtual();
    const cliLink = tree.children.get(JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8")).name);

    const linkLocationByWorkspace = new Map();
    for (const node of tree.inventory.values()) {
        if (node.isLink && node.target != null && node !== cliLink) {
            linkLocationByWorkspace.set(node.target.location, node.location);
        }
    }

    // Shallowest first, so a package is always in place before anything nested inside it.
    const placements = [...prodClosureOf(cliLink.target)]
        .filter((node) => !node.isLink)
        .map((node) => ({ node, archiveLocation: archiveLocationOf(node.location, linkLocationByWorkspace) }))
        .sort((a, b) => a.archiveLocation.split("/").length - b.archiveLocation.split("/").length);

    const created = []; // repo-root-relative paths added here, to remove again in postpack
    const bundled = [];
    const skipped = [];

    for (const { node, archiveLocation } of placements) {
        // Missing means an optional dependency npm skipped on this platform, which a real install here
        // would leave out too - so it is left out of bundleDependencies as well.
        if (!fs.existsSync(node.realpath)) {
            skipped.push(`${node.name}@${node.version}`);
            continue;
        }
        if (!archiveLocation.includes("/node_modules/")) bundled.push(archiveLocation.slice("node_modules/".length));

        // Nested entries mostly exist already, via the package they sit inside.
        const targetPath = path.join(cliPkgDir, archiveLocation);
        if (fs.existsSync(targetPath)) continue;

        // Hard links share data without symlinks, which npm's tar step would name by on-disk path,
        // emitting entries that backtrack out of the package root. realpathSync: link(2) follows only on macOS.
        const files = linkLocationByWorkspace.has(node.location) ? await publishedFilesOf(node) : filesUnder(node.realpath);
        for (const file of files) {
            const targetFile = path.join(targetPath, file);
            fs.mkdirSync(path.dirname(targetFile), { recursive: true });
            fs.linkSync(fs.realpathSync(path.join(node.realpath, file)), targetFile);
        }
        created.push(path.relative(repoRoot, targetPath));
    }

    fs.mkdirSync(cliNodeModules, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(created, null, 2));
    if (skipped.length > 0) {
        console.log(`bundleCliDeps: skipped ${skipped.length} optional dependencies not installed here: ${skipped.join(", ")}`);
    }
    console.log(`bundleCliDeps: staged ${bundled.length} bundled dependencies (${created.length} added, rest already in place)`);

    // Pack time only: "true" would bundle just the declared deps, dropping the hoisted transitive ones,
    // and committing either form breaks "npm ci", which cannot hoist a workspace's bundled deps.
    updatePkgJson((pkgJson) => (pkgJson.bundleDependencies = bundled.sort()));
}

async function postpack() {
    for (const relativePath of JSON.parse(fs.readFileSync(stateFile, "utf-8"))) {
        fs.rmSync(path.resolve(repoRoot, relativePath), { recursive: true, force: true });
    }
    fs.rmSync(stateFile, { force: true });

    // Scope directories (e.g. node_modules/@zowe) are left behind by the removals above.
    for (const entry of fs.readdirSync(cliNodeModules)) {
        const entryPath = path.join(cliNodeModules, entry);
        if (entry.startsWith("@") && fs.readdirSync(entryPath).length === 0) fs.rmdirSync(entryPath);
    }
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
