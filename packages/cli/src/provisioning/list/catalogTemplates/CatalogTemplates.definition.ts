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

import * as path from "path";
import { ICommandDefinition } from "@zowe/imperative";

export const catalogTemplates: ICommandDefinition = {
    name: "catalog-templates",
    aliases: ["ct"],
    type: "command",
    summary: "List z/OSMF published catalog templates",
    description: "Lists the z/OSMF service catalog published templates.",
    handler: path.join(__dirname, "/CatalogTemplates.handler"),
    profile: {
        optional: ["zosmf"]
    },
    options: [
        {
            name: "all-info",
            aliases: ["ai"],
            description: "Display information about published z/OSMF " +
            "service catalog templates (summary information is printed by default).",
            type: "boolean"
        }
    ],
    examples: [
        {
            description: "List all published templates in the z/OSMF service catalog (with full detail)",
            options: "--all-info"
        }
    ]
};
