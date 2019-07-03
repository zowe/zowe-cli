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

import { ICommandDefinition, ICommandOptionDefinition } from "@zowe/imperative";

export const StdinDefinition: ICommandDefinition = {
    name: "stdin",
    aliases: ["in"],
    type: "command",
    summary: "Submit a job read from standard in",
    description: "Submit a job (JCL) passed to the command via the stdin stream. " +
        "The command presents errors verbatim from the z/OSMF Jobs REST endpoints. " +
        "For more information about z/OSMF Jobs API errors, see the z/OSMF Jobs API REST documentation.",
    handler: __dirname + "/../Submit.shared.handler",
    options: ([
        {
            name: "view-all-spool-content", aliases: ["vasc"],
            description: "Print all spool output." +
                " If you use this option you will wait the job to complete.",
            type: "boolean"
        },
        {
            name: "directory", aliases: ["d"],
            description: "The local directory you would like to download the output of the job." +
                " Creates a subdirectory using the jobID as the name and files are titled based on DD names." +
                " If you use this option you will wait the job to complete.",
            type: "string"
        },
        {
            name: "extension", aliases: ["e"],
            description: "A file extension to save the job output with. Default is '.txt'.",
            type: "string"
        },
    ] as ICommandOptionDefinition[]),
    profile: {
        optional: ["zosmf"]
    },
    outputFormatOptions: true,
};
