/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandDefinition, ICommandOptionDefinition } from "@brightside/imperative";
import { ZosmfSession } from "../../../../../zosmf";

export const LocalFileDefinition: ICommandDefinition = {
    name: "local-file",
    aliases: ["lf"],
    type: "command",
    summary: "Submit a job contained in a local file",
    description: "Submit a job (JCL) contained in a local file. " +
        "The command presents errors verbatim from the z/OSMF Jobs REST endpoints. " +
        "For more information about z/OSMF Jobs API errors, see the z/OSMF Jobs API REST documentation.",
    handler: __dirname + "/../Submit.shared.handler",
    positionals: [
        {
            name: "localFile",
            description: "The local file containing the JCL to submit. ",
            type: "string",
            required: true
        }
    ],
    options: ([
        {
            name: "view-all-spool-content", aliases: ["vasc"],
            description: "View all spool content for specified job ID",
            type: "boolean"
        },
        {
            name: "directory", aliases: ["d"],
            description: "The local directory you would like to download the output for the job to. "
                + "Creates a subdirectory using the jobID as the name and files are titled based on DD names.",
            type: "string"
        },
        {
            name: "extension", aliases: ["e"],
            description: "A file extension to save the job output with",
            type: "string"
        },
    ]as ICommandOptionDefinition[]),
    profile: {
        optional: ["zosmf"]
    },
    outputFormatOptions: true,
    examples:
        [
            {
                options: "\"iefbr14.txt\"",
                description: "Submit the JCL in the file \"iefbr14.txt\""
            }
        ]
};
