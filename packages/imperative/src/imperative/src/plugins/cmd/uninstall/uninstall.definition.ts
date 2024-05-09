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

const pluginDescription =
  "The name of the plug-in to uninstall.\n\n" +
  "If the plug-in argument is omitted, no action is taken.";

/**
 * Definition of the uninstall command.
 * @type {ICommandDefinition}
 */
export const uninstallDefinition: ICommandDefinition = {
    name: "uninstall",
    type: "command",
    summary: "Uninstall a plug-in",
    description: "Uninstall plug-ins.",
    handler: join(__dirname, "uninstall.handler"),
    positionals: [
        {
            name: "plugin...",
            type: "string",
            description: pluginDescription,
            required: false
        }
    ],
    examples: [
        {
            description: "Uninstall a plug-in",
            options    : "my-plugin"
        },
    ]
};
