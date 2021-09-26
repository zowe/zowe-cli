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
import { Constants } from "../../../Constants";

export const LogsDefinition: ICommandDefinition = {
    name: "logs",
    aliases: ["logs"],
    summary: "List z/OS operlog or syslog within a time range",
    description:
        `List z/OS operlog or syslog within a time range.` +
        `\n\n` +
        `Use this operation to get the z/OS logs. It invokes z/OSMF REST API to retrieve logs.` +
        `\n\n` +
        `Executing '${Constants.BINARY_NAME} zos-logs list logs' will by default return logs from current time and backwards to 10 minutes before.`,
    type: "command",
    handler: __dirname + "/Logs.handler",
    profile: {
        optional: ["zosmf"]
    },
    options: [
        {
            name: "start-time",
            aliases: ["st"],
            description: `Specify the time in ISO-8601 time format from when z/OSMF will start to retrieve the logs. For example,\
             '2021-01-26T03:33:18.065Z', '2021-01-26T11:33:18.065+08:00'. Default is the current time.`,
            type: "string"
        },
        {
            name: "direction",
            aliases: ["d"],
            description: `Specify the direction when retrieving the message log. Either 'forward' or 'backward' is valid, case insensitive.`,
            type: "string",
            defaultValue: "backward",
            allowableValues: { values: ["forward", "backward"] }
        },
        {
            name: "range",
            aliases: ["r"],
            description: `Specify a time range in which the logs will be retrieved. The format is like nnnu, nnn is 1-999, u is one\
             of 's', 'm', 'h', for example, '999s', '20m', '3h'.`,
            type: "string",
            defaultValue: "10m"
        }
    ],
    examples: [
        {
            description: "List logs starting from '2021-07-26T03:38:37.098Z' and forwards to 5 minutes later",
            options: "--start-time 2021-07-26T03:38:37.098Z --range 5m --direction forward"
        },
        {
            description: "List logs starting from '2021-07-26T03:38:37.098Z' and forwards to 5 minutes later. Alias version of the above command",
            options: "--st 2021-07-26T03:38:37.098Z -r 5m -d forward"
        },
        {
            description: "List logs starting from '2021-07-26T03:38:37.098Z' and backwards to 5 minutes before",
            options: "--st 2021-07-26T03:38:37.098Z -r 5m"
        }
    ]
};
