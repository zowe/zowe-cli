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

export const withDataArray: ICommandDefinition = {
    name: "with-data-array",
    description: "Formulates a string array object to pass back when response format JSON is specified.",
    summary: "Responds with a string array",
    type: "command",
    handler: __dirname + "/WithDataArray.handler",
    options: [
        {
            name: "strings-for-array",
            aliases: ["sfa"],
            description: "An array of space delimited strings that will be placed in the output object array.",
            type: "array",
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
