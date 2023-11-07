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

import { ICommandDefinition } from "../../../../../../lib";
import { CmdOutputDefinition } from "./cmd-output/CmdOutput.definition";
import { ObjectDefinition } from "./object/Object.definition";
import { TableDefinition } from "./table/Table.definition";

export const definition: ICommandDefinition = {
    name: "auto-format",
    description: "The invoke commands with handlers that pass back data to auto-format/print.",
    summary: "Invoke handlers to test auto-format",
    type: "group",
    children: [ObjectDefinition,
        CmdOutputDefinition,
        TableDefinition]
};

module.exports = definition;
