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

export const ActionDefinition: ICommandDefinition = {
    name: "action",
    aliases: ["act"],
    type: "command",
    summary: "Perform instance actions.",
    description: "Perform actions on instances previously provisioned with z/OSMF cloud\n" +
    "   provisioning services. To view the list of provisioned instances, use the\n" +
    "   \"zowe provisioning list registry-instances\" command. Once you have\n" +
    "   obtained an instance name you can use the \"zowe provisioning list\n" +
    "   instance-info <name>\" command to view the available instance actions.",
    handler: __dirname + "/Action.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "name",
            type: "string",
            description: "Provisioned Instance name.",
            required: true,
        },
        {
            name: "actionname",
            type: "string",
            description: "The action name. Use the \"zowe provisioning list instance-info <name>\"\n" +
            "      command to view available instance actions.",
            required: true,
        }
    ],
    examples: [
        {
            description: `Perform the "start" action on the provisioned instance "instance1"`,
            options: "instance1 start",
        }
    ]
};
