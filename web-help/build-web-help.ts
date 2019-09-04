import * as fs from "fs";
import * as path from "path";
import { CommandResponse, Imperative, ImperativeConfig, WebHelpGenerator } from "@brightside/imperative";

/**
 * List of command groups to exclude from generated docs.
 * For example, if you have the CICS plugin globally installed but don't want
 * it included in the docs, add "cics" to this list.
 */
const excludeGroups: string[] = [];

(async () => {
    const outDir: string = path.join(__dirname, "dist");
    if (fs.existsSync(outDir)) {
        require("rimraf").sync(outDir + "/*");
    } else {
        fs.mkdirSync(outDir);
    }

    // Get all command definitions
    const myConfig: any = ImperativeConfig.instance;
    myConfig.loadedConfig = require("../packages/imperative");
    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];
    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    const oldFilename: string = process.mainModule.filename;
    process.mainModule.filename = path.join(__dirname, "../package.json");
    // Initialize Imperative for commands to document
    await Imperative.init(myConfig.loadedConfig);
    process.mainModule.filename = oldFilename;
    console.log(`Initialized Imperative for ${myConfig.callerPackageJson.name} ${myConfig.callerPackageJson.version}`);

    // Exclude undesired command groups
    const cmdDefinitions: any = Imperative.fullCommandTree;
    cmdDefinitions.children = cmdDefinitions.children
        .filter((group: any) => excludeGroups.indexOf(group.name) === -1);

    // Build web help parms
    const webHelpParms: any = {
        callerPackageJson: myConfig.callerPackageJson,
        cliHome: myConfig.cliHome,
        defaultHome: myConfig.loadedConfig.defaultHome,
        fullCommandTree: cmdDefinitions,
        productDisplayName: myConfig.loadedConfig.productDisplayName,
        rootCommandDescription: myConfig.loadedConfig.rootCommandDescription,
        rootCommandName: "zowe",
        webHelpLogoImgPath: path.join(__dirname, "logo.png")
    };

    // Build command help pages
    const helpGenerator = new WebHelpGenerator(webHelpParms, outDir);
    helpGenerator.sanitizeHomeDir = true;
    helpGenerator.buildHelp(new CommandResponse({ silent: false }));

    console.log("Output located in", outDir);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
