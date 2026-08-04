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
const os = require("os");
const path = require("path");
const tar = require("tar");

// Captured before the chdir below - fixBundledTarball needs it to locate the tarball npm produced.
const packageCwd = process.cwd();

// Workaround for https://github.com/npm/cli/issues/3466
process.chdir(__dirname + "/..");
const cliPkgDir = path.join(process.cwd(), "packages", "cli");
const pkgJsonFile = path.join(cliPkgDir, "package.json");
const symlinksFile = path.join(cliPkgDir, ".bundle-symlinks.json");

const command = process.argv[2];
if (command === "prepack") {
    prepack();
} else if (command === "postpack") {
    // Must finish before postpack removes the symlinks it reads; errors here should fail the build,
    // not ship a broken tarball silently.
    fixBundledTarball()
        .then(postpack)
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
} else {
    console.error(`Usage: node ${path.basename(__filename)} <prepack|postpack>`);
    process.exit(1);
}

// "npm ls --long" merges devDependencies into local workspace packages' trees; filter using each
// package's own package.json so dev/test tooling doesn't get bundled.
function prodDependenciesOf(node, realDir) {
    if (!node.resolved?.startsWith("file:")) return node.dependencies ?? {};
    const localPkgJson = JSON.parse(fs.readFileSync(path.join(realDir, "package.json"), "utf-8"));
    const prodNames = new Set([...Object.keys(localPkgJson.dependencies ?? {}), ...Object.keys(localPkgJson.optionalDependencies ?? {})]);
    return Object.fromEntries(Object.entries(node.dependencies ?? {}).filter(([depName]) => prodNames.has(depName)));
}

// Recursively symlinks `name` into `targetParentDir/name`. node.path is undefined for an unresolved
// optional/peer dependency - nothing to link. A name can recur at different versions, each nested.
function symlinkDependency(name, node, targetParentDir, symlinks, topLevelDir) {
    if (!node.path) return;

    // @zowe packages are direct deps of packages/cli, so one top-level copy is enough - Node resolves
    // it from any depth by walking up, and most SDKs depend on each other.
    if (name.startsWith("@zowe/") && targetParentDir !== topLevelDir) return;

    const realDir = fs.realpathSync(node.path);
    const targetPath = path.join(targetParentDir, ...name.split("/"));
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.symlinkSync(path.relative(path.dirname(targetPath), realDir), targetPath);
        symlinks[targetPath] = realDir;
    }

    for (const [depName, depNode] of Object.entries(prodDependenciesOf(node, realDir))) {
        symlinkDependency(depName, depNode, path.join(realDir, "node_modules"), symlinks, topLevelDir);
    }
}

function prepack() {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));
    // --omit=dev drops packages/cli's own devDependencies; prodDependenciesOf handles the same for
    // nested workspace packages. --long adds the "path" field this script relies on throughout.
    const tree = JSON.parse(
        childProcess.execSync("npm ls --all --omit=dev --long --json", { cwd: cliPkgDir, maxBuffer: 1024 * 1024 * 40 }).toString()
    );
    const cliNode = tree.dependencies[pkgJson.name];

    const symlinks = {}; // targetPath -> realDir
    const cliNodeModules = path.join(cliPkgDir, "node_modules");
    for (const [name, node] of Object.entries(cliNode.dependencies)) {
        symlinkDependency(name, node, cliNodeModules, symlinks, cliNodeModules);
    }
    // Paths are stored relative to the repo root so the file doesn't embed a machine-specific path.
    const relative = Object.fromEntries(
        Object.entries(symlinks).map(([targetPath, realDir]) => [
            path.relative(process.cwd(), targetPath),
            path.relative(process.cwd(), realDir),
        ])
    );
    fs.writeFileSync(symlinksFile, JSON.stringify(relative, null, 2));

    // Set at pack time only - npm skips installing a workspace's bundled deps that cannot hoist to the
    // repo root, so committing this to package.json would break "npm ci".
    pkgJson.bundleDependencies = true;
    writePkgJson(pkgJson);
}

function postpack() {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));
    delete pkgJson.bundleDependencies;
    writePkgJson(pkgJson);

    for (const targetPath of Object.keys(JSON.parse(fs.readFileSync(symlinksFile, "utf-8")))) {
        fs.unlinkSync(path.resolve(process.cwd(), targetPath));
    }
    fs.unlinkSync(symlinksFile);
}

// Matches how npm formats package.json, so adding and removing the key above leaves the file unchanged.
function writePkgJson(pkgJson) {
    fs.writeFileSync(pkgJsonFile, JSON.stringify(pkgJson, null, 2) + "\n");
}

// Resolves each symlink's archive path from realDir alone (see remap() for why this is needed): an
// entry nested under another's realDir inherits that entry's archive path, recursively.
function computeArchivePaths(symlinks) {
    const resolved = new Map(); // targetPath -> archivePath
    const cliNodeModules = path.join(cliPkgDir, "node_modules");

    function resolveArchivePath(entry) {
        if (resolved.has(entry.targetPath)) return resolved.get(entry.targetPath);
        let archivePath;
        if (entry.targetPath === cliNodeModules || entry.targetPath.startsWith(cliNodeModules + path.sep)) {
            archivePath = path.relative(cliPkgDir, entry.targetPath);
        } else {
            // Longest matching realDir wins, so a nested override's own entry is preferred over a
            // coarser ancestor further up the same chain.
            let ancestor = null;
            for (const other of symlinks) {
                if (other === entry) continue;
                if (entry.targetPath === other.realDir || entry.targetPath.startsWith(other.realDir + path.sep)) {
                    if (!ancestor || other.realDir.length > ancestor.realDir.length) ancestor = other;
                }
            }
            if (!ancestor) {
                throw new Error(`bundleCliDeps: no ancestor found to place "${entry.targetPath}" in the archive`);
            }
            archivePath = path.join(resolveArchivePath(ancestor), path.relative(ancestor.realDir, entry.targetPath));
        }
        resolved.set(entry.targetPath, archivePath);
        return archivePath;
    }

    const mappings = symlinks.map((entry) => ({ archivePath: resolveArchivePath(entry), realDir: entry.realDir }));
    return mappings.sort((a, b) => b.realDir.length - a.realDir.length); // longest realDir matches first
}

// npm's tar step names content nested inside a symlinked, overridden dependency by real disk location
// instead of archive path, producing broken entries like "package/../imperative/node_modules/which/...".
function remap(entryPath, mappings) {
    const rel = entryPath.replace(/^package\//, "");
    if (!rel.includes("..")) return entryPath;

    const absolute = path.resolve(cliPkgDir, rel);
    for (const { archivePath, realDir } of mappings) {
        if (absolute === realDir || absolute.startsWith(realDir + path.sep)) {
            return path.join("package", archivePath, path.relative(realDir, absolute));
        }
    }
    throw new Error(`bundleCliDeps: no mapping found for backtracked tarball entry "${entryPath}" (resolved to ${absolute})`);
}

// npm doesn't pass the tarball's path to lifecycle scripts directly. --pack-destination shows up as
// an env var; otherwise npm writes it to the cwd the script started in (captured above as packageCwd).
function findTarball() {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));
    const fileName = `${pkgJson.name.replace(/^@/, "").replace("/", "-")}-${pkgJson.version}.tgz`;
    const tarballPath = path.join(process.env.npm_config_pack_destination || packageCwd, fileName);
    return fs.existsSync(tarballPath) ? tarballPath : null;
}

async function fixBundledTarball() {
    const tarballPath = findTarball();
    if (!tarballPath) {
        console.log("bundleCliDeps: no tarball found to check for backtracked paths, skipping");
        return;
    }

    const symlinks = Object.entries(JSON.parse(fs.readFileSync(symlinksFile, "utf-8"))).map(([targetPath, realDir]) => ({
        targetPath: path.resolve(process.cwd(), targetPath),
        realDir: path.resolve(process.cwd(), realDir),
    }));
    const mappings = computeArchivePaths(symlinks);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-cli-deps-"));
    try {
        let fixed = 0;
        let total = 0;
        await tar.t({
            file: tarballPath,
            onReadEntry: (entry) => {
                total++;
                const correctedPath = remap(entry.path, mappings);
                if (correctedPath !== entry.path) fixed++;
                const dest = path.join(tempDir, correctedPath.replace(/^package\//, ""));

                if (entry.type === "Directory") {
                    fs.mkdirSync(dest, { recursive: true });
                } else if (entry.type === "SymbolicLink") {
                    fs.mkdirSync(path.dirname(dest), { recursive: true });
                    fs.symlinkSync(entry.linkpath, dest);
                } else if (entry.type === "File") {
                    fs.mkdirSync(path.dirname(dest), { recursive: true });
                    entry.pipe(fs.createWriteStream(dest, { mode: entry.mode }));
                } else {
                    console.log(`bundleCliDeps: skipping unsupported tarball entry type ${entry.type} at ${entry.path}`);
                    entry.resume();
                }
            },
        });

        if (fixed === 0) {
            console.log("bundleCliDeps: no backtracked paths found in tarball, nothing to fix");
            return;
        }

        fs.rmSync(tarballPath, { force: true });
        await tar.c({ file: tarballPath, gzip: true, cwd: tempDir, prefix: "package", portable: true }, ["."]);
        console.log(`bundleCliDeps: repaired ${fixed} of ${total} tarball entries with backtracked paths`);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
