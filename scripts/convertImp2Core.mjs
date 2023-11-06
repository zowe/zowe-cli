import * as fs from "fs";
import * as path from "path";

/*****************************************************************************
 * This script will find every TypeScript and JavaScript file contained
 * within the directory specified on the command line. It will change every
 * statement that imports "imperative" into an import of "core".
 *
 * You run this program with the following command:
 *     node convertImp2core.mjs
 */

// global variables that can be used in any function
let g_totalFileCnt = 0;
let g_modifiedFileCnt = 0
let g_manualChangeFileCnt = 0;
const g_cmdName = path.parse(process.argv[1]).name;

if (process.argv.length < 3) {
    const helpMsg = [
        `\nThe ${g_cmdName} command searches your TypeScript and JavaScript source code and`,
        `changes imports from the old imperative module to instead import from core-sdk.\n`,
        `We recommend that you have no uncommitted changes on your local source before`,
        `running this command. Further, if you first try the command on one subdirectory`,
        `as a test, you should un-commit your changes before running the command again.`,
        `Otherwise, the command may insert block comments a second time for the same problem.\n`,
        `Usage: ${g_cmdName} DirectoryToConvert {encoding}`,
        `Where:`,
        `    DirectoryToConvert: The path to the directory whose source files you want to`,
        `                        convert. All descendant subdirectories will be searched.\n`,
        `    encoding:           An optional JavaScript encoding string that is used when`,
        `                        reading and writing files. The default is 'utf8'.`
    ];
    for (const lineOfHelp of helpMsg) {
        console.log(lineOfHelp);
    }
    process.exit(1);
}

const dirToSearch = path.normalize(process.argv[2]);
if (fs.existsSync(dirToSearch)) {
    const stat = fs.statSync(dirToSearch);
    if (!stat.isDirectory()) {
        console.log(`The directory that you asked to search = '${dirToSearch}' is NOT a directory.`);
        process.exit(2);
    }
} else {
    console.log(`The directory that you asked to search = '${dirToSearch}' does not exist.`);
    process.exit(3);
}

let g_encoding = "utf8";
if (process.argv.length >= 4) {
    g_encoding = process.argv[3];
}
console.log(`All files are read and written with '${g_encoding}' encoding.`);
changeAllSrcFiles(dirToSearch);
const summaryMsg = [
    `\nTotal number of files processed = ${g_totalFileCnt}`,
    `Number of files with changed imports = ${g_modifiedFileCnt}`,
    `Number of files that require manual changes = ${g_manualChangeFileCnt}\n`,
    `In each file requiring a manual change, we inserted a comment and`,
    `forced a compile error to enable you to find the identified issues.`,
    `For TypeScript files, you can quickly find each such issue by simply`,
    `recompiling your TypeScript app. Otherwise, you can search your source`,
    `for the string '${ g_cmdName}'. `
];
for (const lineOfMsg of summaryMsg) {
    console.log(lineOfMsg);
}

/*****************************************************************************
 * Change all TypeScript and JavaScript source files
 */
function changeAllSrcFiles(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            // Recurse into a subdirectory, but skip node_modules and lib
            if (!file.includes("node_modules") && !file.includes("lib")) {
                changeAllSrcFiles(file);
            }
        } else {
            // we have a file, but only want TypeScript & JavaScript files
            const file_type = file.split(".").pop();
            file.split(/(\\|\/)/g).pop();
            if (file_type == "ts" || file_type == "js") {
                // replace imports of imperative with imports of core
                changeImpToCore(file);
            }
        }
    });
}

/*****************************************************************************
 * Change imports of imperative into imports of core.
 *
 * @param fileToChange - Name of the file in which to change imports.
 */
function changeImpToCore(fileToChange) {
    let weModified = false;
    g_totalFileCnt++;
    let linesOfFile;

    let fileContents = fs.readFileSync(fileToChange, {"encoding": g_encoding});
    if (fileContents && fileContents.includes("imperative")) {
        /* We must do multiple pattern matches. Split file into lines to
         * limit how much text each pattern will try to search.
         */
        linesOfFile = fileContents.split("\n");

        // Record whether we already import core in this file.
        let importsCore = false;
        let asCoreName = "";
        for (const currLine of linesOfFile) {
            if (currLine.match(/(?:from|require).*"@zowe\/core-sdk"/i)) {
                importsCore = true;
                const regexMatch = currLine.match(/as +["']([^"']+)["']/)
                if (regexMatch?.[1]) {
                    // This file also imports core "as something"
                    asCoreName = regexMatch[1];
                    break;
                }
            }
        }

        // find and react to each imperative import
        for (let lineInx = 0; lineInx < linesOfFile.length; lineInx++) {
            let commentsToInsert;
            const origLineInx = lineInx;
            const lineBeforeChange = linesOfFile[lineInx];

            // Does this line import a path name underneath @zowe/imperative?
            if (linesOfFile[lineInx].match(/(?:from|require).*"@zowe\/imperative\/[a-z0-9]+/i)) {
                commentsToInsert = [
                    `/* A change is required that ${g_cmdName} should *NOT* decide for you.`,
                    ` * The 'imperative' module is now part of 'core-sdk'.`,
                    ` * We automatically changed @zowe/imperative to @zowe/core-sdk for you.`,
                    ` * Below, you import using a path underneath @zowe/core-sdk. The NodeJS best practice`,
                    ` * is to only import from the scoped module name, like @zowe/core-sdk, which will only`,
                    ` * provide exported functions. If you import private functions, your app may be broken`,
                    ` * by future changes to those functions. Our movement of imperative into core does not`,
                    ` * change your ability to specify a path underneath core-sdk.`,
                    ` * We are forcing a compile error below, so that you do not overlook this consideration.`,
                    ` * After you decide which practices you choose to follow, you can remove this block comment,`,
                    ` * and remove the forced compile error below.`,
                    ` */`,
                    `ForceCompileError;`
                ];
                linesOfFile[lineInx] = linesOfFile[lineInx].replace(/@zowe\/imperative/i, "@zowe/core-sdk");
                lineInx = insertLinesIntoFile(fileToChange, linesOfFile, lineInx, commentsToInsert)

            // Does this line specify just an @zowe/imperative module import?
            } else if (linesOfFile[lineInx].match(/(?:from|require).*"@zowe\/imperative"/i)) {
                // Does the current line import imperative "as something"?
                const regexMatch = linesOfFile[lineInx].match(/as +["']([^"']+)["']/)
                if (regexMatch?.[1]) {
                    const asImperName = regexMatch[1];

                    const WARNING_ABOUT_AS = [
                        `/* A change is required that ${g_cmdName} should *NOT* decide for you.`,
                        ` * The 'imperative' module is now part of 'core-sdk'.`,
                        ` * We automatically changed @zowe/imperative to @zowe/core-sdk for you.`,
                        ` * However, you are importing 'as ${asImperName}'. Continuing to use references`,
                        ` * like '${asImperName}.XXX' could be confusing, but they will work ok.`,
                        ` * The recommended approach would be to change your import from 'as imperative'`,
                        ` * to 'as core' and change all occurrences of '${asImperName}.XXX' to 'core.XXX'.`,
                        ` * We are forcing a compile error below, so that you do not overlook this consideration.`,
                        ` * After you decide whether to change your references, you can remove this block comment,`,
                        ` * and remove the forced compile error below.`,
                        ` */`,
                        `ForceCompileError;`
                    ];

                    // Does this file also import core?
                    if (importsCore) {
                        // Does it import core 'as something'?
                        if (asCoreName.length > 0) {
                            commentsToInsert = [
                                `/* A change is required that ${g_cmdName} should *NOT* decide for you.`,
                                ` * The 'imperative' module is now part of 'core-sdk'.`,
                                ` * You are importing 'as ${asImperName}' below, and you already have an existing`,
                                ` * 'as ${asCoreName}' import. Your best approach would be to remove your existing`,
                                ` * 'as ${asImperName}' import, use a single 'as ${asCoreName}' import, and change`,
                                ` * all occurrences of '${asImperName}.XXX' to '${asCoreName}.XXX' throughout this file.`,
                                ` * We are forcing a compile error below, so that you do not overlook this consideration.`,
                                ` * After you decide whether to change your references, you can remove this block comment,`,
                                ` * and remove the forced compile error below.`,
                                ` */`,
                                `ForceCompileError;`
                            ];
                        } else {
                            /* The file import core, but NOT 'as something'.
                             * The current line DOES import imperative 'as something'.
                             * We cannot reliably change all references to something.XXX.
                             */
                            commentsToInsert = WARNING_ABOUT_AS;
                            linesOfFile[lineInx] = linesOfFile[lineInx].replace(/@zowe\/imperative/i, "@zowe/core-sdk");
                        }
                    } else {
                        /* The file does not import core at all, but the
                         * current line DOES import imperative 'as something'.
                         * We cannot reliably change all references to something.XXX.
                         */
                        commentsToInsert = WARNING_ABOUT_AS;
                        linesOfFile[lineInx] = linesOfFile[lineInx].replace(/@zowe\/imperative/i, "@zowe/core-sdk");
                    }

                    // insert the comment for the imperative 'as' clause that we detected
                    lineInx = insertLinesIntoFile(fileToChange, linesOfFile, lineInx, commentsToInsert)
                } else {
                    /* The current line did NOT use an 'as' clause when importing imperative.
                     * We know how to change just a scoped reference.
                     */
                    linesOfFile[lineInx] = linesOfFile[lineInx].replace(/@zowe\/imperative/i, "@zowe/core-sdk");
                }

            // Does the current line import imperative as a namespace from @zowe/cli?
            } else if (linesOfFile[lineInx].match(/imperative.*from +"@zowe\/cli"/i)) {
                commentsToInsert = [
                    `/* A change is required that ${g_cmdName} should *NOT* decide for you.`,
                    ` * The 'imperative' module is now part of 'core-sdk'.`,
                    ` * You are importing 'imperative' as a namespace from @zowe/cli. The 'imperative'`,
                    ` * namespace no longer exists in @zowe/cli. Your most intuitive approach will be`,
                    ` * to replace your import with a line like this:`,
                    ` *     import { core } from "@zowe/cli";`,
                    ` * and replace all references to 'imperative.XXX' with 'core.XXX'.`,
                    ` * A less intuitive approach would be to replace the import with a line like this:`,
                    ` *     import { core as imperative } from "@zowe/cli";`,
                    ` * Your references to 'imperative.XXX' will not have to change. Those expressions`,
                    ` * may be confusing, but they will work ok.`,
                    ` * We are forcing a compile error below, so that you do not overlook this consideration.`,
                    ` * After you decide how to replace this import, you can remove this block comment,`,
                    ` * and remove the forced compile error below.`,
                    ` */`,
                    `ForceCompileError;`
                ];
                lineInx = insertLinesIntoFile(fileToChange, linesOfFile, lineInx, commentsToInsert);

            /* Does the current line import imperative through a file path,
             * (like a test that imports ../../imperative/something).
             */
            } else if (linesOfFile[lineInx].match(/(?:from|require).*\/imperative/)) {
                /* We expect that this will only occur in CLI source.
                 * We cannot replace every "/imperative" reference, since even after we move
                 * imperative into the core package, we still have a source subdirectory
                 * named "imperative". Thus, we only replace imperative in certain contexts.
                 */
                linesOfFile[lineInx] = linesOfFile[lineInx].replace(/packages\/imperative/i, "packages/core");
                linesOfFile[lineInx] = linesOfFile[lineInx].replace(/imperative\/src\/imperative/i, "core/src/imperative");
            }

            if (lineInx !== origLineInx || lineBeforeChange !== linesOfFile[lineInx]) {
                weModified = true;
            }
        } // end for each line
    } // end file contains "/imperative"

    if (weModified) {
        g_modifiedFileCnt++;
        fileContents = linesOfFile.join("\n");
        fs.writeFileSync(fileToChange, fileContents, { "encoding": g_encoding });
    }

    // display our progress only after a set number of files
    const fileProgressCount = 100;
    if (!(g_totalFileCnt % fileProgressCount)) {
        if (g_totalFileCnt === fileProgressCount){
            console.log("");
        }
        console.log(`Files processed so far = ${g_totalFileCnt}`);
    }
} // end changeImpToCore

/*****************************************************************************
 * Insert lines into a file at a specified location.
 * Used to document that manual changes are required by the consumer.
 *
 * @param fileName - The name of the file into which to insert lines.
 * @param linesOfFile - An array of strings representing all lines of a file.
 * @param insertBeforeIndex - The index into linesOfFile before which
 *                            we will insert linesToInsert.
 * @param linesToInsert - An array of strings to insert into linesOfFile.
 *
 * @returns The new index value for the line originally indexed by insertBeforeIndex
 */
function insertLinesIntoFile(fileName, linesOfFile, insertBeforeIndex, linesToInsert) {
    linesOfFile.splice(insertBeforeIndex, 0, ...linesToInsert);
    g_manualChangeFileCnt++;

    // We increased the number of lines in the file, and we must skip over what we added.
    const newLineIndex = insertBeforeIndex + linesToInsert.length;
    console.log(`\n${fileName}`);
    console.log(`    A conflict that you must manually correct has been identified on line ${newLineIndex + 1}:`);
    console.log(`    ${linesOfFile[newLineIndex]}`);
    return newLineIndex;
}
