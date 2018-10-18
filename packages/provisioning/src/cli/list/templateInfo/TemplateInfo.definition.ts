/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandDefinition } from "@brightside/imperative";
import * as path from "path";

export const templateInfo: ICommandDefinition = {
    name: "template-info",
    aliases: ["ti"],
    type: "command",
    summary: "List Published Template Details.",
    description: "List details about a template published with z/OSMF Cloud Provisioning.",
    handler:  path.join(__dirname, "/TemplateInfo.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "name",
            type: "string",
            description: "The name of a z/OSMF cloud provisioning template.",
            required: true,
        }
    ],
    options: [
        {
            name: "all-info",
            aliases: ["ai"],
            description: "Display detailed information about published z/OSMF " +
            "service catalog template (summary information is printed by default).",
            type: "boolean"
        }
    ],
    examples: [
        {
            description: "List summary information for template \"template1\"",
            options: "template1",
        }
    ]
};
