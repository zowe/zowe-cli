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

import {ICommandDefinition} from "npm:@zowe/imperative";
import {DatasetDefinition} from "./ds/Dataset.definition";
import { LocalfileDatasetDefinition } from "./lf-ds/LocalfileDataset.definition";
import {UssFileDefinition} from './uss/UssFile.definition';
import { LocalfileUssFileDefinition } from "./lf-uss/LocalfileUss.definition";
import { SpoolddDefinition } from "./sdd/Spooldd.definition";
import { LocalfileSpoolddDefinition } from "./lf-sdd/LocalfileSpooldd.definition";

import i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).COMPARE;

/**
 * Compare group definition containing its description and children
 * @type {ICommandDefinition}
 */
export const CompareDefinition: ICommandDefinition = {
    name: "compare",
    aliases: ["cmp"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        DatasetDefinition,
        LocalfileDatasetDefinition,
        UssFileDefinition,
        LocalfileUssFileDefinition,
        SpoolddDefinition,
        LocalfileSpoolddDefinition
    ],
};
