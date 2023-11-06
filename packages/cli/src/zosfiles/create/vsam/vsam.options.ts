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

import { ICommandOptionDefinition } from "@zowe/core-for-zowe-sdk";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).CREATE.ACTIONS.VSAM.OPTIONS;

/**
 * Object containing all extra options to be used by the Create API
 */
export const VsamCreateOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The volumes on which to allocate a VSAM cluster
     * @type {ICommandOptionDefinition}
     */
    volumes: {
        name: "volumes",
        aliases: ["v"],
        description: strings.VOLUMES,
        type: "string"
    },

    /**
     * The number of days for which the VSAM cluster will be retained.
     * @type {ICommandOptionDefinition}
     */
    retainFor: {
        name: "retain-for",
        aliases: ["rf"],
        description: strings.RETAINFOR,
        type: "number",
        conflictsWith: ["retain-to"]
    },

    /**
     * The number of days for which the VSAM cluster will be retained.
     * @type {ICommandOptionDefinition}
     */
    retainTo: {
        name: "retain-to",
        aliases: ["rt"],
        description: strings.RETAINTO,
        type: "string",
        conflictsWith: ["retain-for"]
    }
};
