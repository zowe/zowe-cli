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
import { DatasetDefinition } from "./ds/Dataset.definition";
import { AllMembersDefinition } from "./am/AllMembers.definition";

import i18nTypings from "../-strings-/en";
import { UssFileDefinition } from "./uss/UssFile.definition";
import { DataSetMatchingDefinition } from "./dsm/DataSetMatching.definition";
import { UssDirDefinition } from "./ussdir/UssDir.definition";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).DOWNLOAD;

/**
 * Download group definition containing its description and children
 * @type {ICommandDefinition}
 */
export const DownloadDefinition: ICommandDefinition = {
    name: "download",
    aliases: ["dl"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        DatasetDefinition,
        AllMembersDefinition,
        UssFileDefinition,
        UssDirDefinition,
        DataSetMatchingDefinition
    ]
};
