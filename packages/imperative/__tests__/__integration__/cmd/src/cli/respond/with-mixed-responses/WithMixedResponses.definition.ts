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

import { ICommandDefinition } from "../../../../../../../lib/index";

export const withMixedResponesDefinition: ICommandDefinition = {
    name: "with-mixed-responses",
    description: "Responds with error, headers, messages, data, etc. (all handler response APIs, except progress)",
    summary: "Responds with error, headers, messages, etc",
    handler: __dirname + "/WithMixedResponses.handler",
    type: "command",
    options: [
        {
            name: "data-object",
            aliases: ["da"],
            description: "An well-formed JSON object to place in the command response.",
            type: "json",
            required: true
        },
        {
            name: "message-for-response",
            aliases: ["mfr"],
            description: "The message that will be placed in the output object.",
            type: "string",
            required: true
        },
        {
            name: "error-format-string",
            aliases: ["efs"],
            type: "string",
            required: true,
            description: "A format string that will be used to create a message",
        },
        {
            name: "error-format-values",
            aliases: ["efv"],
            type: "array",
            required: true,
            description: "The set of values to use in the format string.",
        },
        {
            name: "log-format-string",
            aliases: ["lfs"],
            type: "string",
            required: true,
            description: "A format string that will be used to create a message",
        },
        {
            name: "log-format-values",
            aliases: ["lfv"],
            type: "array",
            required: true,
            description: "The set of values to use in the format string.",
        }
    ]
};
