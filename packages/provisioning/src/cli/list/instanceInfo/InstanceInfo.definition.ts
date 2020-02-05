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

import { ICommandDefinition } from "@zowe/imperative";
import * as path from "path";

export const instanceInfo: ICommandDefinition = {
    name: "instance-info",
    aliases: ["ii"],
    type: "command",
    summary: "List Provisioned Instance Details.",
    description: "List details about an instance provisioned with z/OSMF.",
    handler:  path.join(__dirname, "/InstanceInfo.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "name",
            type: "string",
            description: "Provisioned Instance Name",
            required: true
        }
    ],
    options: [
        {
            name: "display",
            description: "Level of information to display for the provisioned instance. Possible values:\n\n" +
            "summary \t- summary information, no actions or variables\n" +
            "actions \t- (default) summary with actions, no variables\n" +
            "vars \t- summary information with variables, no actions\n" +
            "extended \t- extended information with actions\n" +
            "full \t- all available information\n",
            type: "string",
            allowableValues: {
                values: ["extended", "summary", "vars", "actions", "full"],
                caseSensitive: false
            }
        }
    ],
    examples: [
        {
            description: "List summary information with a list of actions for an instance with the name \"instance1\"",
            options: "instance1"
        },
        {
            description: "Show extended general information with actions for a provisioned instance with the name \"instance1\"",
            options: "instance1 --display extended"
        }
    ]
};
