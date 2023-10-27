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
import { NoHandlerDefinition } from "./no-handler/NoHandler.definition";
import { InvalidHandlerDefinition } from "./invalid-handler/InvalidHandler.definition";
import { ProfileSpecDefinition } from "./profile-spec/ProfileSpec.definition";

export const definition: ICommandDefinition = {
    name: "invalid",
    description: "Attempt to invoke commands that have poorly coded definitions.",
    summary: "Invalid definitions",
    type: "group",
    children: [NoHandlerDefinition, InvalidHandlerDefinition,
        ProfileSpecDefinition]
};

module.exports = definition;
