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
import { LoggingDefinition } from "./logging/Logging.definition";
import { ConfigAutoStoreCommand } from "./config-auto-store/Config.definition";
import { MaskingDefinition } from "./masking/Masking.definition";
import { ConfigOverrideCommand } from "./config-override/Config.definition";

export const definition: ICommandDefinition = {
    name: "test",
    description: "Test that various imperative features are working",
    summary: "Test imperative features",
    type: "group",
    children: [
        LoggingDefinition,
        ConfigAutoStoreCommand,
        ConfigOverrideCommand,
        MaskingDefinition,
    ]
};

module.exports = definition;
