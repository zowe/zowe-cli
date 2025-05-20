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

import { ICommandDefinition, ICommandOptionDefinition } from "npm:@zowe/imperative";
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
            description: "App key of application running at TSO address space, app key should be the value established when app instance was started",
            type: "string",
            required: true
        },
        {
            name: "servlet-key",
            aliases: ["sk"],
            description: "Servlet Key of TSO address space",
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
        },
        {
            name: "timeout",
            aliases: ["t"],
            description: "Timeout length in seconds, all data at the time of timeout will be returned to user",
            type: "number",
            required: false,
            defaultValue: 600
        }
    ] as ICommandOptionDefinition[]),
    examples: [],
};
