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

import { ICommandDefinition, ICommandOptionDefinition } from "@zowe/imperative";
import { join } from "path";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).COPY.ACTIONS.DATA_SET_CROSS_LPAR;

/**
 * This object defines the command for copy data-set within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @type {ICommandDefinition}
 */
export const DsclpDefinition: ICommandDefinition = {
    name: "data-set-cross-lpar",
    aliases: ["dsclp"],
    description: strings.DESCRIPTION,
    type: "command",
    handler: join(__dirname, "Dsclp.handler"),
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "fromDataSetName",
            type: "string",
            description: strings.POSITIONALS.FROMDSNAME,
            required: true
        },
        {
            name: "toDataSetName",
            type: "string",
            description: strings.POSITIONALS.TODSNAME,
            required: true
        }
    ],
    options: ([
        {
            name: "replace",
            aliases: ["rep"],
            description: strings.OPTIONS.REPLACE,
            type: "boolean"
        },
        {
            name: "target-host",
            aliases: ["th"],
            conflictsWith: [ "target-zosmf-profile"],
            description: strings.OPTIONS.TARGETHOST,
            type: "string"
        },
        {
            name: "target-port",
            aliases: ["tp"],
            description: strings.OPTIONS.TARGETPORT,
            type: "number"
        },
        {
            name: "target-user",
            aliases: ["tu"],
            description: strings.OPTIONS.TARGETUSER,
            type: "string"
        },
        {
            name: "target-password",
            aliases: ["tpw"],
            description: strings.OPTIONS.TARGETPASS,
            type: "string"
        },
        {
            name: "target-zosmf-profile",
            aliases: ["t-zosmf-p"],
            conflictsWith: [ "target-host"],
            description: strings.OPTIONS.TARGETPROFILE,
            type: "string"
        },
        {
            name: "target-volume-serial",
            aliases: ["tvs", "target-volser"],
            description: strings.OPTIONS.TARGETVOLSER,
            type: "string"
        },
        {
            name: "target-management-class",
            aliases: ["tmc"],
            description: strings.OPTIONS.TARGETMGTCLS,
            type: "string"
        },
        {
            name: "target-data-class",
            aliases: ["tdc"],
            description: strings.OPTIONS.TARGETDATACLS,
            type: "string"
        },
        {
            name: "target-storage-class",
            aliases: ["tsc"],
            description: strings.OPTIONS.TARGETSTGCLS,
            type: "string"
        },
        {
            name: "target-token-type",
            aliases: ["ttt"],
            description: strings.OPTIONS.TARGETTOKENTYPE,
            type: "string"
        },
        {
            name: "target-token-value",
            aliases: ["ttv"],
            description: strings.OPTIONS.TARGETTOKENVAL,
            type: "string"
        }
    ] as ICommandOptionDefinition[]).sort((a, b) =>
        a.name.localeCompare(b.name)
    ),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"USER.FROM.SET" "USER.TO.SET"`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"USER.FROM.SET(mem1)" "USER.TO.SET(mem2)"`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"USER.FROM.SET" "USER.TO.SET(mem2)"`
        },
        {
            description: strings.EXAMPLES.EX4,
            options: `"USER.FROM.SET(mem1)" "USER.TO.SET"`
        },
        {
            description: strings.EXAMPLES.EX5,
            options: `"USER.FROM.SET" "USER.TO.SET" --replace`
        }
    ]
};
