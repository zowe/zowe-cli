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
import * as path from "path";

export const instanceVariables: ICommandDefinition = {
    name: "instance-variables",
    aliases: ["iv"],
    type: "command",
    summary: "List Instance Variables and Values",
    description: "List a set of variables and their values for a given name.",
    handler: path.join(__dirname, "/InstanceVariables.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "name",
            type: "string",
            description: "Provisioned Instance Name",
            required: true
        }
    ],
    examples: [
        {
            description: "List instance variables of \"instance1\"",
            options: "instance1"
        }
    ],
    outputFormatOptions: true
};
