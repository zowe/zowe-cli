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
const strings = (require("../../-strings-/en").default as typeof i18nTypings).SEARCH;
const dataSetStrings = strings.ACTIONS.DS;

/**
 * List all data sets and members command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const DataSetsDefinition: ICommandDefinition = {
    name: "data-sets",
    aliases: ["ds"],
    summary: dataSetStrings.SUMMARY,
    description: dataSetStrings.DESCRIPTION,
    type: "command",
    handler: __dirname + "/DataSets.handler",
    profile: {
        optional: ["zosmf"]
    },
    positionals: [
        {
            name: "dataSetName",
            description: dataSetStrings.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        },
        {
            name: "searchString",
            description: strings.OPTIONS.SEARCHSTRING,
            type: "string",
            required: true
        }
    ],
    options: [
        {
            name: "caseSensitive",
            aliases: ["cs"],
            description: dataSetStrings.OPTIONS.CASESENSITIVE,
            type: "boolean",
            defaultValue: false
        },
        {
            name: "mainframeSearch",
            aliases: ["ms"],
            description: dataSetStrings.OPTIONS.MAINFRAMESEARCH,
            type: "boolean",
            defaultValue: false
        },
        {
            name: "threads",
            aliases: ["th"],
            description: dataSetStrings.OPTIONS.THREADS,
            type: "number"
        },
        {
            name: "timeout",
            aliases: ["to"],
            description: dataSetStrings.OPTIONS.TIMEOUT,
            type: "number"
        }
    ],
    examples: [
        {
            description: dataSetStrings.EXAMPLES.EX1.DESCRIPTION,
            options: dataSetStrings.EXAMPLES.EX1.OPTIONS
        },
        {
            description: dataSetStrings.EXAMPLES.EX2.DESCRIPTION,
            options: dataSetStrings.EXAMPLES.EX2.OPTIONS
        },
        {
            description: dataSetStrings.EXAMPLES.EX3.DESCRIPTION,
            options: dataSetStrings.EXAMPLES.EX3.OPTIONS
        },
        {
            description: dataSetStrings.EXAMPLES.EX4.DESCRIPTION,
            options: dataSetStrings.EXAMPLES.EX4.OPTIONS
        }
    ]
};
