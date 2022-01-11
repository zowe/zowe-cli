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

import { ICommandDefinition } from "@zowe/imperative";
import { EnableCommand } from "./enable/Enable.definition";
import { DisableCommand } from "./disable/Disable.definition";

const definition: ICommandDefinition = {
    name: "daemon",
    type: "group",
    summary: "Daemon operations",
    description: "Perform operations that control the daemon-mode functionality of the Zowe CLI. " +
                 "Daemon-mode runs the CLI command processor as a daemon to improve performance.",
    children: [
        EnableCommand,
        DisableCommand
    ]
};

export = definition;
