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

export const testHandlerDefinition: ICommandDefinition = {
    name: "test-handler",
    description: "Test handler that returns a promise. Tests rejecting and fulfilling the promise via the methods.",
    summary: "Test handler with promise",
    type: "command",
    handler: __dirname + "/TestHandler.handler",
    options: [
        {
            name: "fail",
            type: "boolean",
            description: "Fail the handler by invoking the reject method.",
        },
        {
            name: "fail-with-message",
            type: "string",
            description: "Fail the handler by invoking the reject method with a message."
        },
        {
            name: "fail-with-error",
            type: "boolean",
            description: "Fail the handler by throwning a generic 'Error'.",
        },
        {
            name: "fail-with-imperative-error",
            type: "boolean",
            description: "Fail the handler by throwning an 'Imperative Error'.",
        },
        {
            name: "fulfill-promise",
            type: "boolean",
            description: "Fail the handler by throwning an 'Imperative Error'.",
        }
    ],
    onlyOneOf: ["fail", "fail-with-error", "fail-with-imperative-error", "fulfill-promise"]
};
