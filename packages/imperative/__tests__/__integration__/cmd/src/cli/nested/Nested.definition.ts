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

import { ICommandDefinition } from "../../../../../../lib/index";
import { FirstGroupDefinition } from "./first-group/FirstGroup.definition";
import { NestedGroupCommandDefinition } from "./nested-group-command/NestedGroupCommand.definition";

export const definition: ICommandDefinition = {
    name: "nested",
    description: "Test a more complex command structure of nested commands",
    summary: "Test a complex structure",
    type: "group",
    children: [FirstGroupDefinition,
        NestedGroupCommandDefinition]
};

module.exports = definition;
