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

export const InvalidHandlerDefinition: ICommandDefinition = {
    name: "invalid-handler",
    description: "Test async handler command tests tests a fulfill/reject from an asynchronous handler.",
    summary: "Test basic async command handler completion",
    type: "command",
    handler: "invalid-handler"
};
