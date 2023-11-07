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

import { ICommandDefinition } from "../../../../../../../src/cmd";

const definition: ICommandDefinition = {
    name: "do-not-include-this",
    type: "group",
    description: "These commands should not match the glob and thus should not be defined",
    children: [
        {
            name: "or-this",
            type: "command",
            description: "Don't include this either",
            options: [
                {
                    name: "this-color",
                    type: "string",
                    description: "the color of the this that you shouldn't include"
                }
            ]
        }
    ]
};
module.exports = definition;
