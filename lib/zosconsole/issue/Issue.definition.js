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
const Command_definition_1 = require("./command/Command.definition");
exports.IssueCommand = {
    name: "issue",
    type: "group",
    summary: "Issue z/OS console commands",
    description: "Issue z/OS console commands and optionally collect responses.",
    children: [
        Command_definition_1.IssueCommandDefinition
    ]
};
//# sourceMappingURL=Issue.definition.js.map