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
    name: "dog",
    type: "group",
    description: "Dog commands",
    children: [
        {
            name: "log",
            type: "command",
            description: "A dog eats logs",
            options: [
                {
                    name: "log-color",
                    type: "string",
                    description: "the color of the log eaten by the dog"
                }
            ]
        }
    ]
};
module.exports = definition;
