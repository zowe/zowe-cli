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

import { ICommandDefinition } from "@zowe/imperative";
import { join } from "path";

/**
 * This object defines the command for listing archived z/OSMF workflows for a system or sysplex.
 * This is not something that is intended to be used outside of this npm package.
 *
 * @private
 */
export const ArchivedWorkflows: ICommandDefinition = {
    name: "archived-workflows",
    aliases: ["arw"],
    summary: "List all archived workflows for a system.",
    description: "List the archived z/OSMF workflows for a system or sysplex.",
    type: "command",
    handler: join(__dirname, "ArchivedWorkflows.handler"),
    profile: {
        optional: ["zosmf"],
    },
    outputFormatOptions: true,
};
