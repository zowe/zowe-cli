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
import i18nTypings from "../-strings-/en";
import { DsDefinition } from "./ds/Ds.definition";
import { DsclpDefinition } from "./dsclp/Dsclp.definition";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).COPY;

/**
 * This object defines the command for the copy group within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
export const CopyDefinition: ICommandDefinition = {
    name: "copy",
    aliases: ["cp"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        DsDefinition,
        DsclpDefinition
    ]
};
