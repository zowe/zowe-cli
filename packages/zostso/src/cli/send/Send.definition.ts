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
import {
    SendToAddressSpaceCommandDefinition
} from "./address_space/SendToAddressSpace.definition";

export const SendCommand: ICommandDefinition = {
    name: "send",
    aliases: [],
    type: "group",
    summary: "Send data to TSO",
    description: "Send data to TSO and collect responses until the prompt is reached",
    children: [
        SendToAddressSpaceCommandDefinition,
    ],
};
