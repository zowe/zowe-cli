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
import { ZosmfSession } from "../../../api/ZosmfSession";

export const ServerDefinition: ICommandDefinition = {
    name: "server",
    description: "Logon to to z/OSMF and obtain or update a token value. " +
        "The token allows for a faster server-side request and cannot be transformed into native mainframe user credentials.",
    type: "command",
    handler: __dirname + "/Server.handler",
    profile: {
        optional: ["zosmf"],
    },
    options: ZosmfSession.ZOSMF_CONNECTION_OPTIONS,
    examples: [
        {
            description: "Logon to an instance of z/OSMF in order to obtain or update they " +
                "token value stored into your z/OSMF profile",
            options: ""
        },
    ]
};
