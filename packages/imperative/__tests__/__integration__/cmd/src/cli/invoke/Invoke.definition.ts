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

import { ICommandDefinition } from "../../../../../../lib/index";
import { TestAsyncHandlerDefinition } from "./test-async-handler/TestAsyncHandler.definition";
import { testHandlerDefinition } from "./test-handler/TestHandler.definition";
import { UnexpectedExceptionHandlerDefinition } from "./unexpected-exception-handler/UnexpectedExceptionHandler.definition";
import { exit143Definition } from "./exit-143/Exit143.definition";

export const definition: ICommandDefinition = {
    name: "invoke",
    description: "The invoke command allows you to invoke handlers and other test commands.",
    summary: "Invoke handlers to test promise reject/fulfill",
    type: "group",
    children: [TestAsyncHandlerDefinition,
        testHandlerDefinition,
        UnexpectedExceptionHandlerDefinition,
        exit143Definition
    ]
};

module.exports = definition;
