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

import { ICommandDefinition } from "@brightside/imperative";
import { Constants } from "../../../../../Constants";

export const SyncResponseCommandDefinition: ICommandDefinition = {
    name: "sync-responses",
    aliases: ["sr"],
    summary: "Collect outstanding synchronous console response messages",
    description: `The z/OSMF console REST APIs return a "solicited response key" after successfully issuing ` +
    `a synchronous console command that produces solicited responses. You can use the "solicited response key"` +
    `on the "sync-responses" command to collect any additional outstanding solicited responses ` +
    `from the console the command was issued.` +
    `\n\n` +
    `In general, when issuing a z/OS console command, z/OS applications route responses to the originating console. ` +
    `The command response messages are referred to as "solicited command responses" (i.e. direct responses to the command issued). ` +
    `When issuing a z/OS console command using ${Constants.DISPLAY_NAME}, collection of all solicited command responses ` +
    `is attempted by default. However, there is no z/OS mechanism that indicates the total number of response messages that may be produced ` +
    `from a given command. Therefore, the ${Constants.DISPLAY_NAME} console APIs return a "solicited response key" ` +
    `that can be used to "follow-up" and collect any additional solicited command responses.`,
    type: "command",
    handler: __dirname + "/Response.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "responsekey",
            type: "string",
            description: `The "solicited response key" provided in response to a previously issued console command. ` +
            `Used by the z/OSMF console API to collect any additional outstanding solicited responses from a ` +
            `previously issued console command.`,
            regex: "^[a-zA-Z0-9]+$",
            required: true,
        },
    ],
    options: [
        {
            name: "console-name",
            aliases: ["cn", "c"],
            description: `The name of the z/OS extended MCS console to direct the command. ` +
            `You must have the required authority to access the console specified. ` +
            `You may also specify an arbitrary name, if your installation allows dynamic creation ` +
            `of consoles with arbitrary names.`,
            type: "string",
            allowableValues: {
                values: [/^[a-zA-Z0-9]+$/.source],
                caseSensitive: false
            }
        },
    ],
    examples: [
        {
            description: "Collect any outstanding additional solicited response messages",
            options: "C4866969",
        }
    ],
};
