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

export const ReceiveASApp: ICommandDefinition = {
    name: "app",
    aliases: ["a"],
    summary: "Receive message from TSO address space app",
    description: "Receive message from TSO address space app,",
    type: "command",
    handler: __dirname + "/ReceiveASApp.handler",
    profile: {
        optional: ["zosmf", "tso"]
    },
    options: TsoProfileConstants.TSO_PROFILE_OPTIONS.concat([
        {
            name: "app-key",
            aliases: ["ak"],
            description: "App Key",
            type: "string",
            required: true
        },
        {
            name: "servlet-key",
            aliases: ["sk"],
            description: "Servlet Key",
            type: "string",
            required: true
        },
        {
            name: "receive-until-ready",
            aliases: ["rur"],
            description: "Receives data until keyword is received or timeout",
            type: "boolean",
            required: false,
            defaultValue: false
        }
    ] as ICommandOptionDefinition[]),
    examples: [],
};
