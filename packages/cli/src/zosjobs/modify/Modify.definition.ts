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
import { JobDefinition } from "./job/Job.definition";

import i18nTypings from "../-strings-/en";

const strings = (require("../-strings-/en").default as typeof i18nTypings).MODIFY;

export const ModifyDefinition: ICommandDefinition = {
    name: "modify",
    aliases: ["mod"],
    type: "group",
    summary: strings.SUMMARY,
    description: strings.DESCRIPTION,
    children: [
        JobDefinition
    ]
};
