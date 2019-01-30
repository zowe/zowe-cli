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
import { WorkflowKey } from "./workflowkey/WorkflowKey.definition";


/**
 * This object defines the command for the delete group within workflows. This is not
 * something that is intended to be used outside of the workflows package.
 *
 * @private
 */
export const DeleteDefinition: ICommandDefinition = {
    name: "delete",
    aliases: ["del"],
    type: "group",
    description: "Delete workflow",
    children: [
        WorkflowKey
    ]
};
