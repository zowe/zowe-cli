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

import { ICommandDefinition } from "@zowe/imperative";

export const DeleteInstanceDefinition: ICommandDefinition = {
    name: "instance",
    aliases: ["i"],
    type: "command",
    summary: "Deletes instance.",
    description: "Deletes selected deprovisioned instance.",
    handler: __dirname + "/DeleteInstance.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "name",
            type: "string",
            description: "Deprovisioned Instance name.",
            required: true,
        }
    ],
    examples: [
        {
            description: `Delete deprovisioned instance "instance1"`,
            options: "instance1",
        }
    ]
};
