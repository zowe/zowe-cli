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

import { ICommandDefinition } from "@brightside/imperative";

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
            "or a partitioned data set qualified by a member (for example, \"DATA.SET(MEMBER)\"). " +
            "The data set must be cataloged.",
            type: "string",
            required: true
        }
    ],
    profile: {
        required: ["zosmf"]
    },
    outputFormatOptions: true,
    examples:
        [
            {
                options: "\"ibmuser.cntl(deploy)\"",
                description: "Submit the JCL in the data set \"ibmuser.cntl(deploy)\""
            }
        ]
};
