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

export const exportRedactedDefinition: ICommandDefinition = {
    name: "export-redacted",
    aliases: ["er"],
    type: "command",
    summary: "Export Zowe configuration with redacted values",
    description: "Export your Zowe configuration with sensitive values redacted and common properties given matching keys for " +
        "troubleshooting and sharing purposes.",
    handler: join(__dirname, "exportRedacted.handler"),
    options: [
        {
            name: "include-profiles",
            description: "Include all profile configurations in the export",
            type: "boolean",
            aliases: ["ip"],
            defaultValue: true
        },
        {
            name: "include-defaults",
            description: "Include default profile settings in the export",
            type: "boolean",
            aliases: ["id"],
            defaultValue: true
        },
        {
            name: "redact-strings",
            description: "Redact string values with consistent keys",
            type: "boolean",
            defaultValue: true
        },
        {
            name: "redact-numbers",
            description: "Redact numeric values with consistent keys",
            type: "boolean",
            defaultValue: true
        },
        {
            name: "redact-booleans",
            description: "Redact boolean values with consistent keys",
            type: "boolean",
            defaultValue: false
        },
        {
            name: "hide-secure-fields",
            description: "Hide secure field names from output (secure field names are shown by default since they don't contain sensitive values)",
            type: "boolean",
            defaultValue: false
        },
        {
            name: "redact-profile-names",
            description: "Redact profile names and their references in defaults section",
            type: "boolean",
            defaultValue: true
        },
        {
            name: "dry-run",
            description: "Show redacted config to stdout instead of exporting to directory",
            type: "boolean",
            defaultValue: false
        },
        {
            name: "export-dir",
            description: "Directory where config files will be exported. Defaults to current working directory.",
            type: "string",
            aliases: ["d"]
        }
    ],
    examples: [
        {
            description: "Export all config layers to current directory",
            options: ""
        },
        {
            description: "Export all config layers to specified directory",
            options: "--export-dir ./exported-configs"
        },
        {
            description: "Dry run - show redacted config to stdout",
            options: "--dry-run"
        },
        {
            description: "Export without redacting profile names",
            options: "--export-dir ./configs --no-redact-profile-names"
        }
    ]
};