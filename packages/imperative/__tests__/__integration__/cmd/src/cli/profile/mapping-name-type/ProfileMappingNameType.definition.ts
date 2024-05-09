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

export const profileMappingCommandNameType: ICommandDefinition = {
    name: "mapping-name-type",
    description: "Tests that --type and --name are not filled in from profiles.",
    type: "command",
    handler: __dirname + "/ProfileMappingNameType.handler",
    options:
        [
            {
                name: "type",
                aliases: ["t"],
                description: "The type of the banana.",
                type: "string"
            },
        ],
    positionals: [
        {
            name: "name",
            description: "the name of the banana",
            type: "string"
        }
    ],
    profile: {optional: ["banana"]}
};
