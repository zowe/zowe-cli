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
import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
const npmPacklist = require("npm-packlist");

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

interface NpmDepTree {
    version: string;
    name: string;
    resolved?: string;
    optional?: boolean;
    path: string;
    dependencies?: { [pkgName: string]: NpmDepTree };
    [key: string]: any;
}
interface BundleDepInfo {
    id: string;
    srcPath: string;
    link: boolean;
    native: boolean;
    optional: boolean;
}
interface QueueItem {
    tree: NpmDepTree;
    parentArchivePath: string;
}
function walkDepTree(root: NpmDepTree, pkgName: string): Record<string, BundleDepInfo> {
    // Do a breadth-first search of node_modules to hoist dependencies without conflicts
    const bundleDeps: Record<string, BundleDepInfo> = {};
    const visited = new Set<string>();
    let queue: QueueItem[] = Object.values(root.dependencies![pkgName].dependencies ?? {})
        .map((tree) => ({ tree, parentArchivePath: "node_modules" }));

    while (queue.length > 0) {
        const nextQueue: QueueItem[] = [];
        for (const { tree, parentArchivePath } of queue) {
            if (visited.has(tree.path)) continue;
            visited.add(tree.path);

            const pkgId = `${tree.name}@${tree.version}`;
            const flatPath = path.posix.join("node_modules", tree.name);
            const archivePath = flatPath in bundleDeps && bundleDeps[flatPath].id !== pkgId ?
                path.posix.join(parentArchivePath, "node_modules", tree.name) : flatPath;

            if (archivePath in bundleDeps) {
                if (bundleDeps[archivePath].id !== pkgId) {
                    throw new Error(`Found conflicting versions of the same package: ${bundleDeps[archivePath].id} and ${pkgId}`);
                }
            } else {
                bundleDeps[archivePath] = {
                    id: pkgId,
                    srcPath: tree.path,
                    link: tree.resolved != null,
                    native: tree.scripts?.install != null && fs.existsSync(path.join(tree.path, "binding.gyp")),
                    optional: tree.optional || false,
                };
            }

            for (const subtree of Object.values(tree.dependencies ?? {})) {
                if (subtree.name != null) nextQueue.push({ tree: subtree, parentArchivePath: archivePath });
            }
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
    const output = childProcess.execSync(`npm ls --all --json --long --omit=dev --package-lock-only -w ${pkg.name}`, {
        maxBuffer: 1024 * 1024 * 100, // 100MB
    });
    const prodDepMap = walkDepTree(JSON.parse(output.toString()), pkg.name);

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
            } else if (!bundleDep.native) {
                const absPkgPath = path.join(pkgDir, destPath);
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
