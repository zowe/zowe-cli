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
import { AddressSpaceDefinition } from "./address-space/AddressSpace.definition";

export const StartCommand: ICommandDefinition = {
    name: "start",
    aliases: ["st"],
    type: "group",
    summary: "Start TSO/E address space",
    description: "Start TSO/E address space",
    children: [
        AddressSpaceDefinition,
    ]
};
