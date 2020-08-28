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
import { ZosmfSession } from "../../../../../zosmf";

export const DataSetDefinition: ICommandDefinition = {
    name: "data-set",
    aliases: ["ds"],
    type: "command",
    summary: "Submit a job contained in a data set",
    description: "Submit a job (JCL) contained in a data set. The data set may be of type physical sequential or a " +
        "PDS member. The command does not pre-validate the data set name. " +
        "The command presents errors verbatim from the z/OSMF Jobs REST endpoints. " +
        "For more information about z/OSMF Jobs API errors, see the z/OSMF Jobs API REST documentation.",
    handler: __dirname + "/../Submit.shared.handler",
    positionals: [
        {
            name: "dataset",
            description: "The z/OS data set containing the JCL to submit. " +
                "You can specify a physical sequential data set (for example, \"DATA.SET\") " +
                "or a partitioned data set qualified by a member (for example, \"DATA.SET(MEMBER)\"). ",
            type: "string",
            required: true
        }
    ],
    options: ([
        {
            name: "volume", aliases: ["vol"],
            description: "The volume serial (VOLSER) where the data set resides. The option is required only when the data set is not" +
                " catalogued on the system.",
            type: "string"
        },
        {
            name: "wait-for-output", aliases: ["wfo"],
            description: "Wait for the job to enter OUTPUT status before completing the command.",
            type: "boolean"
        },
        {
            name: "wait-for-active", aliases: ["wfa"],
            description: "Wait for the job to enter ACTIVE status before completing the command.",
            type: "boolean",
            conflictsWith: ["wait-for-output", "view-all-spool-content", "directory"]
        },
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
            implies: ["directory"],
            type: "string"
        }
    ] as ICommandOptionDefinition[]),
    profile: {
        optional: ["zosmf"]
    },
    outputFormatOptions: true,
    examples:
        [
            {
                options: "\"ibmuser.cntl(deploy)\"",
                description: "Submit the JCL in the data set \"ibmuser.cntl(deploy)\""
            },
            {
                options: "\"ibmuser.cntl(deploy)\" --vasc",
                description: "Submit the JCL in the data set \"ibmuser.cntl(deploy)\", wait for the job to " +
                    "complete and print all output from the job"
            }
        ]
};
