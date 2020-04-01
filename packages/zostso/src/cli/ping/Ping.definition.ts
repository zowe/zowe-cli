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
import { PingAddressSpaceCommandDefinition } from "./address_space/PingAddressSpace.definition";

export const PingCommand: ICommandDefinition = {
    name: "ping",
    aliases: [],
    type: "group",
    summary: "Ping a TSO address space",
    description: "Ping a TSO address space, from which " +
    "you previously started and received a token (a.k.a 'servelet-key').",
    children: [
        PingAddressSpaceCommandDefinition
    ]
};
