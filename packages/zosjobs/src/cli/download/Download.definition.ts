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
import { OutputDefinition } from "./download-output/Output.definition";


export const DownloadDefinition: ICommandDefinition = {
    name: "download",
    aliases: ["dl"],
    type: "group",
    summary: "Download job output",
    description: "Download the output of a job as separate files.",
    children: [
        OutputDefinition,
    ],
};
