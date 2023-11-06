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

export const setDefinition: ICommandDefinition = {
    name: "set",
    type: "command",
    handler: join(__dirname, "set.handler"),
    summary: "set configuration property",
    description: "create or update a configuration property",
    positionals: [
        {
            name: "property",
            description: "The property to set. You may specify a path using dot notation (e.g. profiles.host1.profiles.service1.properties.setting)",
            required: true,
            type: "string"
        },
        {
            name: "value",
            description: "The property value to set. The value may be JSON. Use '--json' to indicate.",
            type: "string"
        }
    ],
    options: [
        {
            name: "global-config",
            description: "Set the property in global config.",
            aliases: ["gc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "user-config",
            description: "Set the property in user config.",
            aliases: ["uc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "json",
            description: "The property value is JSON.",
            type: "boolean",
            defaultValue: false
        },
        {
            name: "secure",
            description: "Store the property value securely. " +
                "If omitted, any property named in the secure array of the config file will be saved securely.",
            type: "boolean"
        }
    ],
    examples: [
        {
            description: "Set the property in global config",
            options: `"profiles.host1.profiles.service1.properties.setting" "value" --global-config`
        },
        {
            description: "Set the property in user config",
            options: `"profiles.host1.profiles.service2.properties.setting" "value" --user-config`
        },
        {
            description: "Set property value to JSON",
            options: `"profiles.host1.profiles.service3.properties.setting" "{"property":"value"}" --json`
        },
        {
            description: "Store the property value",
            options: `"profiles.host1.profiles.service1.properties.setting" "value" --secure`
        },
        {
            description: "Set a default zosmf profile",
            options: `"defaults.zosmf" "zosmfProfileName"`
        },
        {
            description: "Set a default tso profile",
            options: `"defaults.tso" "tsoProfileName"`
        }
    ]
};
