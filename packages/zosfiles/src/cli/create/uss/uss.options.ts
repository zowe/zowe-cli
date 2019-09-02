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

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).CREATE.ACTIONS.USS.OPTIONS;

/**
 * Specifies the file or directory permission bits to be used in creating the file or directory.
 */
export const UssCreateOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The user ID for owner of the ZFS root directory
     * @type {ICommandOptionDefinition}
     */
    type: {
        name: "type",
        aliases: ["t"],
        description: strings.TYPE,
        type: "string",
        required: true,
        allowableValues: {
            values : ["directory", "file"],
            caseSensitive: true
        },
    },
    /**
     * The user ID for owner of the ZFS root directory
     * @type {ICommandOptionDefinition}
     */
    mode: {
        name: "mode",
        aliases: ["m"],
        description: strings.MODE,
        type: "string",
        // tslint:disable-next-line: no-magic-numbers
        stringLengthRange: [9, 9]
    }
};
