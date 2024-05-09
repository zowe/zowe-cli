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
import { FirstGroupCommandOneDefinition } from "./first-group-command-one/FirstGroupCommandOne.definition";
import { FirstGroupCommandTwoDefinition } from "./first-group-command-two/FirstGroupCommandTwo.definition";
import { SecondGroupDefinition } from "./second-group/SecondGroup.definition";
import { ThirdGroupDefinition } from "./third-group/ThirdGroup.definition";

export const FirstGroupDefinition: ICommandDefinition = {
    name: "first-group",
    aliases: ["fg"],
    description: "The first group under nested",
    type: "group",
    children: [FirstGroupCommandOneDefinition,
        FirstGroupCommandTwoDefinition,
        SecondGroupDefinition,
        ThirdGroupDefinition]
};

