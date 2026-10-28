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
 3. Installing subpackage deps fails in CI when bundleDependencies is true
 4. Copying lockfile into subpackage dir may not resolve all deps correctly
*/

/* eslint-disable no-console */
import * as fs from "node:fs";
import * as path from "node:path";

const cmdName = process.argv[2];
const pkgDir = process.cwd();
process.chdir(path.join(__dirname, ".."));
const pkgNodeModules = path.join(pkgDir, "node_modules");
const nodeModulesBackup = path.join(pkgDir, "node_modules_old");
const pkgJsonPath = path.join(pkgDir, "package.json");

function die(message: string): never {
    console.error(message);
    process.exit(1);
}

function requireFromNpm(name: string) {
    // Use modules bundled with the running npm, so they always match the npm that is packing
    if (process.env.npm_execpath == null) die("Must be run through an npm lifecycle script (e.g. npm pack)");
    const npmDir = path.resolve(path.dirname(process.env.npm_execpath), "..");
    return require(path.join(npmDir, "node_modules", name));
}

function restoreNodeModules() {
    fs.rmSync(pkgNodeModules, { recursive: true, force: true });
    if (fs.existsSync(nodeModulesBackup)) {
        fs.renameSync(nodeModulesBackup, pkgNodeModules);
    }
}

function updatePkgJson(update: (_: Record<string, any>) => void) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    update(pkgJson);
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
}

interface BundleDepInfo {
    id: string;
    srcPath: string;
    link: boolean;
    optional: boolean;
}
interface QueueItem {
    node: Record<string, any>;  // Arborist Node or Link
    parentArchivePath: string;
}
function walkDepTree(root: Record<string, any>, pkgName: string): Record<string, BundleDepInfo> {
    // Do a breadth-first search of node_modules to hoist dependencies without conflicts
    const bundleDeps: Record<string, BundleDepInfo> = {};
    const visited = new Set<string>();
    const prodDeps = (node: Record<string, any>) => [...node.target.edgesOut.values()]
        .filter((edge: any) => !edge.dev && edge.to != null).map((edge: any) => edge.to);
    let queue: QueueItem[] = prodDeps(root.edgesOut.get(pkgName).to).map((node) => ({ node, parentArchivePath: "" }));

    // Find the archive path that `require(name)` would resolve to from the given package dir
    const resolveFrom = (fromDir: string, name: string): string | undefined => {
        for (let dir = path.posix.join(fromDir, "node_modules"); dir !== "."; dir = path.posix.dirname(dir)) {
            if (path.posix.basename(dir) !== "node_modules") continue;  // e.g. package or @scope dirs
            const candidate = path.posix.join(dir, name);
            if (candidate in bundleDeps) return candidate;
        }
        return undefined;
    };

    while (queue.length > 0) {
        const nextQueue: QueueItem[] = [];
        for (const { node, parentArchivePath } of queue) {
            // Reuse the copy this parent already resolves to if it's the right version; otherwise hoist to the
            // top level if free, or nest under the parent. Visited-ness is per archive location, not source path.
            const pkgId = `${node.name}@${node.version}`;
            const resolvedPath = resolveFrom(parentArchivePath, node.name);
            const archivePath = resolvedPath != null && bundleDeps[resolvedPath].id === pkgId ? resolvedPath :
                path.posix.join(resolvedPath == null ? "" : parentArchivePath, "node_modules", node.name);
            if (visited.has(archivePath)) continue;
            visited.add(archivePath);

            bundleDeps[archivePath] = {
                id: pkgId,
                srcPath: node.realpath,
                link: node.isLink,
                optional: node.target.optional,
            };
            nextQueue.push(...prodDeps(node).map((child) => ({ node: child, parentArchivePath: archivePath })));
        }
        queue = nextQueue;
    }

    return bundleDeps;
}

async function prepack(pkg: { name: string }) {
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    if (fs.existsSync(nodeModulesBackup)) {
        throw new Error(`[${cmdName}] "${nodeModulesBackup}" exists from a previous run and was not cleaned up`);
    }
    const start = Date.now();
    const Arborist = requireFromNpm("@npmcli/arborist");
    const npmPacklist = requireFromNpm("npm-packlist");
    const tree = await new Arborist({ path: process.cwd() }).loadVirtual();
    const prodDepMap = walkDepTree(tree, pkg.name);

    try {
        if (fs.existsSync(pkgNodeModules)) fs.renameSync(pkgNodeModules, nodeModulesBackup);
        fs.mkdirSync(pkgNodeModules);

        for (const [destPath, bundleDep] of Object.entries(prodDepMap)) {
            const srcPath = bundleDep.srcPath.replace(pkgNodeModules + path.sep, nodeModulesBackup + path.sep);
            if (bundleDep.link) {
                const packlist = await npmPacklist({
                    path: srcPath,
                    package: bundleDep.id.slice(0, bundleDep.id.lastIndexOf("@")),
                    edgesOut: new Map(),
                });
                for (const relFilePath of packlist) {
                    const absFilePath = path.join(pkgDir, destPath, relFilePath);
                    fs.mkdirSync(path.dirname(absFilePath), { recursive: true });
                    fs.copyFileSync(path.join(bundleDep.srcPath, relFilePath), absFilePath);
                }
            } else {
                const absPkgPath = path.join(pkgDir, destPath);
                // Include native package sources, but leave out binaries built for the packing host.
                const isNativeBuild = (source: string) => path.basename(source) === "build" &&
                    fs.existsSync(path.join(source, "..", "binding.gyp"));
                const npmIncludeFilter = (source: string) => path.basename(source) !== "node_modules" && !isNativeBuild(source);
                if (bundleDep.optional && !fs.existsSync(srcPath)) continue;
                fs.cpSync(srcPath, absPkgPath, { recursive: true, filter: npmIncludeFilter });
            }
        }

        console.log(`[prepack] staged ${Object.keys(prodDepMap).length} dependencies in ${(Date.now() - start) / 1000}s`);
        updatePkgJson((pkgJson) => {
            const depList = [...Object.keys(pkgJson.dependencies ?? {}), ...Object.keys(pkgJson.optionalDependencies ?? {})];
            pkgJson.bundleDependencies = depList.filter((name) => fs.existsSync(path.join(pkgNodeModules, name))).sort();
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

const run = { prepack, postpack }[cmdName];
if (run == null) {
    die(`Usage: cd <package> && node ${path.relative(pkgDir, __filename)} <prepack|postpack>`);
}
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
if (pkgJson.private) {
    die(`[${cmdName}] "${pkgJson.name}" is private, so cannot bundle dependencies`);
}
run(pkgJson).catch(die);
