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

import { join } from "path";
import { ICommandDefinition } from "../../../../../cmd";

export const updateSchemasDefinition: ICommandDefinition = {
    name: "update-schemas",
    aliases: ["us"],
    type: "command",
    summary: "Update schema files",
    description: "Update schema files by looking up the directory structure.\n\n" +
        "Schema files up in higher level directories will always be updated. " +
        "To also update schema files down in lower level directories, specify the `--depth` flag.",
    handler: join(__dirname, "update-schemas.handler"),
    positionals: [],
    options: [
        {
            name: "depth",
            description: "Specifies how many levels down the directory structure should the schemas be updated.",
            type: "number",
            defaultValue: 0
        },
    ],
    examples: [
        {
            description: "Update all schema files found in higher level directories",
            options: ``
        },
        {
            description: "Update all schema files found in higher level directories and 2 levels down the directory structure",
            options: `--depth 2`
        },
    ]
};
