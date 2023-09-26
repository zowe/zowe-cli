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

import * as fs from "fs";
import * as os from "os";
import * as lodash from "lodash";
import * as path from "path";
import * as spawn from "cross-spawn";
import { StdioOptions } from "child_process";

import { ConfigConstants, IConfigProfile } from "../../../../../config";
import { IHandlerProgressApi } from "../../../../../cmd";
import { IO } from "../../../../../io";
import { ImperativeConfig , TextUtils } from "../../../../../utilities";
import { ITaskWithStatus, TaskProgress, TaskStage } from "../../../../../operations";
import { CliUtils } from "../../../../../utilities/src/CliUtils";

import { IPluginJson } from "../../../plugins/doc/IPluginJson";
import { PluginIssues } from "../../../plugins/utilities/PluginIssues";

import { ItemId, IProbTest, probTests } from "./EnvItems";

/**
 * This interface represents the result from getEnvItemVal().
 */
export interface IGetItemVal {
    itemVal: string;        // Value of the item. Null when we cannot get the value.
    itemValMsg: string;     // Message to display the item's value.
    itemProbMsg: string;    /* Message to display any problems with the value.
                             * Empty string (length 0) when there are no problems.
                             */
}

/**
 * This interface represents the the options for getEnvItemVal().
 */
export interface IGetItemOpts {
    /**
     * API to start/end progress bar for long running actions. Since this is a CLI thing,
     * it is optional in case non-CLI programs want to call the getEnvItemVal function.
     */
    progressApi?: IHandlerProgressApi;   // API to start/end progress bar
}

/**
 * This class encapulates operations for Zowe CLI environment information.
 * We use the term environment loosely. Sometimes it is an environment variable.
 * It can also be something in the runtime environment, like version of NodeJS.
 */
export class EnvQuery {
    private static readonly divider = `______________________________________________${os.EOL}`;
    private static readonly indent = "    ";
    private static readonly eolMatch: string = "(\r?\n|\n)";
    private static readonly allEolRegex = new RegExp(EnvQuery.eolMatch, "g");
    private static readonly lastEolRegex = new RegExp(EnvQuery.eolMatch + "$");

    // __________________________________________________________________________
    /**
     * For the specified itemId, get its value.
     *
     * @param itemId ID of the environmental item for which we want get the value.
     * @param getItemOpts options that affect our behavior.
     *
     * @returns An object with the item value, a display message, and a problem message.
     */
    public static async getEnvItemVal(itemId: ItemId, getItemOpts: IGetItemOpts = {}): Promise<IGetItemVal> {
        const getResult: IGetItemVal = { itemVal: null, itemValMsg: "", itemProbMsg: "" };
        switch(itemId) {
            case ItemId.ZOWE_VER: {
                EnvQuery.getZoweVer(getResult);
                break;
            }
            case ItemId.NODEJS_VER: {
                getResult.itemVal = process.versions.node;
                getResult.itemValMsg = "Node.js version = " + getResult.itemVal;
                break;
            }
            case ItemId.NVM_VER: {
                getResult.itemVal = EnvQuery.getCmdOutput("nvm", ["version"]);
                getResult.itemValMsg = "Node Version Manager version = " + getResult.itemVal;
                break;
            }
            case ItemId.PLATFORM: {
                getResult.itemVal = os.platform();
                getResult.itemValMsg = "O.S. platform = " + getResult.itemVal;
                break;
            }
            case ItemId.ARCHITECTURE: {
                getResult.itemVal = os.arch();
                getResult.itemValMsg = "O.S. architecture = " + getResult.itemVal;
                break;
            }
            case ItemId.OS_PATH: {
                getResult.itemVal = process.env.PATH;
                getResult.itemValMsg = os.EOL + "O.S. PATH = " + getResult.itemVal;
                break;
            }
            case ItemId.ZOWE_CLI_HOME: {
                getResult.itemVal = process.env.ZOWE_CLI_HOME;
                if (getResult.itemVal === undefined) {
                    getResult.itemVal += os.EOL + EnvQuery.indent + "Default = " +
                        path.normalize(ImperativeConfig.instance.cliHome);
                }
                getResult.itemValMsg = os.EOL + "ZOWE_CLI_HOME = " + getResult.itemVal;
                break;
            }
            case ItemId.ZOWE_APP_LOG_LEVEL: {
                getResult.itemVal = process.env.ZOWE_APP_LOG_LEVEL;
                getResult.itemValMsg = "ZOWE_APP_LOG_LEVEL = " + getResult.itemVal;
                break;
            }
            case ItemId.ZOWE_IMPERATIVE_LOG_LEVEL: {
                getResult.itemVal = process.env.ZOWE_IMPERATIVE_LOG_LEVEL;
                getResult.itemValMsg = "ZOWE_IMPERATIVE_LOG_LEVEL = " + getResult.itemVal;
                break;
            }
            case ItemId.OTHER_ZOWE_VARS: {
                EnvQuery.getOtherZoweEnvVars(getResult);
                break;
            }
            case ItemId.NPM_VER: {
                await EnvQuery.getNpmInfo(getResult, getItemOpts);
                break;
            }
            case ItemId.ZOWE_CONFIG_TYPE: {
                await EnvQuery.getConfigInfo(getResult, getItemOpts);
                break;
            }
            case ItemId.ZOWE_PLUGINS: {
                await EnvQuery.getPluginInfo(getResult, getItemOpts);
                break;
            }
            default: {
                getResult.itemProbMsg = "An unknown item ID was supplied = " + itemId;
                return getResult;
            }
        }

        getResult.itemProbMsg = EnvQuery.getEnvItemProblems(itemId, getResult.itemVal);
        return getResult;
    }

    // __________________________________________________________________________
    /**
     * Detect if a specified problem test finds a problem for the specified value.
     *
     * @param itemVal The value of the environmental item.
     * @param probTest A problem test to be evaluated.
     *
     * @returns True if we find a problem. False otherwise.
     */
    private static detectProbVal(value: string, probTest: IProbTest): boolean {
        /* eslint-disable unused-imports/no-unused-vars */
        const semver = require('semver');
        const probExprWithVals = probTest.probExpr.replace(/{val}/g, value);
        return eval(probExprWithVals);
    }

    // __________________________________________________________________________
    /**
     * Run a command that displays output.
     *
     * @param cmdToRun The command name to be run.
     * @param args The arguments to the command.
     *
     * @return The output of the command.
     */
    private static getCmdOutput(cmdToRun: string, args: string[]): string {
        let cmdOutput: string = "";
        const ioOpts: StdioOptions = ["pipe", "pipe", "pipe"];
        try {
            const spawnResult = spawn.sync(cmdToRun, args, {
                stdio: ioOpts,
                shell: true
            });
            if (spawnResult.stdout && spawnResult.stdout.length > 0) {
                // remove any trailing newline from the output
                cmdOutput = spawnResult.stdout.toString();
            } else {
                cmdOutput = cmdToRun + " failed to display any output.";
                if (spawnResult.stderr) {
                    cmdOutput += `${os.EOL}Reason = ` + spawnResult.stderr.toString();
                }
            }
        } catch (err) {
            cmdOutput = "Failed to run command = " + cmdToRun + " " + args.join(" ");
            if (err.message) {
                cmdOutput += `${os.EOL}Details = ` + err.message;
            }
            cmdOutput = TextUtils.chalk.red(cmdOutput);
        }

        // remove any trailing newline from the output
        cmdOutput = cmdOutput.replace(EnvQuery.lastEolRegex, "");

        if (cmdOutput.length == 0) {
            cmdOutput = "Failed to get any information from " + cmdToRun + " " + args.join(" ");
        }
        return cmdOutput;
    }

    // __________________________________________________________________________
    /**
     * Get information about the Zowe configuration.
     *
     * @param getResult The itemVal and itemValMsg properties are filled
     *                  by this function.
     * @param getItemOpts options that affect our behavior.
     */
    private static async getConfigInfo(
        getResult: IGetItemVal, getItemOpts: IGetItemOpts
    ): Promise<void> {
        const teamCfg: string = "V2 Team Config";
        const v1Profiles = "V1 Profiles";
        const doesProgBarExist: boolean = (getItemOpts?.progressApi) ? true: false;

        // setup progress bar
        const configProgress: ITaskWithStatus = {
            percentComplete: TaskProgress.TEN_PERCENT,
            statusMessage: "No value yet",
            stageName: TaskStage.IN_PROGRESS
        };

        if (ImperativeConfig.instance.config?.exists) {
            getResult.itemVal = teamCfg;
            configProgress.statusMessage = "Retrieving V2 configuration";
            configProgress.percentComplete = TaskProgress.TWENTY_PERCENT;
        } else {
            getResult.itemVal = v1Profiles;
            configProgress.statusMessage = "Retrieving V1 configuration";
            configProgress.percentComplete = TaskProgress.FIFTY_PERCENT;
        }

        if (doesProgBarExist) {
            getItemOpts.progressApi.startBar({task: configProgress});
            await EnvQuery.updateProgressBar(doesProgBarExist, true);
        }

        getResult.itemValMsg = "Zowe daemon mode = ";
        if (ImperativeConfig.instance.loadedConfig.daemonMode) {
            getResult.itemValMsg += "on";

            configProgress.statusMessage = "Retrieving Zowe executable version";
            await EnvQuery.updateProgressBar(doesProgBarExist);

            const cliCmdName = ImperativeConfig.instance.rootCommandName;
            const exeVerOutput = EnvQuery.getCmdOutput(cliCmdName, ["--version-exe"]);
            if (exeVerOutput.match(/DESCRIPTION/) == null) {
                getResult.itemValMsg += `${os.EOL}Zowe daemon executable version = ` + exeVerOutput;
            }
            getResult.itemValMsg +=
                `${os.EOL}Default Zowe daemon executable directory = ` +
                path.normalize(ImperativeConfig.instance.cliHome + "/bin");
        } else {
            getResult.itemValMsg += "off";
        }
        getResult.itemValMsg += `${os.EOL}Zowe config type = ` + getResult.itemVal;

        if ( getResult.itemVal == teamCfg) {
            // Display all relevant zowe team config files.
            configProgress.statusMessage = "Retrieving active team config files";
            configProgress.percentComplete = TaskProgress.THIRTY_PERCENT;
            await EnvQuery.updateProgressBar(doesProgBarExist);
            const config = ImperativeConfig.instance.config;

            /* Get our list of config files.
             * Logic stolen from "config list" handler.
             */
            const configListObj: any = {};
            for (const layer of config.layers) {
                if (layer.exists) {
                    configListObj[layer.path] = layer.properties;
                    if (configListObj[layer.path] != null) {
                        for (const secureProp of config.api.secure.secureFields(layer)) {
                            if (lodash.has(configListObj[layer.path], secureProp)) {
                                lodash.set(configListObj[layer.path], secureProp, ConfigConstants.SECURE_VALUE);
                            }
                        }
                    }
                }
            }

            getResult.itemValMsg += `${os.EOL}Team config files in effect:${os.EOL}`;
            for (const configLoc  of Object.keys(configListObj)) {
                getResult.itemValMsg += EnvQuery.indent + configLoc + os.EOL;
            }

            // get default profile names
            configProgress.statusMessage = "Retrieving default profile names";
            configProgress.percentComplete = TaskProgress.SIXTY_PERCENT;
            await EnvQuery.updateProgressBar(doesProgBarExist);

            getResult.itemValMsg += "Default profile names: "  + os.EOL;
            let maxSpace: number = 1;
            for (const profType of Object.keys(config.mProperties.defaults)) {
                // calculate the max space we need between profile type and name
                maxSpace = (maxSpace < profType.length) ? profType.length + 1 : maxSpace;
            }
            for (const profType of Object.keys(config.mProperties.defaults)) {
                getResult.itemValMsg += EnvQuery.indent + profType + " =";
                for (let count = 1; count <= maxSpace - profType.length; count ++) {
                    getResult.itemValMsg += " ";
                }
                getResult.itemValMsg += config.mProperties.defaults[profType] + os.EOL;
            }

            // get all available zowe profile names
            configProgress.statusMessage = "Retrieving available profile names";
            configProgress.percentComplete = TaskProgress.NINETY_PERCENT;
            await EnvQuery.updateProgressBar(doesProgBarExist);

            /* Recursive function to get our list of profiles.
             * Logic stolen from "config profiles" handler.
             */
            const getProfList = function(
                profiles: { [key: string]: IConfigProfile },
                startLoc: string,
                profPathNms: string[]
            ) {
                const currLoc = startLoc;
                for (const [profNm, profObj] of Object.entries(profiles)) {
                    const currPathNm = currLoc + `${currLoc.length > 0 ? "." : ""}${profNm}`;
                    profPathNms.push(currPathNm);
                    if (profObj.profiles != null) {
                        getProfList(profObj.profiles, currPathNm, profPathNms);
                    }
                }
            };
            const profPathNms: string[] = [];
            getProfList(config.properties.profiles, "", profPathNms);
            getResult.itemValMsg += `Available profile names:${os.EOL}`;
            for (const profPathNm of profPathNms) {
                getResult.itemValMsg += EnvQuery.indent + profPathNm + os.EOL;
            }
        } else {
            // display V1 profile information
            configProgress.statusMessage = "Retrieving available profile names";
            configProgress.percentComplete = TaskProgress.NINETY_PERCENT;
            await EnvQuery.updateProgressBar(doesProgBarExist);

            getResult.itemValMsg += `${os.EOL}Available profiles:${os.EOL}`;
            const v1ProfilesDir = path.normalize(ImperativeConfig.instance.cliHome + "/profiles");
            if (IO.isDir(v1ProfilesDir)) {
                // read all of the subdirectories of the profiles directory
                fs.readdirSync(v1ProfilesDir).forEach((nextProfileTypeNm) => {
                    const profileTypeDir = path.normalize(v1ProfilesDir + "/" + nextProfileTypeNm);
                    let profilesOfCurrType: string = "";

                    // is the next candidate for nextProfileTypeNm a directory?
                    if (IO.isDir(profileTypeDir)) {
                        // does the next profile type directory have any profiles?
                        fs.readdirSync(profileTypeDir).forEach((nextProfileNm) => {
                            // exclude the meta files
                            if (nextProfileNm.endsWith("_meta.yaml")) {
                                return;
                            }
                            profilesOfCurrType += EnvQuery.indent + EnvQuery.indent +
                                nextProfileNm.replace(".yaml", "") + os.EOL;
                        });
                    }

                    // did we find any profiles?
                    if (profilesOfCurrType.length > 0) {
                        getResult.itemValMsg += EnvQuery.indent + nextProfileTypeNm +
                        " profiles: " + os.EOL + profilesOfCurrType;

                    }
                });
            }
        }

        // add indent to each line
        getResult.itemValMsg  = EnvQuery.divider + "Zowe CLI configuration information:" +
            os.EOL + os.EOL + EnvQuery.indent +
            getResult.itemValMsg.replace(EnvQuery.allEolRegex, "$1" + EnvQuery.indent);

        configProgress.statusMessage = "Complete";
        configProgress.percentComplete = TaskProgress.ONE_HUNDRED_PERCENT;
        configProgress.stageName = TaskStage.COMPLETE;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        if (doesProgBarExist) {
            getItemOpts.progressApi.endBar();
        }
    } // end getConfigInfo

    // __________________________________________________________________________
    /**
     * For the specified itemId, get any known problems.
     *
     * @param itemId ID of the environmental item for which we want to detect problems.
     * @param itemVal The value of the environmental item.
     * @returns A string with a message about the problems. An empty string if no problems are detected.
     */
    private static getEnvItemProblems(itemId: ItemId, itemVal: string): string {
        let probMsgs: string = "";
        for (const nextProbTest of probTests) {
            if (itemId === nextProbTest.itemId) {
                if (EnvQuery.detectProbVal(itemVal, nextProbTest)) {
                    if (probMsgs.length > 0) {
                        probMsgs += os.EOL;
                    }
                    probMsgs += nextProbTest.probMsg;
                }
            }
        }
        return probMsgs;
    }

    // __________________________________________________________________________
    /**
     * Get information about the NPM configuration.
     *
     * @param getResult The itemVal and itemValMsg properties are filled
     *                  by this function.
     * @param getItemOpts options that affect our behavior.
     */
    private static async getNpmInfo(
        getResult: IGetItemVal,
        getItemOpts: IGetItemOpts
    ): Promise<void> {
        const percentIncr: number = 10;
        const doesProgBarExist: boolean = (getItemOpts?.progressApi) ? true: false;

        // setup progress bar
        const npmProgress: ITaskWithStatus = {
            percentComplete: TaskProgress.TEN_PERCENT,
            statusMessage: "Retrieving NPM Version",
            stageName: TaskStage.IN_PROGRESS
        };
        if (doesProgBarExist) {
            getItemOpts.progressApi.startBar({task: npmProgress});
            await EnvQuery.updateProgressBar(doesProgBarExist, true);
        }

        getResult.itemVal = EnvQuery.getCmdOutput("npm", ["--version"]);
        getResult.itemValMsg  = `${os.EOL}NPM version = ` +  getResult.itemVal;

        npmProgress.statusMessage = "Retrieving current shell";
        npmProgress.percentComplete += percentIncr;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        getResult.itemValMsg += `${os.EOL}Shell = ` + EnvQuery.getCmdOutput("npm", ["config", "get", "shell"]);

        npmProgress.statusMessage = "Retrieving NPM global prefix";
        npmProgress.percentComplete += percentIncr;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        getResult.itemValMsg += `${os.EOL}Global prefix = ` + EnvQuery.getCmdOutput("npm", ["prefix", "-g"]);
        getResult.itemValMsg += os.EOL + EnvQuery.indent + "The directory above contains the Zowe Node.js command script.";

        npmProgress.statusMessage = "Retrieving NPM global root node modules";
        npmProgress.percentComplete += percentIncr;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        getResult.itemValMsg += `${os.EOL}Global root node modules = ` + EnvQuery.getCmdOutput("npm", ["root", "-g"]);

        npmProgress.statusMessage = "Retrieving NPM global config";
        npmProgress.percentComplete += percentIncr;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        getResult.itemValMsg += `${os.EOL}Global config = ` + EnvQuery.getCmdOutput("npm", ["config", "get", "globalconfig"]);

        npmProgress.statusMessage = "Retrieving NPM local prefix";
        npmProgress.percentComplete += percentIncr;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        getResult.itemValMsg += `${os.EOL}Local prefix = ` + EnvQuery.getCmdOutput("npm", ["prefix"]);

        npmProgress.statusMessage = "Retrieving NPM local root node modules";
        npmProgress.percentComplete += percentIncr;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        getResult.itemValMsg += `${os.EOL}Local root node modules = ` + EnvQuery.getCmdOutput("npm", ["root"]);

        npmProgress.statusMessage = "Retrieving NPM user config";
        npmProgress.percentComplete += percentIncr;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        getResult.itemValMsg += `${os.EOL}User config = ` + EnvQuery.getCmdOutput("npm", ["config", "get", "userconfig"]);

        npmProgress.statusMessage = "Retrieving NPM registry info";
        npmProgress.percentComplete += percentIncr;
        await EnvQuery.updateProgressBar(doesProgBarExist);

        // Filter the output of "npm config list" command to only include lines we are interested in.
        // Also remove "; " prefix from lines where it was added by npm and is not a user-added comment.
        getResult.itemValMsg += os.EOL + os.EOL + EnvQuery.getCmdOutput("npm", ["config", "list"])
            .split(EnvQuery.allEolRegex)
            .filter(line => /registry =|"project"|node bin location =|cwd =|HOME =/.test(line))
            .map(line => line.includes("registry =") ? line : line.replace(/^; /, ""))
            .join(os.EOL);

        // add indent to each line
        getResult.itemValMsg = EnvQuery.divider + "NPM information:" + os.EOL + EnvQuery.indent +
            getResult.itemValMsg.replace(EnvQuery.allEolRegex, "$1" + EnvQuery.indent);

        npmProgress.statusMessage = "Complete";
        npmProgress.percentComplete = TaskProgress.ONE_HUNDRED_PERCENT;
        npmProgress.stageName = TaskStage.COMPLETE;
        await EnvQuery.updateProgressBar(doesProgBarExist);
        if (doesProgBarExist) {
            getItemOpts.progressApi.endBar();
        }
    } // end getNpmInfo

    // __________________________________________________________________________
    /**
     * Get other Zowe variables, beyond the ones we check for problem values.
     *
     * @param getResult The itemValMsg property is filled by this function.
     *                  The itemVal property is given no value by this function.
     */
    private static getOtherZoweEnvVars(getResult: IGetItemVal): void {
        getResult.itemValMsg = "";
        const envVars = process.env;
        for (const nextVar of Object.keys(envVars)) {
            if (nextVar.startsWith("ZOWE_") && nextVar != "ZOWE_CLI_HOME" &&
                nextVar != "ZOWE_APP_LOG_LEVEL" && nextVar != "ZOWE_IMPERATIVE_LOG_LEVEL")
            {
                getResult.itemValMsg += nextVar + " = " ;
                if (nextVar.toUpperCase().includes("PASSWORD") ||
                    nextVar.toUpperCase().includes("TOKEN"))
                {
                    getResult.itemValMsg += "******";
                } else {
                    getResult.itemValMsg += envVars[nextVar];

                }
                getResult.itemValMsg += os.EOL;
            }
        }

        // remove the last newline
        getResult.itemValMsg = getResult.itemValMsg.replace(EnvQuery.lastEolRegex, "");
        if (getResult.itemValMsg.length == 0) {
            getResult.itemValMsg += "No other 'ZOWE_' variables have been set.";
        }
    }

    // __________________________________________________________________________
    /**
     * Get information about Zowe plugins.
     * Logic stolen from plugins list command handler.
     *
     * @param getResult The itemVal and itemValMsg properties are filled
     *                  by this function.
     */
    private static async getPluginInfo(
        getResult: IGetItemVal, getItemOpts: IGetItemOpts
    ): Promise<void> {
        const doesProgBarExist: boolean = (getItemOpts?.progressApi) ? true: false;

        // setup progress bar
        const configProgress: ITaskWithStatus = {
            percentComplete: TaskProgress.FIFTY_PERCENT,
            statusMessage: "Retrieving installed plugins",
            stageName: TaskStage.IN_PROGRESS
        };

        if (doesProgBarExist) {
            getItemOpts.progressApi.startBar({task: configProgress});
            await EnvQuery.updateProgressBar(doesProgBarExist, true);
        }

        const installedPlugins: IPluginJson = PluginIssues.instance.getInstalledPlugins();
        getResult.itemValMsg = EnvQuery.divider + "Installed plugins:" + os.EOL;
        for (const nextPluginNm of Object.keys(installedPlugins)
            .sort((a, b) => a.localeCompare(b)))
        {
            getResult.itemValMsg += os.EOL + EnvQuery.indent + nextPluginNm + os.EOL +
                EnvQuery.indent + EnvQuery.indent + "Version = " +
                installedPlugins[nextPluginNm].version + os.EOL +
                EnvQuery.indent + EnvQuery.indent + "Package = " +
                installedPlugins[nextPluginNm].package + os.EOL;
        }
        getResult.itemValMsg += EnvQuery.divider;

        if (doesProgBarExist) {
            configProgress.percentComplete = TaskProgress.ONE_HUNDRED_PERCENT;
            await EnvQuery.updateProgressBar(doesProgBarExist);
            getItemOpts.progressApi.endBar();
        }
    }

    // __________________________________________________________________________
    /**
     * Get the Zowe version number.
     *
     * @param getResult The itemVal and itemValMsg properties are filled
     *                  by this function.
     */
    private static getZoweVer(getResult: IGetItemVal): void {
        const cliPackageJson: any = ImperativeConfig.instance.callerPackageJson;
        if (Object.prototype.hasOwnProperty.call(cliPackageJson, "version")) {
            getResult.itemVal = cliPackageJson.version;
        }
        else {
            getResult.itemVal = "No version found in CLI package.json!";
        }
        getResult.itemValMsg =  EnvQuery.divider + "Zowe CLI version = " + getResult.itemVal;
    }

    // __________________________________________________________________________
    /**
     * If a progress bar is in use, pause long enough to let it update its status.
     *
     * @param doesProgBarExist
     *        Is the progress bar availbale for use?
     * @param firstUpdate
     *        Is this our first progress bar update?
     *        Initialization of the progress bar takes extra time.
     */
    private static async updateProgressBar(
        doesProgBarExist: boolean,
        firstUpdate: boolean = false
    ): Promise<void> {
        if (doesProgBarExist) {
            const firstUpdateTime = 300; // millis
            const laterUpdateTime = 100; // millis
            let timeToUpdate: number;
            if (firstUpdate) {
                timeToUpdate = firstUpdateTime;
            } else {
                timeToUpdate = laterUpdateTime;
            }
            await CliUtils.sleep(timeToUpdate);
        }
    }
}
