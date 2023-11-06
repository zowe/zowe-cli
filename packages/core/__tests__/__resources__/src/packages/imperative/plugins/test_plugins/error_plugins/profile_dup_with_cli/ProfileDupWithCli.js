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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileDupWithCli = {
    type: "TestProfile1",   // same type exists in testCLI.ts This should give an error !!!
    schema: {
        type: "object",
        title: "The Bar command profile schema",
        description: "Credentials for the Bar command",
        properties: {
            username: {
                optionDefinition: {
                    description: "The username to associate to this profile",
                    type: "string",
                    name: "username",
                    required: true
                },
                type: "string"
            },
          password: {
                optionDefinition: {
                    description: "The password to associate to this profile",
                    type: "string",
                    name: "password",
                    required: true
                },
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=BarProfileConfig.js.map