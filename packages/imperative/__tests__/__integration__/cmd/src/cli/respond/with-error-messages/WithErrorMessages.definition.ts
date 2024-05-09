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

export const withErrorMessagesDefinition: ICommandDefinition = {
    name: "with-error-messages",
    description: "Reponds with a few error messages.",
    summary: "Responds with error messages to the terminal/console",
    type: "command",
    handler: __dirname + "/WithErrorMessages.handler",
    options: [
        {
            name: "format-string",
            type: "string",
            required: true,
            description: "A format string that will be used to create a message",
            implies: ["format-values"]
        },
        {
            name: "format-values",
            type: "array",
            required: true,
            description: "The set of values to use in the format string.",
            implies: ["format-string"]
        }
    ]
};
