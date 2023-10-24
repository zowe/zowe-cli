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
exports.DisableCommand = void 0;
exports.DisableCommand = {
    name: "disable",
    description: "Disables daemon-mode operation of the Zowe CLI.",
    type: "command",
    handler: __dirname + "/Disable.handler",
    examples: [
        {
            description: "Disable daemon-mode",
            options: ""
        }
    ]
};
//# sourceMappingURL=Disable.definition.js.map