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
const strings = (require("../../-strings-/en").default as typeof i18nTypings).CREATE.ACTIONS.ZFS.OPTIONS;

/**
 * Object containing all extra options to be used by the Create API
 */
export const ZfsCreateOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The user ID for owner of the ZFS root directory
     * @type {ICommandOptionDefinition}
     */
    owner: {
        name: "owner",
        aliases: ["o"],
        description: strings.OWNER,
        type: "string"
    },

    /**
     * The group ID for the ZFS root directory
     * @type {ICommandOptionDefinition}
     */
    group: {
        name: "group",
        aliases: ["g"],
        description: strings.GROUP,
        type: "string"
    },

    /**
     * The permissions code for the ZFS root directory
     * @type {ICommandOptionDefinition}
     */
    perms: {
        name: "perms",
        aliases: ["p"],
        description: strings.PERMS,
        type: "number",
        defaultValue: 755
    },

    /**
     * The number of primary cylinders to allocate for the ZFS
     * @type {ICommandOptionDefinition}
     */
    cylsPri: {
        name: "cyls-pri",
        aliases: ["cp"],
        description: strings.CYLS_PRI,
        type: "number",
        defaultValue: 10
    },

    /**
     * The number of secondary cylinders to allocate for the ZFS
     * @type {ICommandOptionDefinition}
     */
    cylsSec: {
        name: "cyls-sec",
        aliases: ["cs"],
        description: strings.CYLS_SEC,
        type: "number",
        defaultValue: 2
    },

    /**
     * The volumes on which to create the ZFS
     * @type {ICommandOptionDefinition}
     */
    volumes: {
        name: "volumes",
        aliases: ["v"],
        description: strings.VOLUMES,
        type: "array"
    },

    /**
     * The number of seconds to wait for the create command to complete
     * @type {ICommandOptionDefinition}
     */
    timeout: {
        name: "timeout",
        aliases: ["t"],
        description: strings.TIMEOUT,
        type: "number",
        defaultValue: 20
    }
};
