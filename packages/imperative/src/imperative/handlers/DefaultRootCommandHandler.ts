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

import { Imperative } from "../../../src/imperative/Imperative";
import { ICommandHandler, IHandlerParameters, ICommandTreeEntry, CommandUtils } from "../../../cmd";
import { ImperativeConfig, TextUtils } from "../../../src/utilities";
import { WebHelpManager } from "../../../src/cmd/help/WebHelpManager";
/**
 * The default command handler for the top level/root command
 * Allows the user to check the version of the package.
 * If they haven't specified --version, the help prints
 */
export default class DefaultRootCommandHandler implements ICommandHandler {
    public async process(params: IHandlerParameters) {
        // if --version is specified
        if (params.arguments.version) {
            // load the user's package.json to check the version of their package
            const packageJson: any = ImperativeConfig.instance.callerPackageJson;
            params.response.console.log(packageJson.version);
            params.response.data.setObj({ version: packageJson.version });
            params.response.data.setMessage("Version displayed");
        } else if(params.arguments.availableCommands) {

            // Gather and display the full set of commands available to the CLI with descriptions
            const cmdList: ICommandTreeEntry[] = CommandUtils.flattenCommandTree(Imperative.fullCommandTree);
            cmdList.forEach((cmd: ICommandTreeEntry) => {
                if (cmd.command.type === "command") {
                    params.response.console.log(Imperative.highlightWithPrimaryColor(`${Imperative.rootCommandName.trim()} ${cmd.fullName.trim()}`));
                    params.response.console.log("");
                    params.response.console.log(TextUtils.wordWrap(cmd.command.description,
                        TextUtils.DEFAULT_WRAP_WIDTH,
                        "\t"));
                    params.response.console.log("");
                }
            });

            params.response.data.setObj(Imperative.fullCommandTree, false);
        } else if (params.arguments.helpWeb) {
            WebHelpManager.instance.openRootHelp(params.response);
        } else {
            params.response.console.log(Buffer.from(Imperative.getHelpGenerator({
                commandDefinition: params.definition,
                fullCommandTree: params.fullDefinition,
                experimentalCommandsDescription: ImperativeConfig.instance.loadedConfig.experimentalCommandDescription
            }).buildHelp()));
        }
    }
}
