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
import { Constants } from "../../../../../Constants";

export const IssueCommandDefinition: ICommandDefinition = {
    name: "command",
    aliases: ["cmd"],
    summary: "Issue a z/OS console command and print the response",
    description: `Issue a z/OS console command and print command responses (known as "solicited command responses").` +
    `\n\n` +
    `In general, when issuing a z/OS console command, z/OS applications route responses to the originating console. ` +
    `The command response messages are referred to as "solicited command responses" (i.e. direct responses to the command issued). ` +
    `When issuing a z/OS console command using ${Constants.DISPLAY_NAME}, collection of all solicited command responses ` +
    `is attempted by default. However, there is no z/OS mechanism that indicates the total number of response messages that may be produced ` +
    `from a given command. Therefore, the ${Constants.DISPLAY_NAME} console APIs return a "solicited response key" ` +
    `that can be used to "follow-up" and collect any additional solicited command responses.` +
    `\n\n` +
    `${Constants.DISPLAY_NAME} will issue "follow-up" API requests by default ` +
    `to collect any additional outstanding solicited command responses until a request returns no additional responses. ` +
    `At that time, ${Constants.DISPLAY_NAME} will attempt a final collection attempt. ` +
    `If no messages are present, the command is complete. If additional messages are present, the process is repeated. ` +
    `However, this does not guarantee that all messages produced in direct response (i.e. solicited) have been collected. ` +
    `The z/OS application may produce additional messages in direct response to your command at some point in the future. ` +
    `You can manually collect additional responses using the "command response key" OR specify additional processing ` +
    `options to, for example, delay collection attempts by a specified interval.`,
    type: "command",
    handler: __dirname + "/Command.handler",
    profile: {
        required: ["zosmf"],
    },
    positionals: [
        {
            name: "commandtext",
            type: "string",
            description: "The z/OS console command to issue",
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
        {
            name: "include-details",
            aliases: ["id", "i"],
            description: `Include additional details at the end of the ${Constants.DISPLAY_NAME} command response, ` +
            `such as the "command response key" and the z/OSMF command response URL.`,
            type: "boolean",
        },
        {
            name: "key-only",
            aliases: ["ko", "k"],
            description: `Displays only the "command response key" returned from the z/OSMF console API. ` +
            `You can collect additional messages using the command key with  ` +
            `'${Constants.BINARY_NAME} zos-console collect sync-responses <key>'. ` +
            `Note that when using this option, you will not be presented ` +
            `with the "first set" of command response messages (if present in the API response). ` +
            `However, you can view them by using the --response-format-json option.`,
            type: "boolean",
        },
        {
            name: "return-first",
            aliases: ["rf", "r"],
            description: `Indicates that ${Constants.DISPLAY_NAME} should return immediately with the response ` +
            `message set returned in the first z/OSMF API request (even if no responses are present). ` +
            `Using this option may result in partial or no response, but quicker ${Constants.DISPLAY_NAME} ` +
            `command response time. The z/OSMF console API has an implicit wait when collecting ` +
            `the first set of console command responses, i.e you will normally receive at least one set of ` +
            `response messages.`,
            type: "boolean",
            conflictsWith: ["wait-to-collect"],
        },
        {
            name: "solicited-keyword",
            aliases: ["sk", "s"],
            description: "For solicited responses (direct command responses) the response is considered complete if " +
            "the keyword specified is present. If the keyword is detected, the command will immediately " +
            "return, meaning the full command response may not be provided. The key only applies to " +
            "the first request issued, follow up requests do not support searching for the keyword.",
            type: "string",
        },
        {
            name: "sysplex-system",
            aliases: ["ss", "sys"],
            description: `Specifies the z/OS system (LPAR) in the current SYSPLEX ` +
            `(where your target z/OSMF resides) to route the z/OS console command.`,
            type: "string",
        },
        {
            name: "wait-to-collect",
            aliases: ["wtc", "w"],
            description: `Indicates that ${Constants.DISPLAY_NAME} wait at least the specified number of seconds ` +
            `before attempting to collect additional solicited response messages. If additional messages ` +
            `are collected on "follow-up" requests, the timer is reset until an attempt is made that results ` +
            `in no additional response messages.`,
            type: "number",
            conflictsWith: ["return-first"],
        },
        {
            name: "follow-up-attempts",
            aliases: ["fua", "a"],
            description: "Number of request attempts if no response returned",
            type: "number",
            defaultValue: "1",
        },
    ],
    examples: [
        {
            description: "Issue a z/OS console command to display the IPL information for the system",
            options: "\"D IPLINFO\"",
        },
        {
            description: "Issue a z/OS console command to display the local and coordinated universal time and date",
            options: "\"D T\"",
        },
    ],
};
