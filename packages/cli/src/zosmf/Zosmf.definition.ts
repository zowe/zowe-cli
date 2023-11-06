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
import { CheckCommand } from "./check/Check.definition";
import { ListCommand } from "./list/List.definition";

const definition: ICommandDefinition = {
    name: "zosmf",
    type: "group",
    summary: "Interact with z/OSMF",
    description: "Retrieve and show the properties of a z/OSMF web server.",
    children: [
        CheckCommand,
        ListCommand
    ]
};

export = definition;
