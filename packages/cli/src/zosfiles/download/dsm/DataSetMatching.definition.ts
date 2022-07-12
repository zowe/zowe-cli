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
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DOWNLOAD.ACTIONS.DATA_SETS_MATCHING;

/**
 * Download all members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const DataSetMatchingDefinition: ICommandDefinition = {
    name: "data-set-matching",
    aliases: ["dsm"],
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/DataSetMatching.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
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
        DownloadOptions.extensionMap,
        DownloadOptions.maxConcurrentRequests,
        DownloadOptions.preserveOriginalLetterCase,
        DownloadOptions.failFast
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"ibmuser.**.cntl, ibmuser.**.jcl" --directory jcl --extension .jcl`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"ibmuser.public.project.*, ibmuser.project.private.*" --exclude-patterns "ibmuser.public.**.*lib" ` +
            `--directory project --extension-map cpgm=c,asmpgm=asm,java=java,chdr=c,jcl=jcl,cntl=jcl`
        }
    ]
};
