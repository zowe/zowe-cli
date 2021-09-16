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
import { ListDefinition } from "./list/List.definition";

export const definition: ICommandDefinition = {
    name: "zos-logs",
    aliases: ["zoslogs"],
    type: "group",
    summary: "Inteact with z/OS logs",
    description: "Interact with z/OS logs" + "\n\n",
    children: [ListDefinition]
};

module.exports = definition;
