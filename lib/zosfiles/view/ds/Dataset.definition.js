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
const View_options_1 = require("../View.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.VIEW;
/**
 * View data set command definition containing its description, examples and/or options
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
            name: "dataSetName",
            description: strings.ACTIONS.DATA_SET.POSITIONALS.DATASETNAME,
            type: "string",
            required: true
        },
    ],
    options: [
        View_options_1.ViewOptions.binary,
        View_options_1.ViewOptions.encoding,
        View_options_1.ViewOptions.record,
        View_options_1.ViewOptions.volume,
        View_options_1.ViewOptions.range
    ],
    examples: [
        {
            description: strings.ACTIONS.DATA_SET.EXAMPLES.EX1,
            options: `"ibmuser.cntl(iefbr14)"`
        },
        {
            description: strings.ACTIONS.DATA_SET.EXAMPLES.EX2,
            options: `"ibmuser.test.loadlib(main)" --binary`
        },
        {
            description: strings.ACTIONS.DATA_SET.EXAMPLES.EX3,
            options: `"ibmuser.cntl(iefbr14)" --range 0,2`
        },
        {
            description: strings.ACTIONS.DATA_SET.EXAMPLES.EX4,
            options: `"ibmuser.cntl(iefbr14)" --range 5-7`
        }
    ]
};
//# sourceMappingURL=Dataset.definition.js.map