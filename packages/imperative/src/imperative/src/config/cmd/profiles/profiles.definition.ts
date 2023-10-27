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
export const profilesDefinition: ICommandDefinition = {
    name: "profiles",
    type: "command",
    handler: join(__dirname, "profiles.handler"),
    summary: "displays profile paths",
    description: "Displays profile paths.",
    examples: [
        {
            description: "Display profile paths",
            options: ""
        }
    ]
};
