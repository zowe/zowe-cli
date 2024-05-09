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

import { ICommandDefinition } from "../../../../../../../lib/index";

export const exit143Definition: ICommandDefinition = {
    name: "exit-143",
    description: "Test handler that exits with status code 143",
    summary: "Test handler that exits with status code 143",
    type: "command",
    handler: __dirname + "/Exit143.handler",
    options: [
    ],
};
