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
import { CompareOptions } from "../Compare.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).COMPARE;

/**
 * Compare spool-dds command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const SpoolddDefinition: ICommandDefinition = {
    name: "spool-dd",
    aliases: ["sdd"],
    summary: strings.ACTIONS.SPOOL_DD.SUMMARY,
    description: strings.ACTIONS.SPOOL_DD.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Spooldd.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "spoolDescription1",
            description: strings.ACTIONS.SPOOL_DD.POSITIONALS.SPOOLDDDESCRIPTION1,
            type: "string",
            required: true
        },
        {
            name: "spoolDescription2",
            type: "string",
            description: strings.ACTIONS.SPOOL_DD.POSITIONALS.SPOOLDDDESCRIPTION2,
            required: true
        }
    ],
    options: [
        CompareOptions.contextLines,
        CompareOptions.browserView
    ],
    examples: [
        {
            description: strings.ACTIONS.SPOOL_DD.EXAMPLES.EX1,
            options: `"jobName1:jobId1:spoolId1" "jobName2:jobId2:spoolId2"`
        },
        {
            description: strings.ACTIONS.SPOOL_DD.EXAMPLES.EX2,
            options: `"jobName1:jobId1:spoolId1" "jobName2:jobId2:spoolId2" --no-seqnum`
        }
    ]
};
