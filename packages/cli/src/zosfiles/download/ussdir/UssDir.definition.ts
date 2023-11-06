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

import { ICommandDefinition } from "@zowe/core-for-zowe-sdk";
import { DownloadOptions } from "../Download.options";
import i18nTypings from "../../-strings-/en";
import { ListOptions } from "../../list/List.options";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DOWNLOAD.ACTIONS.USS_DIR;

/**
 * Download all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const UssDirDefinition: ICommandDefinition = {
    name: "uss-directory",
    aliases: ["uss-dir"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/UssDir.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "ussDirName",
            description: strings.POSITIONALS.USSDIRNAME,
            type: "string",
            required: true
        }
    ],
    options: [
        DownloadOptions.attributes,
        DownloadOptions.directoryUss,
        DownloadOptions.binary,
        DownloadOptions.encoding,
        DownloadOptions.maxConcurrentRequestsUss,
        DownloadOptions.failFastUss,
        DownloadOptions.includeHidden,
        DownloadOptions.overwrite,
        ListOptions.name,
        ListOptions.maxLength,
        ListOptions.group,
        ListOptions.owner,
        ListOptions.mtime,
        ListOptions.size,
        ListOptions.perm,
        ListOptions.type,
        ListOptions.depth,
        ListOptions.filesys,
        ListOptions.symlinks
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `/a/ibmuser --binary`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `/a/ibmuser --directory localDir`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `/a/ibmuser --name "*.log" --mtime -1`
        }
    ]
};
