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

import { ICommandDefinition } from "../../../../../../packages/cmd";

const definition: ICommandDefinition = {
    name: "bat",
    type: "group",
    description: "Bat commands",
    children: [
        {
            name: "rat",
            type: "command",
            description: "A bat eats rats",
            options: [
                {
                    name: "rat-color",
                    type: "string",
                    description: "the color of the rat eaten by the bat"
                }
            ]
        }
    ]
};
module.exports = definition;
