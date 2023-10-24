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
exports.CheckCommand = void 0;
const Status_definition_1 = require("./status/Status.definition");
exports.CheckCommand = {
    name: "check",
    type: "group",
    description: "Confirm that z/OSMF is running on a specified system " +
        "and gather information about the z/OSMF server for diagnostic purposes. ",
    children: [
        Status_definition_1.StatusDefinition
    ]
};
//# sourceMappingURL=Check.definition.js.map