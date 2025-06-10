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
import { ImperativeConfig } from "../../../../../utilities";

/**
 * Defbuildion of the build command - the term is meant to be broad so that it might later include editing as well as creating with a TUI/GUI
 * @type {ICommandDefbuildion}
 */
export const buildDefinition: ICommandDefinition = {
    name: "build",
    type: "command",
    handler: join(__dirname, "build.handler"),
    summary: "build config files",
    description: `build config files. Defaults to build "${ImperativeConfig.instance.rootCommandName}.config.json" in the current ` +
        `working directory unless otherwise specified.\n\nUse "--user-config" to build ` +
        `"${ImperativeConfig.instance.rootCommandName}.config.user.json with a TUI". Use "--global-config" ` +
        `to build the configuration files in your home ` +
        `"~/.zowe" directory.`,
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
    ],
    examples: [
        {
            description: `build configuration files in your home "~/.zowe" directory`,
            options: "--global-config"
        },
        {
            description: "build the user config files",
            options: "--user-config"
        }
    ]
};
