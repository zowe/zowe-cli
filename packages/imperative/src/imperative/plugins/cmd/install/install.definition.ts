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

import { ICommandDefinition } from "../../../../../cmd";
import { join } from "path";
import { PMFConstants } from "../../utilities/PMFConstants";
import { ImperativeConfig } from "../../../../../utilities";

const cliCmdName = ImperativeConfig.instance.findPackageBinName() ?
    ImperativeConfig.instance.findPackageBinName() : "Your_CLI_Command_Name";

const pluginDescription =
    "A space-separated list of plug-ins to install. A plug-in can be " +
    "any format that is accepted by the `npm install` command (local directory, " +
    "TAR file, git URL, public package, private package, etc...).\n" +
    "\n" +
    "To use a relative local directory, at least one '/' or '\\' must exist in " +
    "the plug-in path. For example, you have a local plug-in in a folder called " +
    "'test-plugin' that you want to install. Specify the relative local directory " +
    "by issuing the following command:\n\n" +
    `${cliCmdName} plugins install ./test-plugin\n\n` +
    "If you omit the './', then the install command looks for 'test-plugin' in an " +
    "npm registry.\n" +
    "\n" +
    "If the plugin argument is omitted, the plugins.json file will determine which " +
    "plug-ins are installed. For more information on the plugins.json file, see the --file option.";

const registryDescription =
    "The npm registry that is used when installing remote packages. When this value is omitted, the " +
    "value returned by `npm config get registry` is used.\n" +
    "\n" +
    "For more information about npm registries, see: " +
    "https://docs.npmjs.com/misc/registry";

const fileDescription =
    "Specifies the location of a plugins.json file that contains the plug-ins you want to install.\n" +
    "\n" +
    "All plug-ins specified in plugins.json will be installed to the base CLI and " +
    `the contents will be placed into ${PMFConstants.instance.PLUGIN_JSON}.\n` +
    "\n" +
    "If you do not specify a plugins.json file and do not specify a plug-in, the default " +
    `plugin.json file (${PMFConstants.instance.PLUGIN_JSON}) will be used. This provides a ` +
    "way to install plug-ins that were lost or corrupted after " +
    `reinstalling or updating ${ImperativeConfig.instance.loadedConfig.productDisplayName}.`;

const loginDescription =
    "The flag to add a registry user account to install from secure registry. It saves credentials " +
    "to the .npmrc file using `npm login`. When this value is omitted, credentials from .npmrc file is used. " +
    "If you used this flag once for specific registry, you don't have to use it again, it uses credentials from .npmrc file.\n" +
    "\n" +
    "For more information about npm registries, see: \n" +
    "https://docs.npmjs.com/cli/login for NPM >= 9\n" +
    "https://docs.npmjs.com/cli/adduser for NPM < 9";

/**
 * Definition of the install command.
 * @type {ICommandDefinition}
 */
export const installDefinition: ICommandDefinition = {
    name: "install",
    type: "command",
    summary: "Install a plug-in",
    description: "Install plug-ins to an application.",
    handler: join(__dirname, "install.handler"),
    positionals: [
        {
            name: "plugin...",
            type: "string",
            description: pluginDescription,
            required: false
        }
    ],
    options: [
        {
            name: "file",
            type: "existingLocalFile",
            description: fileDescription,
            required: false,
            conflictsWith: ["registry"]
        },
        {
            name: "registry",
            type: "string",
            description: registryDescription,
            required: false
        },
        {
            name: "login",
            type: "boolean",
            description: loginDescription,
            required: false,
            implies: ["registry"]
        }
    ],
    examples: [
        {
            description: `Install plug-ins saved in ${PMFConstants.instance.PLUGIN_JSON}`,
            options: ""
        },
        {
            description: "Install plug-ins saved in a properly formatted config file",
            options: "--file /some/file/path/file_name.json"
        },
        {
            description: "Install a remote plug-in",
            options: "my-plugin"
        },
        {
            description: "Install a remote plug-in using semver",
            options: "my-plugin@\"^1.2.3\""
        },
        {
            description: "Install a remote plug-in from the specified registry",
            options: "my-plugin --registry https://registry.npmjs.org/"
        },
        {
            description: "Install a local folder, local TAR file, and a git URL",
            options: "./local-file /root/tar/some-tar.tgz git://github.com/project/repository.git#v1.0.0"
        },
        {
            description: "Install a remote plug-in from the registry which requires authorization" +
            "(don't need to use this flag if you have already logged in before)",
            options: "my-plugin --registry https://registry.npmjs.org/ --login"
        }
    ]
};
