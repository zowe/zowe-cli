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

import { IImperativeConfig } from "../../../../../src/imperative";
import { ExperimentalExampleConstants } from "./ExperimentalExampleConstants";

const config: IImperativeConfig = {
    definitions: [
        {
            name: "is-not-experimental",
            description: "A command that is not experimental",
            type: "command",
            profile: {
                optional: ["profile-c"]
            },
            handler: __dirname + "/handlers/DummyHandler"
        },
        {
            name: "is-experimental",
            experimental: true,
            description: "this command is experimental",
            type: "command",
            handler: __dirname + "/handlers/DummyHandler"
        },
        {
            name: "has-all-experimental-children",
            description: "has experimental children",
            type: "group",
            children: [
                {
                    name: "an-experimental-child",
                    experimental: true,
                    type: "command",
                    description: "an experimental child",
                    handler: __dirname + "/handlers/DummyHandler"
                },
                {
                    name: "another-experimental-child",
                    experimental: true,
                    type: "command",
                    description: "another experimental child",
                    handler: __dirname + "/handlers/DummyHandler"
                }
            ]
        },
        {
            name: "has-some-experimental-children",
            description: "this command has some experimental children",
            type: "group",
            children: [
                {
                    name: "an-experimental-child",
                    type: "command",
                    experimental: true,
                    description: "an experimental child",
                    handler: __dirname + "/handlers/DummyHandler"
                },
                {
                    name: "a-non-experimental-child",
                    type: "command",
                    description: "another experimental child",
                    handler: __dirname + "/handlers/DummyHandler"
                }
            ]
        },
        {
            name: "experimental-parent",
            description: "this command's children will inherit the experimentalness",
            type: "group",
            experimental: true,
            children: [
                {
                    name: "child",
                    type: "command",
                    description: "will inherit being experimental despite not " +
                    "specifying it explicitly on this command",
                    handler: __dirname + "/handlers/DummyHandler"
                }
            ]
        }
    ],
    rootCommandDescription: "Sample command line interface",
    defaultHome: __dirname + "/../../../__results__/.examplewithexperimental",
    productDisplayName: "Test CLI with Profiles",
    name: "example_with_experimental",
    experimentalCommandDescription: ExperimentalExampleConstants.EXPERIMENTAL_DESCRIPTION
};

export = config;
