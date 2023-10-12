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

/**
 * Definition of the list command.
 * @type {ICommandDefinition}
 */
export const listDefinition: ICommandDefinition = {
    name: "list",
    aliases: ["li"],
    type: "command",
    handler: join(__dirname, "list.handler"),
    summary: "List all configuration setting options",
    description: "List all configuration setting options.",
    options: [
        {
            name: "values",
            type: "boolean",
            description: "Show values for every option",
        },
    ],
    examples: [
        {
            options: "",
            description: "List all configuration setting options"
        },
        {
            options: "--values",
            description: "List all configuration setting options with values"
        }
    ],
};
