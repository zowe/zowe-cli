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

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DELETE.ACTIONS.MIGRATED_DATA_SET;

export const MdsDefinition: ICommandDefinition = {
    name: "migrated-data-set",
    aliases: ["mds"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Mds.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            type: "string",
            description: strings.POSITIONALS.DATASETNAME,
            required: true
        }
    ],
    options: [
        {
            name: "wait",
            aliases: ["w"],
            description: strings.OPTIONS.WAIT,
            type: "boolean",
            defaultValue: false,
            required: false
        },
        {
            name: "purge",
            aliases: ["p"],
            description: strings.OPTIONS.PURGE,
            type: "boolean",
            defaultValue: false,
            required: false
        }
    ],
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"USER.DATA.SET"`
        }
    ]
};
