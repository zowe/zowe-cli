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

export const withDataObject: ICommandDefinition = {
    name: "with-data-object",
    description: "Formulates a JSON object to pass back when response format JSON is specified.",
    summary: "Responds with a JSON object",
    type: "command",
    handler: __dirname + "/WithDataObject.handler",
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
        }
    ]
};
