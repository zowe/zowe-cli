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

import { IGulpError, ITaskFunction } from "./GulpHelpers";
import { Constants } from "../packages/cli/src/Constants";
import { SpawnSyncReturns } from "child_process";
import * as util from "util";
import { DefaultHelpGenerator, Imperative, ImperativeConfig } from "../packages/imperative/src";

// "npx" command allows us to issue CLIs from node_modules dependencies
// without globally installing.
const npx = "npx" + (require("os").platform() === "win32" ? ".cmd" : ""); // platform dependent extension for npx command

const gulp = require('gulp');
const ansiColors = require("ansi-colors");
const childProcess = require("child_process");
const fancylog = require("fancy-log");
const rimraf = require("rimraf").sync;
const fs = require("fs");
const compileDir = "lib";
const mustache = require("mustache");
const clearRequire = require("clear-require");

const lint: ITaskFunction = (done) => {
    let lintProcess: SpawnSyncReturns<string>;
    try {
        lintProcess = childProcess.spawnSync("npm", ["run", "lint"], {stdio: "inherit", shell: true});

    } catch (e) {
        fancylog(ansiColors.red("Error encountered trying to run eslint"));
        done(e);
        return;
    }
    try {
        if (lintProcess.status !== 0) {
            const lintWarning: IGulpError =
                new Error(ansiColors.yellow("Linting failed. Please correct the issues above."));
            lintWarning.showStack = false;
            done(lintWarning);
        } else {
            fancylog(ansiColors.blue("No style problems"));
            done();
        }
    }
    catch (e) {
        fancylog(ansiColors.red("Error encountered trying to check CLI definitions for consistency"));
        done(e);
        return;
    }
};
lint.description = "Runs eslint on the project to check for style, " +
    "and checks command and option definitions for consistency (requires built source)";

const license: ITaskFunction = (done: (err: Error) => void) => {
    // process all typescript files
    require("glob")(
      "{__mocks__,packages,gulp,__tests__,jenkins}{/**/*.js,/**/*.ts}",
      {"ignore":['**/node_modules/**','**/lib/**']},
      (globErr: any, filePaths: string[]) => {
        if (globErr) {
            done(globErr);
            return;
        }
        // turn the license file into a multi line comment
        const desiredLineLength = 80;
        let alreadyContainedCopyright = 0;
        const header = "/*\n" + fs.readFileSync("LICENSE_HEADER").toString()
                .split(/\r?\n/g).map((line: string) => {
                    return ("* " + line).trim();
                })
                .join(require("os").EOL) + require("os").EOL + "*/" +
            require("os").EOL + require("os").EOL;
        try {
            for (const filePath of filePaths) {
                const file = fs.readFileSync(filePath);
                let result = file.toString();
                const resultLines = result.split(/\r?\n/g);
                if (resultLines.join().indexOf(header.split(/\r?\n/g).join()) >= 0) {
                    alreadyContainedCopyright++;
                    continue; // already has copyright
                }
                const shebangPattern = require("shebang-regex");
                let usedShebang = "";
                result = result.replace(shebangPattern, (fullMatch: string) => {
                    usedShebang = fullMatch + "\n"; // save the shebang that was used, if any
                    return "";
                });
                // remove any existing copyright
                // Be very, very careful messing with this regex. Regex is wonderful.
                result = result.replace(/\/\*[\s\S]*?(License|SPDX)[\s\S]*?\*\/[\s\n]*/i, "");
                result = header + result; // add the new header
                result = usedShebang + result; // add the shebang back
                fs.writeFileSync(filePath, result);
            }
            fancylog(ansiColors.blue("Ensured that %d files had copyright information" +
                " (%d already did)."), filePaths.length, alreadyContainedCopyright);
        } catch (e) {
            done(e);
        }
        done(undefined);
    });
};
license.description = "Updates the license header in all TypeScript files";

const doc: ITaskFunction = async () => {
    process.env.FORCE_COLOR = "0";

    // Get all command definitions
    const myConfig = ImperativeConfig.instance;
    // myConfig.callerLocation = __dirname;
    myConfig.loadedConfig = require("../packages/cli/src/imperative");

    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];

    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    process.mainModule.filename = __dirname + "/../package.json";

    await Imperative.init(myConfig.loadedConfig);
    const loadedDefinitions = Imperative.fullCommandTree;

    clearRequire.all(); // in case the code has changed, reload any code

    let totalCommands = 0;
    let markdownContent = "# " + Constants.DISPLAY_NAME + " Help\n\n";
    markdownContent += "\n" + loadedDefinitions.description + "\n\n";

    markdownContent += "{{tableOfContents}}\n\n";
    let tableOfContentsText = "### Table of Contents\n";

    const tabIndent = "\t";
    let oldCommandName = "";

    function getGroupHelp(definition: any, indentLevel: number = 0) {
        let commandNameSummary = definition.name;
        if (definition.aliases.length > 0 &&
            !(definition.aliases[0].trim().length === 0 && definition.aliases.length === 1)) {
            commandNameSummary += " | " + definition.aliases.join(" | ");
        }
        if (definition.experimental) {
            commandNameSummary += " (experimental)";
        }

        // create anchor tag that matches full command
        let anchorTag = "";
        if (oldCommandName !== "") {
            anchorTag = `${oldCommandName}-${definition.name}`;
        } else {
            anchorTag = definition.name;
        }
        tableOfContentsText += util.format("%s* [%s](#%s)\n", tabIndent.repeat(indentLevel), commandNameSummary, anchorTag.trim());

        markdownContent += util.format("#%s %s<a name=\"%s\"></a>\n", "#".repeat(indentLevel), commandNameSummary, anchorTag.trim());
        markdownContent += definition.description ? definition.description.trim() + "\n" : "";

        for (const child of definition.children) {
            if (child.type !== "command") {
                oldCommandName = " " + definition.name;
                getGroupHelp(child, indentLevel + 1);
                continue;
            }
            totalCommands++;

            // create anchor tag that matches full command
            let childAnchorTag = "";
            if (oldCommandName !== "") {
                childAnchorTag = `${oldCommandName}-${definition.name}-${child.name.replace(/\s/g, "-")}`;
            } else {
                childAnchorTag = `${definition.name}-${child.name.replace(/\s/g, "-")}`;
            }

            let childNameSummary = child.name;
            if (child.experimental) {
                childNameSummary += " (experimental)";
            }

            tableOfContentsText += util.format("%s* [%s](#%s)\n", tabIndent.repeat(indentLevel + 1), childNameSummary, childAnchorTag.trim());
            markdownContent += util.format("##%s %s<a name=\"%s\"></a>\n", "#".repeat(indentLevel), childNameSummary, childAnchorTag.trim());

            const helpGen = new DefaultHelpGenerator({
                produceMarkdown: true,
                rootCommandName: Constants.BINARY_NAME + oldCommandName
            } as any, {
                commandDefinition: child,
                fullCommandTree: definition
            });
            markdownContent += helpGen.buildHelp();
        }
        oldCommandName = "";
    }

    // --------------------------------------------------------
    // Remove duplicates from Imperative.fullCommandTree
    const allDefSoFar: string[] = [];
    const definitionsArray = loadedDefinitions.children.sort((a, b) => a.name.localeCompare(b.name)).filter((cmdDef) => {
        if (allDefSoFar.indexOf(cmdDef.name) === -1) {
            allDefSoFar.push(cmdDef.name);
            return true;
        }
        return false;
    });
    // --------------------------------------------------------

    for (const def of definitionsArray) {
        getGroupHelp(def);
    }

    markdownContent = mustache.render(markdownContent, {tableOfContents: tableOfContentsText});
    fs.writeFileSync("docs/CLIReadme.md", markdownContent);
    fancylog(ansiColors.blue("Updated docs/CLIReadme.md with definitions of " + totalCommands + " commands"));

    process.env.FORCE_COLOR = undefined;
};
doc.description = "Create documentation from the CLI help";

const tscExecutable = "node_modules/typescript/bin/tsc";
const buildImperative: ITaskFunction = (done) => {
    license((licenseErr?: Error) => {
        if (licenseErr) {
            fancylog(ansiColors.red("Error encountered while adding copyright information"));
            done(licenseErr);
        }
        if (fs.existsSync("tsconfig.tsbuildinfo")) {
            fs.unlinkSync("tsconfig.tsbuildinfo");
        }
        if (fs.existsSync(compileDir)) {
            rimraf(compileDir);
            fancylog("Deleted old compiled source in '%s' folder", compileDir);
        }
        const compileProcess = childProcess.spawnSync("node", [tscExecutable]);
        const typescriptOutput = compileProcess.output.join("");
        if (typescriptOutput.trim().length > 0) {
            fancylog("Typescript output:\n%s", typescriptOutput);
        }
        if (compileProcess.status !== 0) {
            const buildFailedError: IGulpError = new Error(ansiColors.red("Build failed"));
            buildFailedError.showStack = false;
            done(buildFailedError);
        }
        else {
            fancylog(ansiColors.blue("Compiled typescript successfully"));

            lint((lintWarning: Error) => {
                if (lintWarning) {
                    done(lintWarning);
                    return;
                }
                fancylog(ansiColors.blue("Build succeeded"));
                done();
            });
        }
    });
};
buildImperative.description = "Build the project and generate documentation";

const watchImperative: ITaskFunction = (done) => {
    gulp.watch("packages/**", gulp.series("lint"));
    const watchProcess = childProcess.spawn("node", [tscExecutable, "--watch"], {stdio: "inherit"});
    watchProcess.on("error", (error: Error) => {
        fancylog(error);
        throw error;
    });
    watchProcess.on("close", () => {
        fancylog("watch process closed");
        done();
    });
};
watchImperative.description = "Continuously build the project as you edit the source. To get full linting results and " +
    "generate documentation, use the 'build' task before attempting to merge with the master branch";


const buildAllClis: ITaskFunction = async () => {
    const cliDirs: string[] = getDirectories(__dirname + "/../__tests__/__integration__/");
    cliDirs.forEach((dir) => {
        // Build them all
        fancylog(`Build "${dir}" cli...`);
        const buildResponse = childProcess.spawnSync((process.platform === "win32") ? "npm.cmd" : "npm", ["run", "build"],
            {cwd: __dirname + `/../__tests__/__integration__/${dir}/`});
        if (buildResponse.stdout && buildResponse.stdout.toString().length > 0) {
            fancylog(`***BUILD "${dir}" stdout:\n${buildResponse.stdout.toString()}`);
        }
        if (buildResponse.stderr && buildResponse.stderr.toString().length > 0) {
            fancylog(`***BUILD "${dir}" stderr:\n${buildResponse.stderr.toString()}`);
        }
        if (buildResponse.status !== 0) {
            throw new Error(`Build failed for "${dir}" test CLI. Status code: "${buildResponse.status}". ` +
                `Please review the stdout/stderr for more details.`);
        }
        fancylog(`Build for "${dir}" cli completed successfully.`);
    });
};

function getDirectories(path: string) {
    return fs.readdirSync(path).filter((file: string) => {
        return fs.statSync(path + "/" + file).isDirectory();
    });
}

const installAllCliDependencies: ITaskFunction = async () => {
    const cliDirs: string[] = getDirectories(__dirname + "/../__tests__/__integration__/");
    cliDirs.forEach((dir) => {
        // Perform an NPM install
        fancylog(`Executing "npm install" for "${dir}" cli to obtain dependencies...`);
        const installResponse = childProcess.spawnSync((process.platform === "win32") ? "npm.cmd" : "npm", ["install"],
            {cwd: __dirname + `/../__tests__/__integration__/${dir}/`});
        if (installResponse.stdout && installResponse.stdout.toString().length > 0) {
            fancylog(`***INSTALL "${dir}" stdout:\n${installResponse.stdout.toString()}`);
        }
        if (installResponse.stderr && installResponse.stderr.toString().length > 0) {
            fancylog(`***INSTALL "${dir}" stderr:\n${installResponse.stderr.toString()}`);
        }
        if (installResponse.status !== 0) {
            throw new Error(`Install dependencies failed for "${dir}" test CLI. Status code: "${installResponse.status}". ` +
                `Please review the stdout/stderr for more details.`);
        }
        fancylog(`Install for "${dir}" cli dependencies complete.`);
    });
};

exports.buildImperative = buildImperative;
exports.watchImperative = watchImperative;
exports.buildAllClis = buildAllClis;
exports.installAllCliDependencies = installAllCliDependencies;
exports.doc = doc;
exports.lint = lint;
exports.license = license;
