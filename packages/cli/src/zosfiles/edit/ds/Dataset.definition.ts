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
import { EditOptions } from "../Edit.options";
import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).EDIT;

/**
 * View data set command definition containing its description, examples and/or options
 * @type {ICommandDefinition}
 */
export const DatasetDefinition: ICommandDefinition = {
    name: "data-set",
    aliases: ["ds"],
    summary: strings.ACTIONS.DATA_SET.SUMMARY,
    description: strings.ACTIONS.DATA_SET.DESCRIPTION,
    type: "command",
    handler: __dirname.substring(0, __dirname.length-("ds").length) + "Edit.handler",
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
        EditOptions.editor,
        EditOptions.extension
    ],
    examples: [
        {
            description: strings.ACTIONS.DATA_SET.EXAMPLES.EX1,
            options: `"ibmuser.cntl(iefbr14)" --editor "notepad"`
        },
        {
            description: strings.ACTIONS.DATA_SET.EXAMPLES.EX1,
            options: `"ibmuser.cntl(iefbr14)" --editor "C:\\Windows\\System32\\Notepad.exe"`
        },
        {
            description: strings.ACTIONS.USS_FILE.EXAMPLES.EX2,
            options: `"ibmuser.jcl(iefbr14)" --editor "notepad" --extension "jcl"`
        }
    ]
};
