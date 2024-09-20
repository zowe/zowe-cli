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

import { ICommandDefinition, ICommandOptionDefinition } from "@zowe/imperative";
import { TsoProfileConstants } from "@zowe/zos-tso-for-zowe-sdk";

export const CommandDefinition: ICommandDefinition = {
    name: "command",
    aliases: ["cmd"],
    summary: "Issue a TSO command",
    description: "Creates a TSO address space, issues a TSO command through the newly created address space, " +
    "waits for the READY prompt to print the response, and terminates the TSO address space. All response data" +
    " are returned to the user up to (but not including) the TSO 'READY' prompt.",
    type: "command",
    handler: __dirname + "/Command.handler",
    profile: {
        optional: ["zosmf", "tso"]
    },
    positionals: [
        {
            name: "commandText",
            type: "string",
            description: "The TSO command to issue.",
            required: true
        }
    ],
    options: ([
        {
            // Old API behavior will be utilized upon specifying --ssm to be false,
            // otherwise try new API and if it fails, fallback to old API.

            // Specifying --ssm to be false makes the value of --stateful have no impact on
            // behavior since old API behavior does not utilize statefulness.
            name: "suppress-startup-messages",
            aliases: ["ssm"],
            type: "boolean",
            description: "Suppress console messages from start of address space.",
            defaultValue: false
        },
        {
            // --stateful has no impact if --suppress-startup-messages is set to false.
            name: "stateful",
            aliases: ["sf"],
            type: "boolean",
            description:"Statefulness of address space created for TSO command." +
            " This option is not supported when --suppress-startup-messages is set to false.",
            defaultValue: false
        }
    ] as ICommandOptionDefinition[]).concat(TsoProfileConstants.TSO_PROFILE_OPTIONS),
    examples: [
        {
            description: 'Issue the TSO command "status" to display information about jobs for your user ID.',
            options: "\"status\""
        }
    ]
};
