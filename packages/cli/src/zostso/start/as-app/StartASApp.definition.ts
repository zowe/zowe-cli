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

export const StartASApp: ICommandDefinition = {
    name: "app",
    aliases: ["a"],
    summary: "Start application at TSO address space",
    description: "Start application at TSO address space,",
    type: "command",
    handler: __dirname + "/StartASApp.handler",
    profile: {
        optional: ["zosmf", "tso"]
    },
    options: TsoProfileConstants.TSO_PROFILE_OPTIONS.concat([
        {
            name: "app-key",
            aliases: ["ak"],
            description: "App key of application running at TSO address space, " +
            "this app key value should be referenced when sending or receiving messages from the application instance",
            type: "string",
            required: true
        },
        {
            name: "startup",
            aliases: ["sc"],
            description: "Command to be ran to start application at the TSO address space",
            type: "string",
            required: true
        },
        {
            name: "queue-id",
            aliases: ["qi"],
            description: "Queue ID of TSO address space",
            type: "string",
            implies: ["servlet-key"]
        },
        {
            name: "servlet-key",
            aliases: ["sk"],
            description: "Servlet Key of TSO address space",
            type: "string",
            implies: ["queue-id"]
        }
    ] as ICommandOptionDefinition[]),
    examples: [],
};
