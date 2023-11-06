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

/**
 * Definition of the list command.
 * @type {ICommandDefinition}
 */
export const listDefinition: ICommandDefinition = {
    name: "list",
    type: "command",
    summary: "List installed plug-ins",
    description: "List all plug-ins installed.",
    handler: join(__dirname, "list.handler"),
    options: [
        {
            name: "short",
            aliases: ["s"],
            description: "Show output in abbreviated format",
            type: "boolean"
        }
    ]
};
