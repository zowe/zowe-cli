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

export const profileMappingPositionalCommand: ICommandDefinition = {
    name: "mapping-positional", aliases: ["mp"],
    description: "Tests Imperative's profile to CLI mapping capabilities.",
    type: "command",
    handler: __dirname + "/ProfileMapping.handler",
    positionals:
        [
            {
                name: "color",
                description: "The color of the banana.",
                type: "string",
                required: true,
            },
            {
                name: "bananaDescription",
                description: "A description of the banana",
                type: "string",
                required: true
            },
            {
                name: "moldType",
                description: "The type of mold on the banana if any",
                type: "string",
                required: true
            }
        ],
    profile: {optional: ["banana"]}
};
