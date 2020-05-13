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

import { ICommandDefinition } from "@zowe/imperative";
import { ZosmfSession } from "../../../../../zosmf/src/api/ZosmfSession";

export const ApimlCommand: ICommandDefinition = {
    name: "apiml",
    type: "command",
    description: "Login to API Mediation Layer and obtain or update a token value. " +
    "The token allows for a faster server-side request and cannot be transformed into native mainframe user credentials." +
    " Alternatively, you may provide \"user\" and \"password\" on a command, in an environmental variable, or in a profile." +
    " See a specific command's help via \"--help\" for more information.",
    handler: __dirname + "/Apiml.handler",
    profile: {
        optional: ["zosmf"]
    },
    options: [
        ...ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
        {
            name: "json-web-token", aliases: ["jwt"],
            description: "Login and obtain JWT token instead of default LTPA2.",
            type: "boolean"
        }
    ],
    examples: [
        {
            description: "Login to an instance of API ML in order to obtain or update the " +
                "token value stored into your z/OSMF profile",
            options: ""
        }
    ]
};
