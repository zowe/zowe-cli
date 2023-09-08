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

import { IImperativeConfig } from "../../../../lib/index";

// Example to use with tsnode: */*CommandDefinitions!(.d).*s
export const config: IImperativeConfig = {
    commandModuleGlobs: ["**/cli/*/*definition!(.d).*s"],
    rootCommandDescription: "A test CLI for the 'imperative' imperative package",
    defaultHome: "~/.imperative-test-cli",
    productDisplayName: "Imperative Package Test CLI",
    name: "imperative-test-cli",
    envVariablePrefix: "IMPERATIVE_TEST_CLI",
    allowPlugins: false,
    profiles: [
        {
            type: "secured",
            schema: {
                type: "object",
                title: "Test Secured Fields",
                description: "Test Secured Fields",
                properties: {
                    info: {
                        type: "string",
                        optionDefinition: {
                            name: "info",
                            description: "The info the keep in the profile.",
                            type: "string",
                            required: true,
                        }
                    },
                    secret: {
                        type: "string",
                        secure: true,
                        optionDefinition: {
                            name: "secret",
                            description: "The secret info the keep in the profile.",
                            type: "string",
                            required: true,
                        }
                    }
                }
            }
        }
    ]
};

module.exports = config;
