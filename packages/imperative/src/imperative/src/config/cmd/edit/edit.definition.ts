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
import { ImperativeConfig } from "../../../../../utilities/src/ImperativeConfig";

/**
 * Definition of the edit command.
 * @type {ICommandDefinition}
 */
export const editDefinition: ICommandDefinition = {
    name: "edit",
    type: "command",
    handler: join(__dirname, "edit.handler"),
    summary: "edit config files",
    description: `Edit an existing config file in your system's default text editor.\n\n` +
        `In a graphical environment, the application associated with JSON files will be launched. ` +
        `In a command-line environment, vi will be launched. To override the command-line editor used, specify it with the --editor option.`,
    options: [
        {
            name: "global-config",
            description: "Target the global config files.",
            aliases: ["gc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "user-config",
            description: "Target the user config files.",
            aliases: ["uc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "editor",
            description: `Editor that overrides the default editor for this file type. Set the option to the editor's executable file location ` +
                `or the program's name: ie "--editor notepad"`,
            aliases: ["ed"],
            type: "string",
            required: false
        },
    ],
    examples: [
        {
            description: "Edit global config file",
            options: "--global-config"
        }
    ]
};
