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

import { ICommandOptionDefinition } from "@zowe/imperative";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).COPY.OPTIONS;

/**
 * Object containing all options to be used by the List data-set/member API
 */
export const CopyOptions: {[key: string]: ICommandOptionDefinition} = {
    /**
     * If aliases are to be copied too
     * @type {ICommandOptionDefinition}
     */
    alias: {
        name: "alias",
        aliases: ["al"],
        description: strings.ALIAS,
        type: "boolean",
        required: false
    },

    /**
     * The volume serial of the from data set
     * @type {ICommandOptionDefinition}
     */
    fromVolume: {
        name: "from-volume",
        aliases: ["fvol"],
        description: strings.FROMVOLUME,
        type: "string"
    },

    /**
     * The volume serial of the to data set
     * @type {ICommandOptionDefinition}
     */
    toVolume: {
        name: "to-volume",
        aliases: ["tvol"],
        description: strings.TOVOLUME,
        type: "string"
    },

    /**
     * If you want to replace data set member
     * @type {ICommandOptionDefinition}
     */
    replace: {
        name: "replace",
        aliases: ["r"],
        description: strings.REPLACE,
        type: "boolean",
        required: false
    },
};
