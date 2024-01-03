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
import { StatusDefinition } from "./status/Status.definition";

export const CheckCommand: ICommandDefinition = {
    name: "check",
    type: "group",
    summary: "Check z/OSMF status on a specified system",
    description: "Confirm that z/OSMF is running on a specified system " +
        "and gather information about the z/OSMF server for diagnostic purposes.",
    children: [
        StatusDefinition
    ]
};
