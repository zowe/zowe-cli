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
 * Definition of the paths command.
 * @type {ICommandDefinition}
 */
export const schemaDefinition: ICommandDefinition = {
    name: "schema",
    type: "command",
    handler: join(__dirname, "schema.handler"),
    summary: "Dumps the JSON schema for the config",
    description: "Dumps the JSON schema for the config. " +
        "The schema is dynamically created based on your available plugins. " +
        "Direct the output of this command to a file and include in your config with '$schema' property to get editor completion.",
    examples: [
        {
            description: "Display the JSON schema for the config",
            options: ""
        }
    ]
};
