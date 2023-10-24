"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueCommand = void 0;
const Ssh_definition_1 = require("./ssh/Ssh.definition");
/**
 * Definition for the "issue" group of commands under the Shell plugin
 */
exports.IssueCommand = {
    name: "issue", aliases: ["iss"],
    summary: "Issue a command",
    description: "Issue a z/OS USS command.",
    type: "group",
    children: [Ssh_definition_1.SshDefinition]
};
//# sourceMappingURL=Issue.definition.js.map