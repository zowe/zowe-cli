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
import { DeleteInstanceDefinition } from "./instance/DeleteInstance.definition";


export const DeleteCommand: ICommandDefinition = {
    name: "delete",
    aliases: ["del"],
    type: "group",
    summary: "Delete instance",
    description: "Deletes instance previously provisioned with z/OSMF cloud provisioning services.",
    children: [DeleteInstanceDefinition]
};
