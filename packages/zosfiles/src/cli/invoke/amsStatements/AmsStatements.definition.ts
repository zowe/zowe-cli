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
import { join } from "path";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).INVOKE.ACTIONS.AMS;

/**
 * AMS command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const AmsStatementsDefinition: ICommandDefinition = {
    name: "ams-statements",
    aliases: ["as"],
    summary: strings.STATEMENTS_CMD.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: join(__dirname, "AmsStatements.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "controlStatements",
            description: strings.STATEMENTS_CMD.POSITIONAL,
            type: "string",
            required: true
        }
    ],
    examples: [
        {
            description: strings.STATEMENTS_CMD.EXAMPLES.EX1,
            options: `"DEFINE CLUSTER ( NAME (DUMMY.VSAM.CLUSTER) CYL(1 1))"`
        },
        {
            description: strings.STATEMENTS_CMD.EXAMPLES.EX2,
            options: `"DELETE DUMMY.VSAM.CLUSTER CLUSTER"`
        }
    ]
};
