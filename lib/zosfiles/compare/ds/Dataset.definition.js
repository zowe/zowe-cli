"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetDefinition = void 0;
const Compare_options_1 = require("../Compare.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.COMPARE;
/**
 * Compare data sets command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
exports.DatasetDefinition = {
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
        Compare_options_1.CompareOptions.binary,
        Compare_options_1.CompareOptions.binary2,
        Compare_options_1.CompareOptions.encoding,
        Compare_options_1.CompareOptions.encoding2,
        Compare_options_1.CompareOptions.record,
        Compare_options_1.CompareOptions.record2,
        Compare_options_1.CompareOptions.volume,
        Compare_options_1.CompareOptions.volume2,
        Compare_options_1.CompareOptions.seqnum,
        Compare_options_1.CompareOptions.contextLines,
        Compare_options_1.CompareOptions.browserView
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
//# sourceMappingURL=Dataset.definition.js.map