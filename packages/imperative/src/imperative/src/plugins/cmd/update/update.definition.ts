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

const allowScriptsDescription =
    "A comma-separated list of package names that are allowed to run their npm install scripts " +
    "(preinstall, install, postinstall, and prepare). The names must match exactly. Zowe passes " +
    "this list to npm as its own --allow-scripts option.\n" +
    "\n" +
    "npm 12 blocks these scripts unless the package is in the list. This breaks plug-ins that " +
    "have a dependency that must be built during install, such as the Db2 plug-in and its " +
    "ibm_db dependency. Older versions of npm do not know this option and ignore it, so using " +
    "this option does not change how they work. If you do not use this option, Zowe does not " +
    "pass anything to npm, and npm decides what to do.\n" +
    "\n" +
    "Only list packages that you trust. Install scripts can run any code on your machine.";

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
        },
        {
            name: "allow-scripts",
            type: "string",
            description: allowScriptsDescription,
            required: false
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
        },
        {
            description: "Update a plug-in and let one of its dependencies run its npm install scripts",
            options: "my-plugin --allow-scripts=\"ibm_db\""
        }
    ]
};
