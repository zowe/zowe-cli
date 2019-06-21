import * as fs from "fs";
import * as path from "path";
import { Imperative, ImperativeConfig, WebHelpGenerator } from "@zowe/imperative";

const ncp = require("ncp");

(async () => {
    let outDir: string = "./dist";
    if (fs.existsSync(outDir)) {
        require("rimraf").sync(path.join(outDir, "*"));
    } else {
        fs.mkdirSync(outDir);
    }

    // Get all command definitions
    const myConfig: ImperativeConfig = ImperativeConfig.instance;
    myConfig.loadedConfig = require("../packages/imperative");
    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];
    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    process.mainModule.filename = path.join(__dirname, "..", "package.json");
    // Initialize Imperative for commands to document
    await Imperative.init(myConfig.loadedConfig);
    // Build command help pages
    const helpGenerator = new WebHelpGenerator(myConfig, outDir);
    helpGenerator.sanitizeHomeDir = true;
    helpGenerator.singleDirOutput = true;
    helpGenerator.buildHelp();

    let sourceDir: string = "../node_modules/@zowe/imperative/help-site/dist";
    ncp(path.join(sourceDir, "css"), path.join(outDir, "css"));
    ncp(path.join(sourceDir, "js"), path.join(outDir, "js"));

    sourceDir = "../node_modules/@zowe/imperative/node_modules";
    const nodeModules: string[] = [
        "balloon-css",
        "bootstrap",
        "clipboard",
        "delegate",
        "github-markdown-css",
        "jquery",
        "jstree",
        "popper.js",
        "select",
        "split.js",
        "tiny-emitter"
    ];
    outDir = path.join(outDir, "node_modules");
    fs.mkdirSync(outDir);
    for (const nodeModule of nodeModules) {
        ncp(path.join(sourceDir, nodeModule), path.join(outDir, nodeModule));
    }
})();
