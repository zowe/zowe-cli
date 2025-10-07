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
import { DownloadOptions } from "../Download.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DOWNLOAD.ACTIONS.ALL_MEMBERS_MATCHING;

/**
 * Download all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const AllMembersMatchingDefinition: ICommandDefinition = {
    name: "all-members-matching",
    aliases: ["amm", "all-members-matching"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/AllMembersMatching.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            description: strings.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        },
        {
            name: "pattern",
            description: strings.POSITIONALS.PATTERN,
            type: "string",
            required: true
        }
    ],
    options: [
        DownloadOptions.volume,
        DownloadOptions.directory,
        DownloadOptions.binary,
        DownloadOptions.record,
        DownloadOptions.encoding,
        DownloadOptions.extension,
        DownloadOptions.excludePattern,
        DownloadOptions.maxConcurrentRequests,
        DownloadOptions.preserveOriginalLetterCase,
        DownloadOptions.failFast,
        DownloadOptions.overwrite
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.loadlib" "Test*" --directory loadlib`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.cntl" "test*,M*" --exclude-patterns "M2*" --directory output`
        }
    ]
};
