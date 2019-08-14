import * as fs from "fs";
import * as path from "path";
import { CommandResponse, WebHelpGenerator } from "../node_modules/@zowe/imperative";

interface IConfig {
    cliPackage: null | string;
    excludeGroups: string[];
}

(async () => {
    const config: IConfig = require("js-yaml").safeLoad(
        fs.readFileSync(path.join(__dirname, "config.yaml"), "utf8"));
    console.log("Loaded configuration from config.yaml");

    const outDir: string = path.join(__dirname, "dist");
    if (fs.existsSync(outDir)) {
        require("rimraf").sync(outDir + "/*");
    } else {
        fs.mkdirSync(outDir);
    }

    let cliPackageDir: string = path.join(__dirname, "..");
    let imperativeImportPath: string = "../node_modules/@zowe/imperative";
    let imperativeRequirePath: string = "../packages/imperative";

    if (config.cliPackage) {
        cliPackageDir = path.join(__dirname, "node_modules", config.cliPackage);
        imperativeImportPath = path.join(cliPackageDir, "../imperative");
        imperativeRequirePath = path.join(cliPackageDir, "lib/imperative");
    }

    // Get all command definitions
    const imperativeModule: any = await import(imperativeImportPath);
    const myConfig: any = imperativeModule.ImperativeConfig.instance;
    myConfig.loadedConfig = require(imperativeRequirePath);
    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];
    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    const oldFilename: string = process.mainModule.filename;
    process.mainModule.filename = path.join(cliPackageDir, "package.json");
    // Initialize Imperative for commands to document
    await imperativeModule.Imperative.init(myConfig.loadedConfig);
    process.mainModule.filename = oldFilename;
    console.log(`Initialized Imperative for ${myConfig.callerPackageJson.name} ${myConfig.callerPackageJson.version}`);

    // Ensure required config values are defined
    if (myConfig.rootCommandName === undefined) {
        myConfig.rootCommandName = "zowe";
    }
    if (myConfig.loadedConfig.webHelpLogoImgPath === undefined) {
        myConfig.loadedConfig.webHelpLogoImgPath = __dirname + "/logo.png";
    }

    // Exclude undesired command groups
    const cmdDefinitions: any = imperativeModule.Imperative.fullCommandTree;
    cmdDefinitions.children = cmdDefinitions.children
        .filter((group: any) => (config.excludeGroups || []).indexOf(group.name) === -1);

    // Build command help pages
    const helpGenerator = new WebHelpGenerator(cmdDefinitions, myConfig, outDir);
    helpGenerator.sanitizeHomeDir = true;
    helpGenerator.buildHelp(new CommandResponse({ silent: false }));

    console.log("Output located in", outDir);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
