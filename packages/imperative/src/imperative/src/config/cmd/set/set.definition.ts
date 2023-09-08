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

import { ICommandDefinition } from "../../../../../cmd";
import { join } from "path";

/**
 * Definition of the list command.
 * @type {ICommandDefinition}
 */
export const setDefinition: ICommandDefinition = {
    name: "set",
    aliases: ["se"],
    type: "command",
    handler: join(__dirname, "set.handler"),
    summary: "Set a configuration setting",
    description: "Set a configuration setting.",
    positionals: [
        {
            name: "configName",
            type: "string",
            description: "Setting name. Possible values:\n" +
            "CredentialManager - The package name of a plugin that will override the default " +
            "credential manager to allow for different credential storage methods.",
            required: true
        },
        {
            name: "configValue",
            type: "string",
            description: "Value to set",
            required: true
        },
    ],
    examples: [
        {
            options: "CredentialManager my-credential-manager",
            description: "Set the default credential manager to my-credential-manager"
        }
    ],
};
