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
import { DsDefinition } from "./ds/Ds.definition";
import { DsmDefinition } from "./dsm/Dsm.definition";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).RENAME;

/**
 * Rename group definition containing its description and children
 * @type {ICommandDefinition}
 */
export const RenameDefinition: ICommandDefinition = {
    name: "rename",
    aliases: [],
    type: "group",
    description: strings.DESCRIPTION,
    children: [
        DsDefinition,
        DsmDefinition
    ]
};
