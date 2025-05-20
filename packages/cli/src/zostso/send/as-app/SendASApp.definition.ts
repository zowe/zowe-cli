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

export const SendASApp: ICommandDefinition = {
    name: "app",
    aliases: ["a"],
    summary: "Send message to an application at a TSO address space",
    description: "Send message to an application at a TSO address space,",
    type: "command",
    handler: __dirname + "/SendASApp.handler",
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
            name: "message",
            aliases: ["m"],
            description: "Message payload to be sent to the TSO address space application",
            type: "string",
            required: true
        }
    ] as ICommandOptionDefinition[]),
    examples: [],
};
