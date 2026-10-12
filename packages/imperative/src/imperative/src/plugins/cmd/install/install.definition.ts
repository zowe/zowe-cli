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
import { PluginCmdConstants } from "../PluginCmdConstants";

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
            description: PluginCmdConstants.INSTALL_PLUGIN_DESCRIPTION,
            required: false
        }
    ],
    options: [
        {
            name: "file",
            type: "existingLocalFile",
            description: PluginCmdConstants.FILE_DESCRIPTION,
            required: false,
            conflictsWith: ["registry"]
        },
        {
            name: "registry",
            type: "string",
            description: PluginCmdConstants.REGISTRY_DESCRIPTION,
            required: false
        },
        {
            name: "login",
            type: "boolean",
            description: PluginCmdConstants.LOGIN_DESCRIPTION,
            required: false,
            implies: ["registry"]
        },
        {
            name: "verbose",
            type: "boolean",
            description: PluginCmdConstants.VERBOSE_DESCRIPTION,
            required: false
        },
        {
            name: "allow-scripts",
            type: "string",
            description: PluginCmdConstants.ALLOW_SCRIPTS_DESCRIPTION,
            required: false
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
        },
        {
            description: "Install a remote plug-in and let one of its dependencies run its npm install scripts",
            options: "my-plugin --allow-scripts=\"ibm_db\""
        }
    ]
};
