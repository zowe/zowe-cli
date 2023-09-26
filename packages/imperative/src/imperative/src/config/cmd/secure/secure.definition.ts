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

export const secureDefinition: ICommandDefinition = {
    name: "secure",
    type: "command",
    handler: join(__dirname, "secure.handler"),
    summary: "secure configuration properties",
    description: "prompt for secure configuration properties",
    options: [
        {
            name: "global-config",
            description: "Secure properties in global config.",
            aliases: ["gc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "user-config",
            description: "Secure properties in user config.",
            aliases: ["uc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "prune",
            description: "Delete properties stored in the vault for team config files that do not exist.",
            aliases: ["p"],
            type: "boolean",
            defaultValue: false
        }
    ],
    examples: [
        {
            description: "Secure the properties in global config",
            options: "--global-config"
        },
        {
            description: "Secure the properties in user config",
            options: "--user-config"
        }
    ]
};
