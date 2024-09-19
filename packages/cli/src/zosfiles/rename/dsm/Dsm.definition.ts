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

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings);
const dsmStrings = strings.RENAME.ACTIONS.DATA_SET_MEMBER;

export const DsmDefinition: ICommandDefinition = {
    name: "data-set-member",
    aliases: ["dsm"],
    summary: dsmStrings.SUMMARY,
    description: dsmStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Dsm.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            type: "string",
            description: dsmStrings.POSITIONALS.DSNAME,
            required: true
        },
        {
            name: "beforeMemberName",
            type: "string",
            description: dsmStrings.POSITIONALS.BEFOREMEMBERNAME,
            required: true
        },
        {
            name: "afterMemberName",
            type: "string",
            description: dsmStrings.POSITIONALS.AFTERMEMBERNAME,
            required: true
        }
    ],
    examples: [
        {
            description: dsmStrings.EXAMPLES.EX1,
            options: '"USER.DATA.SET" "MEM1" "MEM2'
        }
    ]
};
