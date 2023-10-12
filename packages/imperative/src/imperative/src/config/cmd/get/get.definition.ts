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
 * Definition of the get command.
 * @type {ICommandDefinition}
 */
export const getDefinition: ICommandDefinition = {
    name: "get",
    aliases: ["ge"],
    type: "command",
    handler: join(__dirname, "get.handler"),
    summary: "Get a value of single setting option",
    description: "Get a value of single setting option.",
    positionals: [
        {
            name: "configName",
            type: "string",
            description: "Setting name",
            required: true
        }
    ],
    examples: [
        {
            options: "CredentialManager",
            description: "Get a value of CredentialManager setting"
        }
    ],
};
