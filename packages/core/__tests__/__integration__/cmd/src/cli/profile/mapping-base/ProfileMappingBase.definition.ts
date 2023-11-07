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

export const profileMappingBaseCommand: ICommandDefinition = {
    name: "mapping-base",
    description: "Tests handling of options across base and service profiles.",
    type: "command",
    handler: __dirname + "/ProfileMappingBase.handler",
    options:
        [
            {
                name: "amount",
                aliases: ["a"],
                description: "The amount of the fruit.",
                type: "number",
                required: true
            },
            {
                name: "price",
                aliases: ["p"],
                description: "The price of one fruit.",
                type: "number"
            },
        ],
    profile: {optional: ["kiwi"]}
};
