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

import { ICommandOptionAllowableValues, ICommandOptionDefinition } from "@zowe/imperative";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).MOUNT.ACTIONS.FS.OPTIONS;

/**
 * Object containing all extra options to be used by the Mount API
 */
export const FsMountOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The file system type to mount
     * @type {ICommandOptionDefinition}
     */
    fsType: {
        name: "fs-type",
        aliases: ["ft"],
        description: strings.FSTYPE,
        type: "string",
        defaultValue: "ZFS"
    },

    /**
     * The read/write mode for the file system
     * @type {ICommandOptionDefinition}
     */
    mode: {
        name: "mode",
        aliases: ["m"],
        description: strings.MODE,
        type: "string",
        defaultValue: "rdonly",
        allowableValues: {
            values: ["rdonly", "rdwr"],
            caseSensitive: true
        }
    }
};
