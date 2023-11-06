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

import { ICommandDefinition } from "@zowe/core-for-zowe-sdk";
import { ActionDefinition } from "./action/Action.definition";


export const PerformCommand: ICommandDefinition = {
    name: "perform",
    aliases: ["perf"],
    type: "group",
    summary: "Perform instance actions.",
    description: "Perform actions against instances provisioned with z/OSMF.",
    children: [ActionDefinition]
};
