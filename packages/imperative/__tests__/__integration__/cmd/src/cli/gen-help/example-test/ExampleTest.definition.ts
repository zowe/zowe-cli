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

import { ICommandDefinition } from "../../../../../../../lib";


export const ExampleTestDefinition: ICommandDefinition = {
    name: "example-test",
    aliases: ["et"],
    description: "Displays example inputs in the help!",
    type: "command",
    handler: __dirname + "/ExampleTest.handler",
    options: [
        {
            name: "Sample Option",
            description: "has some allowable options and a default " + "Lorem ipsum dolor sit amet, consectetur adipiscing elit, " +
                "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, " +
                "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. " +
                "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat " +
                "nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia " +
                "deserunt.",
            type: "string",
            defaultValue: "these",
            allowableValues: {
                values: ["these", "are", "the", "allowable", "values"]
            }
        }
    ],
    examples:
        [
            {
                options: "",
                description: "Tests no options"
            },
            {
                options: "testop",
                description: "Tests one option"
            },
            {
                options: "testop1 testop2 testop3",
                description: "Tests several options"
            },
            {
                options: "nodesc",
                description: ""
            },
            {
                options: "",
                description: ""
            },
            {
                description: "has a prefix",
                prefix: "echo \"hello world\" |",
                options: "--options"
            }
        ]
};
