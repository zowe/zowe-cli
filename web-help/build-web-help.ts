import * as fs from "fs";
import * as path from "path";
import { CommandResponse, WebHelpGenerator } from "@zowe/imperative";

(async () => {
    const outDir: string = __dirname + "/dist";
    if (fs.existsSync(outDir)) {
        require("rimraf").sync(outDir + "/*");
    } else {
        fs.mkdirSync(outDir);
    }

    let cliPackageDir: string = "../";
    let imperativeImportPath: string = "@zowe/imperative";
    let imperativeRequirePath: string = "../packages/imperative";
    if (process.argv.length > 2) {
        cliPackageDir = process.argv[2];
        imperativeImportPath = path.join(__dirname, cliPackageDir, "../imperative");
        imperativeRequirePath = path.join(__dirname, cliPackageDir, "lib/imperative");
    }

    // Get all command definitions
    const imperativeModule: any = await import(imperativeImportPath);
    const myConfig: any = imperativeModule.ImperativeConfig.instance;
    myConfig.loadedConfig = require(imperativeRequirePath);
    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];
    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    const oldFilename: string = process.mainModule.filename;
    process.mainModule.filename = path.join(__dirname, cliPackageDir, "package.json");
    // Initialize Imperative for commands to document
    await imperativeModule.Imperative.init(myConfig.loadedConfig);
    process.mainModule.filename = oldFilename;

    // Ensure required config values are defined
    if (myConfig.rootCommandName === undefined) {
        myConfig.rootCommandName = "zowe";
    }
    if (myConfig.loadedConfig.webHelpLogoImgPath === undefined) {
        myConfig.loadedConfig.webHelpLogoImgPath = __dirname + "/logo.png";
    }

    // Build command help pages
    const helpGenerator = new WebHelpGenerator(imperativeModule.Imperative.fullCommandTree, myConfig, outDir);
    helpGenerator.sanitizeHomeDir = true;
    helpGenerator.buildHelp(new CommandResponse({ silent: false }));
})();
