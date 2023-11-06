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

import { ICommandDefinition } from "../../../../../../../../lib/index";
import { ThirdGroupCommandOneDefinition } from "./third-group-command/third-group-command-one/ThirdGroupCommandOne.definition";

export const ThirdGroupDefinition: ICommandDefinition = {
    name: "third-group",
    aliases: ["tg"],
    description: "The third group under nested",
    type: "group",
    children: [ThirdGroupCommandOneDefinition]
};

