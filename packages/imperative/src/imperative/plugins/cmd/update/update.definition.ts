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

const pluginDescription =
  "The name of the plug-in to update.\n\n" +
  "If the plug-in argument is omitted, no action is taken.";

const registryDescription =
  "The npm registry that is used when installing remote packages. When this value is omitted, the " +
  "value returned by `npm config get registry` is used.\n" +
  "\n" +
  "For more information about npm registries, see: " +
  "https://docs.npmjs.com/misc/registry";

const loginDescription =
    "The flag to add a registry user account to install from secure registry. It saves credentials " +
    "to the .npmrc file using `npm login`. When this value is omitted, credentials from .npmrc file is used. " +
    "If you used this flag once for specific registry, you don't have to use it again, it uses credentials from .npmrc file.\n" +
    "\n" +
    "For more information about npm registries, see: \n" +
    "https://docs.npmjs.com/cli/login for NPM >= 9\n" +
    "https://docs.npmjs.com/cli/adduser for NPM < 9";

/**
 * Definition of the update command.
 * @type {ICommandDefinition}
 */
export const updateDefinition: ICommandDefinition = {
    name: "update",
    type: "command",
    summary: "Update a plug-in",
    description: "Update plug-ins.",
    handler: join(__dirname, "update.handler"),
    positionals: [
        {
            name: "plugin...",
            type: "string",
            description: pluginDescription,
            required: false
        }
    ],
    options: [
        {
            name: "registry",
            type: "string",
            description: registryDescription,
            required: false
        },
        {
            name: "login",
            type: "boolean",
            description: loginDescription,
            required: false,
            implies: ["registry"]
        }
    ],
    examples: [
        {
            description: "Update a plug-in",
            options    : "my-plugin"
        },
        {
            description: "Update a remote plug-in from the registry which requires authorization" +
      "(don't need to use this flag if you have already logged in before)",
            options: "my-plugin --registry https://registry.npmjs.org/ --login"
        }
    ]
};
