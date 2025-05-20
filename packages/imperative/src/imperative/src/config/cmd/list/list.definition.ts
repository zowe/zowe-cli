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

import { join } from "node:path";
import { ICommandDefinition } from "../../../../../cmd";

export const listDefinition: ICommandDefinition = {
    name: "list",
    aliases: ["ls"],
    type: "command",
    summary: "List config properties",
    description: "List config properties.",
    handler: join(__dirname, "list.handler"),
    positionals: [
        {
            name: "property",
            description: "The config property to list. Blank to list all properties.",
            type: "string"
        }
    ],
    options: [
        {
            name: "locations",
            description: "Separate the config properties into their respective config file locations. " +
                "Helpful to determine where configuration value is specified.",
            type: "boolean"
        },
        {
            name: "name-only",
            description: "List only the names of root level property names. " +
                "For example, specify in addition to '--locations' to get a list of config file paths only.",
            type: "boolean",
            aliases: [
                "root"
            ]
        }
    ],
    examples: [
        {
            description: "List property names for a specified config property",
            options: `"defaults"`
        },
        {
            description: "List only root level property names for a specified config property",
            options: `"defaults" --name-only`
        },
        {
            description: "List config properties by separating them by their respective config file locations",
            options: "--locations"
        },
        {
            description: "List only the root level configuration property names",
            options: "--name-only"
        },
        {
            description: "List only the root level configuration property names by separating them by their respective config file locations",
            options: "--locations --name-only"
        }
    ]
};
