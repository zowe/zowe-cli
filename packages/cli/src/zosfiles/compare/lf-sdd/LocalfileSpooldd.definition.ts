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
 * Compare local-file-spool-dd command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const LocalfileSpoolddDefinition: ICommandDefinition = {
    name: "local-file-spool-dd",
    aliases: ["lf-sdd"],
    summary: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.SUMMARY,
    description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.DESCRIPTION,
    type: "command",
    handler: __dirname + "/LocalfileSpooldd.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "localFilePath",
            description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.POSITIONALS.LOCALFILEPATH,
            type: "string",
            required: true
        },
        {
            name: "spoolDescription",
            type: "string",
            description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.POSITIONALS.SPOOLDDDESCRIPTION,
            required: true
        }
    ],
    options: [
        CompareOptions.seqnum,
        CompareOptions.contextLines,
        CompareOptions.browserView
    ],
    examples: [
        {
            description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.EXAMPLES.EX1,
            options: `"./a.txt" "jobName:jobId:spoolId"`
        },
        {
            description: strings.ACTIONS.LOCAL_FILE_SPOOL_DD.EXAMPLES.EX2,
            options: `"./a.txt" "jobName:jobId:spoolId" --no-seqnum`
        }
    ]
};
