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

import { join } from "path";

import { ICommandDefinition } from "../../../../cmd/doc/ICommandDefinition";

const pluginDescription =
    "The name of the installed plug-in to show first steps for.\n\n" +
    "If the plug-in argument is omitted, no action is taken.";

/**
 * Definition of the firststeps command.
 * @type {ICommandDefinition}
 */
export const firststepsDefinition: ICommandDefinition = {
    name: "show-first-steps",
    type: "command",
    aliases: ["fs"],
    summary: "Show first steps for a plugin",
    description: "Show first steps required to set up plugin for use.",
    handler: join(__dirname, "showfirststeps.handler"),
    positionals: [
        {
            name: "plugin",
            type: "string",
            description: pluginDescription,
            required: false
        }
    ],
    // options: [
    // ],
    examples: [
        {
            description: `Show first steps for a plugin called 'my-plugin'`,
            options: "my-plugin"
        }
    ]
};
