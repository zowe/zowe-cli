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

import { Logger } from "../../../../logger";
import { ProcessUtils } from "../../../../utilities";
import { PMFConstants } from "./PMFConstants";

/**
 * Run another instance of the host CLI command to validate a plugin that has
 * just been installed. We use a separate process instead of an API call
 * because when the user re-installs an existing plugin we cannot validate
 * if the plugin has conflicting command names because the plugin has
 * already been incorporated into the Imperative command tree, and thus it
 * could conflict with its own commands. However, if we run a validate command
 * in a new process, we start with a clean slate and we get accurate results.
 *
 * @param pluginName - The name of a plugin to be validated.
 *
 * @returns - The text output of the validate plugin command.
 */
export function runValidatePlugin(pluginName: string): string {
    const extLen = 3;
    const cmdToRun = process.execPath;
    const cliPgmToRun = require.main.filename;
    let cmdToRunArgs: string[] = [];
    if (cliPgmToRun.substring(cliPgmToRun.length - extLen) === ".ts") {
        cmdToRunArgs = ["--require", "ts-node/register"];
    }
    cmdToRunArgs.push(cliPgmToRun);

    const impLogger = Logger.getImperativeLogger();
    impLogger.debug(`Running plugin validation command = ${cmdToRun} plugins validate "${pluginName}" --response-format-json --no-fail-on-error`);
    const valOutputJsonTxt = ProcessUtils.execAndCheckOutput(cmdToRun,
        [
            ...cmdToRunArgs,
            "plugins", "validate", pluginName,
            "--response-format-json",
            "--no-fail-on-error"
        ], {
            cwd: PMFConstants.instance.PMF_ROOT
        }
    ).toString();

    // Debug trace information
    impLogger.trace(`Command Output: ${valOutputJsonTxt}`);

    const valResultJsonObj = JSON.parse(valOutputJsonTxt);
    return formValidateMsg(valResultJsonObj);
}

// _______________________________________________________________________
/**
 * Form the final validation message. We concatenate the stderr and stdout
 * of the validation command.
 *
 * @param {string} valResultJsonObj - The output of plugin validation command.
 *
 * @returns {String} The final message to be displayed to the end user.
 */
function formValidateMsg(valResultJsonObj: any) {
    const validateOutput = valResultJsonObj.stdout;
    const validateErr = valResultJsonObj.stderr;
    let fullMsg = "";
    if (validateErr && validateErr.length > 0) {
        fullMsg += validateErr + "\n";
    }
    if (validateOutput && validateOutput.length > 0) {
        fullMsg += validateOutput + "\n";
    }
    return fullMsg;
}
