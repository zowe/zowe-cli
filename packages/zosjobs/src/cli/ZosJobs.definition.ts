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
import { SubmitDefinition } from "./submit/Submit.definition";
import { ViewDefinition } from "./view/View.definition";
import { ListDefinition } from "./list/List.definition";

export const definition: ICommandDefinition = {
    name: "zos-jobs",
    aliases: ["jobs"],
    type: "group",
    summary: "Manage z/OS jobs",
    description: "Manage z/OS jobs.",
    children: [
        SubmitDefinition,
        ViewDefinition,
        ListDefinition,
    ]
};

module.exports = definition;
