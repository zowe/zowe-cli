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
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DOWNLOAD.ACTIONS.ALL_MEMBERS;

/**
 * Download all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const AllMembersDefinition: ICommandDefinition = {
    name: "all-members",
    aliases: ["am"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/AllMembers.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            description: strings.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        }
    ],
    options: [
        DownloadOptions.volume,
        DownloadOptions.directory,
        DownloadOptions.binary,
        DownloadOptions.extension,
        DownloadOptions.maxConcurrentRequests,
        DownloadOptions.preserveOriginalLetterCase
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.loadlib" -b -d loadlib`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.cntl" -d jcl`
        }
    ]
};
