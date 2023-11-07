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

export const ObjectDefinition: ICommandDefinition = {
    name: "object",
    description: "Returns an object.",
    summary: "Returns an object",
    type: "command",
    handler: __dirname + "/Object.handler",
    outputFormatOptions: true
};
