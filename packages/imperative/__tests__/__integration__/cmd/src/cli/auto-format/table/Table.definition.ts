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

import { ICommandDefinition } from "../../../../../../../lib";


export const TableDefinition: ICommandDefinition = {
    name: "table",
    description: "Format a table",
    type: "command",
    handler: __dirname + "/Table.handler",
    outputFormatOptions: true
};
