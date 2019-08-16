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
import { AllMembersDefinition } from "./am/AllMembers.definition";
import { DataSetDefinition } from "./ds/DataSet.definition";
import { USSFileDefinition } from "./uss/UssFile.definition";
import { ZfsDefinition } from "./zfs/Zfs.definition";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).LIST;

/**
 * Download group definition containing its description and children
 * @type {ICommandDefinition}
 */
export const ListDefinition: ICommandDefinition = {
    name: "list",
    aliases: ["ls"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        AllMembersDefinition,
        DataSetDefinition,
        USSFileDefinition,
        ZfsDefinition
    ],
};
