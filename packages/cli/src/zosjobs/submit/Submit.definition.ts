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
import { DataSetDefinition } from "./data-set/DataSet.definition";
import { LocalFileDefinition } from "./local-file/localFile.definition";
import { StdinDefinition } from "./stdin/stdin.definition";

export const SubmitDefinition: ICommandDefinition = {
    name: "submit",
    aliases: ["sub"],
    type: "group",
    summary: "Submit z/OS jobs",
    description: "Submit jobs (JCL) contained in data sets.",
    children: [
        DataSetDefinition,
        LocalFileDefinition,
        StdinDefinition
    ]
};
