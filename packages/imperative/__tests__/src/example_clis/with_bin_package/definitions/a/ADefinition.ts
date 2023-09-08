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
    name: "ape",
    type: "group",
    description: "Ape commands",
    children: [
        {
            name: "grape",
            type: "command",
            description: "An ape eats grapes",
            handler: "not_real",
            options: [
                {
                    name: "grape-color",
                    type: "string",
                    description: "the color of the grapes eaten by the ape"
                }
            ]
        }
    ]
};

module.exports = definition;
