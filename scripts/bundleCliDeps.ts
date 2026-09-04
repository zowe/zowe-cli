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
    path: string;
    dependencies?: { [pkgName: string]: NpmDepTree };
    [key: string]: any;
}
interface BundleDepInfo {
    id: string;
    srcPath: string;
    link: boolean;
    hasInstallScript: boolean;
}
function walkDepTree(root: NpmDepTree, pkgName: string): Record<string, BundleDepInfo> {
    const bundleDeps: Record<string, BundleDepInfo> = {};
    const normalizePath = (path: string) => path.replace(/\\/g, "/");
    const visitDep = (tree: NpmDepTree) => {
        const pkgId = `${tree.name}@${tree.version}`;
        let archivePath = `node_modules/${tree.name}`;
        let isDupe = false;

        if (archivePath in bundleDeps) {
            const isRootLevel = normalizePath(path.relative(process.cwd(), tree.path)) === archivePath;
            const isSameLevel = !isRootLevel && normalizePath(path.relative(pkgDir, tree.path)) === archivePath;
            if (pkgId === bundleDeps[archivePath].id) {
                isDupe = true;
            } else if (isRootLevel || isSameLevel) {
                throw new Error(`Found conflicting versions of the same package: ${bundleDeps[archivePath].id} and ${pkgId}`);
            } else {
                archivePath = normalizePath(path.relative(process.cwd(), tree.path));
            }
        }

        if (!isDupe) {
            bundleDeps[archivePath] = {
                id: pkgId,
                srcPath: tree.path,
                link: tree.resolved != null,
                hasInstallScript: tree.scripts?.install != null
            };
        }
        for (const subtree of Object.values(tree.dependencies ?? {})) {
            if (subtree.name != null) visitDep(subtree);
        }
    };
    Object.values(root.dependencies![pkgName].dependencies ?? {}).forEach(visitDep);
    return bundleDeps;
}

async function prepack(pkgName: string) {
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    if (fs.existsSync(nodeModulesBackup)) {
        throw new Error(`[${cmdName}] "${nodeModulesBackup}" exists from a previous run and was not cleaned up`);
    }
    const start = Date.now();
    const output = childProcess.execSync(`npm ls --all --omit=dev --json --long -w ${pkgName}`, {
        maxBuffer: 1024 * 1024 * 100, // 100MB
    });
    const prodDepMap = walkDepTree(JSON.parse(output.toString()), pkgName);

    try {
        if (fs.existsSync(pkgNodeModules)) fs.renameSync(pkgNodeModules, nodeModulesBackup);
        fs.mkdirSync(pkgNodeModules);

        for (const [destPath, bundleDep] of Object.entries(prodDepMap)) {
            if (bundleDep.link) {
                const packlist = await npmPacklist({
                    path: bundleDep.srcPath,
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
                const excludeNodeModules = (source: string) => path.basename(source) !== "node_modules" &&
                    (!bundleDep.hasInstallScript || path.basename(source) !== "build");
                fs.cpSync(bundleDep.srcPath, absPkgPath, { recursive: true, filter: excludeNodeModules });
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
const { name: pkgName, private: isPrivate } = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
if (isPrivate) {
    die(`[${cmdName}] "${pkgName}" is private, so cannot bundle dependencies`);
}
run(pkgName).catch(die);
