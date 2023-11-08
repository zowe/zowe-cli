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

import { IImperativeConfig } from "../../../../../../src/imperative";
import * as path from "path";

const config: IImperativeConfig = {
    definitions: [
        {
            name: "display-profile",
            description: "Display profile content",
            type: "command",
            profile: {
                required: ["username-password"]
            },
            handler: path.join(__dirname, "handlers", "DisplayProfileHandler.ts")
        }
    ],
    rootCommandDescription: "Sample command line interface",
    defaultHome: path.join(__dirname, "../../../../../__results__/.packages-profiles"),
    productDisplayName: "Test CLI with Profiles",
    name: "example_with_profiles",
    profiles: [
        {
            type: "username-password",
            schema: {
                type: "object",
                title: "Profile Manager Test Profile",
                description: "user name and password test profile",
                properties: {
                    username: {
                        optionDefinition: {
                            description: "Username",
                            type: "string",
                            name: "username",
                            required: true
                        },
                        secure: true,
                        type: "string"
                    },
                    password: {
                        optionDefinition: {
                            description: "Password",
                            type: "string",
                            name: "password",
                            required: true
                        },
                        secure: true,
                        type: "string"
                    }
                },
            },
        }],
    overrides: {
        CredentialManager: "./customCredential/CustomCredentialManager.ts"
    }
};

export = config;
