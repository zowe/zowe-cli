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

import { ICommandDefinition } from "../../../../../src/cmd";
import { join } from "path";

const pluginDescription =
  "The name of the plug-in to validate.\n" +
  "Validation issues identified for this plug-in are displayed.\n\n" +
  "If the plug-in argument is omitted, all installed plug-ins are validated.";

/**
 * Definition of the validate command.
 * @type {ICommandDefinition}
 */
export const validateDefinition: ICommandDefinition = {
    name: "validate",
    type: "command",
    summary: "Validate a plug-in",
    description: "Validate a plug-in that has been installed.",
    handler: join(__dirname, "validate.handler"),
    positionals: [
        {
            name: "plugin",
            type: "string",
            description: pluginDescription,
            required: false
        }
    ],
    options: [
        {
            name: "fail-on-error",
            aliases: ["foe"],
            type: "boolean",
            description: "Enables throwing an error and setting an error code if plugin validation detects an error.",
            required: false,
            defaultValue: true
        },
        {
            name: "fail-on-warning",
            aliases: ["fow"],
            type: "boolean",
            description: "Treat validation warnings as errors. Requires fail-on-error.",
            required: false,
            defaultValue: false,
            implies: ["fail-on-error"]
        }
    ],
    examples: [
        {
            description: `Validate a plug-in named my-plugin`,
            options    : "my-plugin"
        },
        {
            description: "Validate all installed plug-ins",
            options    : ""
        },
        {
            description: "Validate a plug-in named my-plugin, and treat warnings as errors",
            options    : "my-plugin --fail-on-warning"
        }
    ]
};
