/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandDefinition } from "@brightside/imperative";
import { SyncResponseCommandDefinition } from "./response/Response.definition";

export const CollectCommand: ICommandDefinition = {
    name: "collect",
    type: "group",
    summary: "Collect z/OS console command responses",
    description: "z/OSMF console services provides a command response key upon successful issue of a console command. " +
    "You can use this key to collect additional console message responses.",
    children: [
        SyncResponseCommandDefinition,
    ],
};
