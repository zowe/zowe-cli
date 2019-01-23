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

import { ICommandDefinition } from "@brightside/imperative";
import { FileToDataSetDefinition } from "./ftds/FileToDataSet.definition";
import { StdinToDataSetDefinition } from "./stds/StdinToDataSet.definition";
import { DirToPdsDefinition } from "./dtp/DirToPds.definition";

import i18nTypings from "../-strings-/en";
import { FileToUSSDefinition } from "./ftu/FileToUSS.definition";
import { DirToUssDirDefinition } from "./dtu/DirToUssDir.definition";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../-strings-/en").default as typeof i18nTypings).UPLOAD;

/**
 * Upload group definition containing its description and children
 * @type {ICommandDefinition}
 */
export const UploadDefinition: ICommandDefinition = {
    name: "upload",
    aliases: ["ul"],
    type: "group",
    description: strings.DESCRIPTION,
    children: [
        FileToDataSetDefinition,
        StdinToDataSetDefinition,
        DirToPdsDefinition,
        FileToUSSDefinition,
        DirToUssDirDefinition,
    ],
};
