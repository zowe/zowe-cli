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
import { PluginCmdConstants } from "../PluginCmdConstants";

/**
 * Definition of the update command.
 * @type {ICommandDefinition}
 */
export const updateDefinition: ICommandDefinition = {
    name: "update",
    type: "command",
    summary: "Update a plug-in",
    description: "Update plug-ins.",
    handler: join(__dirname, "update.handler"),
    positionals: [
        {
            name: "plugin...",
            type: "string",
            description: PluginCmdConstants.UPDATE_PLUGIN_DESCRIPTION,
            required: false
        }
    ],
    options: [
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
            name: "allow-scripts",
            type: "string",
            description: PluginCmdConstants.ALLOW_SCRIPTS_DESCRIPTION,
            required: false
        }
    ],
    examples: [
        {
            description: "Update a plug-in",
            options    : "my-plugin"
        },
        {
            description: "Update a remote plug-in from the registry which requires authorization" +
      "(don't need to use this flag if you have already logged in before)",
            options: "my-plugin --registry https://registry.npmjs.org/ --login"
        },
        {
            description: "Update a plug-in and let one of its dependencies run its npm install scripts",
            options: "my-plugin --allow-scripts=\"ibm_db\""
        }
    ]
};
