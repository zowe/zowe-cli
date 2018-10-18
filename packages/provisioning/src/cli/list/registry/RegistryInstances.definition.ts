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
import * as path from "path";

export const registryInstances: ICommandDefinition = {
    name: "registry-instances",
    aliases: ["ri"],
    type: "command",
    summary: "List provisioned instances.",
    description: "List the provisioned instances from the z/OSMF software registry.",
    handler:  path.join(__dirname, "/RegistryInstances.handler"),
    profile: {
        optional: ["zosmf"]
    },
    options: [
        {
            name: "all-info",
            aliases: ["ai"],
            description: "Display all available information about provisioned instances (summary by default).",
            type: "boolean"
        },
        {
            name: "filter-by-type",
            aliases: ["fbt"],
            description: "Filter the list of provisioned instances by type (e.g. DB2 or CICS).",
            type: "string"
        },
        {
            name: "filter-by-external-name",
            aliases: ["fben"],
            description: "Filter the list of provisioned instances by External Name.",
            type: "string"
        },
        {
            name: "types",
            aliases: ["t"],
            description: "Display a list of all types for provisioned instances (e.g. DB2 or CICS).",
            type: "boolean"
        },
    ],
    examples: [
        {
            description: "List all provisioned instances (with full detail)",
            options: "--all-info",
        }
    ]
};
