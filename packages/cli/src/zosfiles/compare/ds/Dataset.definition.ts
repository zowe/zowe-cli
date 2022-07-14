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

import {ICommandDefinition} from "@zowe/imperative";
import { CompareOptions } from "../Compare.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).COMPARE;

/**
 * Compare data sets command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const DatasetDefinition: ICommandDefinition = {
    name: "data-set",
    aliases: ["ds"],
    summary: strings.ACTIONS.DATA_SET.SUMMARY,
    description: strings.ACTIONS.DATA_SET.DESCRIPTION,
    type: "command",
    handler: __dirname + "/Dataset.handler",
    profile: {
        optional: ["zosmf"],
    },
    positionals: [
        {
            name: "dataSetName1",
            description: strings.ACTIONS.DATA_SET.POSITIONALS.DATASETNAME1,
            type: "string",
            required: true
        },
        {
            name: "dataSetName2",
            type: "string",
            description: strings.ACTIONS.DATA_SET.POSITIONALS.DATASETNAME2,
            required: true
        }
    ],
    options: [
        CompareOptions.binary,
        CompareOptions.binary2,
        CompareOptions.encoding,
        CompareOptions.encoding2,
        CompareOptions.record,
        CompareOptions.record2,
        CompareOptions.volume,
        CompareOptions.volume2,
        CompareOptions.seqnum,
        CompareOptions.contextLines,
        CompareOptions.browserview
    ],
    examples: [
        {
            description: strings.ACTIONS.DATA_SET.EXAMPLES.EX1,
            options: `"sys1.samplib(antptso)" "sys1.samplib(antxtso)"`
        },
        {
            description: strings.ACTIONS.DATA_SET.EXAMPLES.EX2,
            options: `"sys1.samplib(antptso)" "sys1.samplib(antxtso)" --no-seqnum`
        }
    ]
};
