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
import { CreateDefaults } from "../../../api/methods/create";
import { UssCreateOptions } from "./uss.options";
import { ZosFilesConstants } from "../../../api";
import { ZosFilesCreateExtraOptions, ZosFilesCreateOptions } from "../Create.options";

import i18nTypings from "../../-strings-/en";
import { ZosmfSession } from "../../../../../zosmf";

// Does not use the import in anticipation of some internationalization work to be done later.
const fileStrings = (require("../../-strings-/en").default as typeof i18nTypings);
const ussStrings = fileStrings.CREATE.ACTIONS.USS;

export const UssDefinition: ICommandDefinition = {
    name: "uss-file",
    aliases: ["uss"],
    summary: ussStrings.SUMMARY,
    description: ussStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/uss.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "ussPath",
            type: "string",
            description: ussStrings.POSITIONALS.PATH,
            required: true,
        },
    ],
    options: [
        UssCreateOptions.type,
        UssCreateOptions.mode
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: ussStrings.EXAMPLES.DEFAULT_VALUES,
            options: "HLQ.MYNEW.ZFS"
        },
        {
            description: ussStrings.EXAMPLES.SPECIFY_CYLS,
            options: "HLQ.MYNEW.ZFS --cp 100 --cs 10"
        },
        {
            description: ussStrings.EXAMPLES.SPECIFY_VOLUMES,
            options: "HLQ.MYNEW.ZFS -v ZFS001 ZFS002"
        }
    ]
};
