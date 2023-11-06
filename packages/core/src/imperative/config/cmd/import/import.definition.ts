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

import { ICommandDefinition } from "../../../../cmd/doc/ICommandDefinition";

const CONNECTION_OPTION_GROUP = "Connection Options";

/**
 * Definition of the import command.
 * @type {ICommandDefinition}
 */
export const importDefinition: ICommandDefinition = {
    name: "import",
    type: "command",
    handler: join(__dirname, "import.handler"),
    summary: "import config files",
    description: "Import config files from another location on disk or from an Internet URL.\n\n" +
        "If the config `$schema` property points to a relative path, the schema will also be imported.",
    positionals: [
        {
            name: "location",
            description: "File path or URL to import from.",
            required: true,
            type: "string"
        }
    ],
    options: [
        {
            name: "global-config",
            description: "Target the global config files.",
            aliases: ["gc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "user-config",
            description: "Target the user config files.",
            aliases: ["uc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "overwrite",
            description: "Overwrite config file if one already exists.",
            aliases: ["ow"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "user",
            aliases: ["u"],
            description: "User name if authentication is required to download the config from a URL.",
            type: "string",
            implies: ["password"],
            group: CONNECTION_OPTION_GROUP
        },
        {
            name: "password",
            aliases: ["pass", "pw"],
            description: "Password if authentication is required to download the config from a URL.",
            type: "string",
            implies: ["user"],
            group: CONNECTION_OPTION_GROUP
        },
        {
            name: "reject-unauthorized",
            aliases: ["ru"],
            description: "Reject self-signed certificates if config is downloaded from an HTTPS URL.",
            type: "boolean",
            defaultValue: true,
            group: CONNECTION_OPTION_GROUP
        }
    ],
    examples: [
        {
            description: "Import config from local file on disk",
            options: "~/Downloads/zowe.config.json"
        },
        {
            description: "Import global config from Internet URL",
            options: "https://example.com/zowe.config.json --global-config"
        }
    ]
};
