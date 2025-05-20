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

import { ICommandDefinition } from "npm:@zowe/imperative";

export const RestartCommand: ICommandDefinition = {
    name: "restart",
    summary: "Restart the Zowe CLI daemon",
    description: "Restart the Zowe CLI daemon.",
    type: "command",
    handler: __dirname + "/Restart.handler",
    examples: [
        {
            description: "Restart daemon",
            options: ""
        }
    ]
};
