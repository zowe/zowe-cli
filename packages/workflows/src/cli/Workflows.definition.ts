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

import { ICommandDefinition } from "@brightside/imperative";
import { DeleteDefinition } from "./delete/Delete.definition";
import { CreateDefinition } from "./create/Create.definition";
import { ZosmfSession } from "../../../zosmf";
import { ListDefinition } from "./list/List.definition";


/**
 * This object defines the top level command group for zosworkflows. This is not
 * something that is intended to be used outside of this npm package.
 *
 * @private
 */
const definition: ICommandDefinition = {
    name: "zos-workflows",
    aliases: ["wf"],
    type: "group",
    summary: "Manage z/OSMF workflows",
    description: "Manage z/OSMF workflows, create workflow instances, and more",
    children: [
        CreateDefinition,
        DeleteDefinition,
        ListDefinition
    ],
    passOn: [
        {
            property: "options",
            value: ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
            merge: true,
            ignoreNodes: [
                {type: "group"}
            ]
        }
    ]
};

export = definition;
