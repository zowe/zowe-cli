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
import { ReceiveASApp } from "./app/ReceiveASApp.definition";

export const ReceiveCommand: ICommandDefinition = {
    name: "receive",
    aliases: ["r"],
    type: "group",
    summary: "Receive message from TSO address space app",
    description: "Receive message from TSO address space app",
    children: [
        ReceiveASApp
    ],
};
