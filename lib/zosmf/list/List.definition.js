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
exports.ListCommand = void 0;
const Systems_definition_1 = require("./systems/Systems.definition");
exports.ListCommand = {
    name: "list",
    type: "group",
    description: "Obtain a list of systems that are defined to a z/OSMF instance.",
    children: [
        Systems_definition_1.SystemsDefinition
    ]
};
//# sourceMappingURL=List.definition.js.map