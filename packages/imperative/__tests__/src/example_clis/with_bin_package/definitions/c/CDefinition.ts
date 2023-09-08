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
    name: "cat",
    type: "group",
    description: "Cat commands",
    children: [
        {
            name: "splat",
            type: "command",
            description: "A cat eats splats",
            options: [
                {
                    name: "splat-color",
                    type: "string",
                    description: "the color of the splat eaten by the cat"
                }
            ]
        }
    ]
};
module.exports = definition;
